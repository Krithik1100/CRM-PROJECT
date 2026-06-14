import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { campaignRepository } from './campaign.repository';
import { communicationRepository } from '../communications/communication.repository';
import { segmentRepository } from '../segments/segment.repository';
import { customerRepository } from '../customers/customer.repository';
import { aiService } from '../segments/ai.service';
import { NotFoundError, AppError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';
import { FilterJson } from '../segments/filter.translator';

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002';
const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL || 'http://localhost:3001';

export const campaignService = {
  async listCampaigns() {
    return campaignRepository.findAll();
  },

  async getCampaign(id: string) {
    const campaign = await campaignRepository.findById(id);
    if (!campaign) throw new NotFoundError('Campaign');
    const communications = await communicationRepository.getByCampaign(id);
    return { ...campaign, communications };
  },

  async copilot(goal: string) {
    const stats = await customerRepository.getStats();
    const recommendation = await aiService.generateCampaignRecommendation(goal, stats);

    // Pre-compute segment size
    const { count } = await segmentRepository.computeCustomers(recommendation.filterJson as FilterJson);

    return { ...recommendation, estimatedAudience: count };
  },

  async createCampaign(data: {
    name: string;
    goal?: string;
    segment_id?: string;
    channel: string;
    message_template: string;
    ai_reasoning?: string;
  }) {
    return campaignRepository.create(data);
  },

  async deleteCampaign(id: string) {
    const campaign = await campaignRepository.findById(id);
    if (!campaign) throw new NotFoundError('Campaign');
    await campaignRepository.delete(id);
    return { deleted: true, campaignId: id };
  },

  async launchCampaign(id: string) {
    const campaign = await campaignRepository.findById(id);
    if (!campaign) throw new NotFoundError('Campaign');
    if (campaign.status !== 'draft') {
      throw new AppError('Campaign has already been launched', 409);
    }

    // Get target customers
    let customerIds: string[] = [];

    if (campaign.segment_id) {
      const segment = await segmentRepository.findById(campaign.segment_id);
      if (!segment) throw new NotFoundError('Segment');
      customerIds = await segmentRepository.getCustomerIds(segment.filter_json);
    } else {
      throw new AppError('Campaign has no segment assigned', 400);
    }

    if (customerIds.length === 0) {
      throw new AppError('Segment has no matching customers', 400);
    }

    logger.info(`Launching campaign ${id} to ${customerIds.length} customers via ${campaign.channel}`);

    // Update campaign to sending
    await campaignRepository.updateStatus(id, 'sending', { sent_at: new Date().toISOString() });

    // Build and persist communications (batched)
    const BATCH_SIZE = 50;
    const allCommunications = [];

    for (const customerId of customerIds) {
      const customer = await customerRepository.findById(customerId);
      if (!customer) continue;

      const recipient = campaign.channel === 'email' ? customer.email : customer.phone;
      if (!recipient) continue;

      const personalizedMessage = await aiService.personalizeMessage(campaign.message_template, {
        name: customer.name,
        city: customer.city,
        last_order_at: customer.last_order_at,
        total_spent: customer.total_spent,
      });

      allCommunications.push({
        campaign_id: id,
        customer_id: customerId,
        channel: campaign.channel,
        recipient,
        message: personalizedMessage,
        status: 'queued' as const,
        idempotency_key: `${id}:${customerId}:${campaign.channel}`,
      });
    }

    // Save all communications
    for (let i = 0; i < allCommunications.length; i += BATCH_SIZE) {
      await communicationRepository.createBatch(allCommunications.slice(i, i + BATCH_SIZE));
    }

    // Fire & forget: send to channel service asynchronously
    // At scale: this would be a job queue (BullMQ/SQS)
    sendToChannelServiceAsync(id, allCommunications, campaign.channel);

    return { campaignId: id, totalTargeted: allCommunications.length };
  },

  async getOverviewStats() {
    return campaignRepository.getOverviewStats();
  },
};

/**
 * Fire-and-forget: sends all communications to the channel service.
 * We don't await this — it runs in background. The channel service calls back via /api/callbacks.
 * At scale: replace with a job queue (BullMQ, SQS) and a worker process.
 */
async function sendToChannelServiceAsync(
  campaignId: string,
  communications: Array<{ campaign_id: string; customer_id: string; channel: string; recipient: string; message: string; idempotency_key: string }>,
  channel: string
) {
  // Find actual communication IDs from DB (they were just inserted)
  const dbComms = await communicationRepository.getByCampaign(campaignId, 10000);
  const commMap = new Map(dbComms.map(c => [c.idempotency_key, c.id]));

  for (const comm of communications) {
    const commId = commMap.get(comm.idempotency_key);
    if (!commId) continue;

    try {
      // Non-blocking: channel service will callback later
      axios.post(`${CHANNEL_SERVICE_URL}/api/channel/send`, {
        communicationId: commId,
        campaignId,
        channel,
        recipient: comm.recipient,
        message: comm.message,
        callbackUrl: `${CRM_CALLBACK_URL}/api/callbacks/communication-event`,
      }).catch((err) => {
        logger.error('Failed to send to channel service', { commId, error: err.message });
      });

      // Small delay to avoid overwhelming the channel service in demo
      // At scale: remove this — use a proper queue with rate limiting
      await new Promise(r => setTimeout(r, 20));
    } catch (err) {
      logger.error('Channel service dispatch error', { commId });
    }
  }

  logger.info(`Dispatched ${communications.length} messages to channel service for campaign ${campaignId}`);
}
