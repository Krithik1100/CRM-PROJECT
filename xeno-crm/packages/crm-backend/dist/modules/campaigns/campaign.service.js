"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignService = void 0;
const axios_1 = __importDefault(require("axios"));
const campaign_repository_1 = require("./campaign.repository");
const communication_repository_1 = require("../communications/communication.repository");
const segment_repository_1 = require("../segments/segment.repository");
const customer_repository_1 = require("../customers/customer.repository");
const ai_service_1 = require("../segments/ai.service");
const errors_1 = require("../../shared/errors");
const logger_1 = require("../../shared/utils/logger");
const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002';
const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL || 'http://localhost:3001';
exports.campaignService = {
    async listCampaigns() {
        return campaign_repository_1.campaignRepository.findAll();
    },
    async getCampaign(id) {
        const campaign = await campaign_repository_1.campaignRepository.findById(id);
        if (!campaign)
            throw new errors_1.NotFoundError('Campaign');
        const communications = await communication_repository_1.communicationRepository.getByCampaign(id);
        return { ...campaign, communications };
    },
    async copilot(goal) {
        const stats = await customer_repository_1.customerRepository.getStats();
        const recommendation = await ai_service_1.aiService.generateCampaignRecommendation(goal, stats);
        // Pre-compute segment size
        const { count } = await segment_repository_1.segmentRepository.computeCustomers(recommendation.filterJson);
        return { ...recommendation, estimatedAudience: count };
    },
    async createCampaign(data) {
        return campaign_repository_1.campaignRepository.create(data);
    },
    async deleteCampaign(id) {
        const campaign = await campaign_repository_1.campaignRepository.findById(id);
        if (!campaign)
            throw new errors_1.NotFoundError('Campaign');
        await campaign_repository_1.campaignRepository.delete(id);
        return { deleted: true, campaignId: id };
    },
    async launchCampaign(id) {
        const campaign = await campaign_repository_1.campaignRepository.findById(id);
        if (!campaign)
            throw new errors_1.NotFoundError('Campaign');
        if (campaign.status !== 'draft') {
            throw new errors_1.AppError('Campaign has already been launched', 409);
        }
        // Get target customers
        let customerIds = [];
        if (campaign.segment_id) {
            const segment = await segment_repository_1.segmentRepository.findById(campaign.segment_id);
            if (!segment)
                throw new errors_1.NotFoundError('Segment');
            customerIds = await segment_repository_1.segmentRepository.getCustomerIds(segment.filter_json);
        }
        else {
            throw new errors_1.AppError('Campaign has no segment assigned', 400);
        }
        if (customerIds.length === 0) {
            throw new errors_1.AppError('Segment has no matching customers', 400);
        }
        logger_1.logger.info(`Launching campaign ${id} to ${customerIds.length} customers via ${campaign.channel}`);
        // Update campaign to sending
        await campaign_repository_1.campaignRepository.updateStatus(id, 'sending', { sent_at: new Date().toISOString() });
        // Build and persist communications (batched)
        const BATCH_SIZE = 50;
        const allCommunications = [];
        for (const customerId of customerIds) {
            const customer = await customer_repository_1.customerRepository.findById(customerId);
            if (!customer)
                continue;
            const recipient = campaign.channel === 'email' ? customer.email : customer.phone;
            if (!recipient)
                continue;
            const personalizedMessage = await ai_service_1.aiService.personalizeMessage(campaign.message_template, {
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
                status: 'queued',
                idempotency_key: `${id}:${customerId}:${campaign.channel}`,
            });
        }
        // Save all communications
        for (let i = 0; i < allCommunications.length; i += BATCH_SIZE) {
            await communication_repository_1.communicationRepository.createBatch(allCommunications.slice(i, i + BATCH_SIZE));
        }
        // Fire & forget: send to channel service asynchronously
        // At scale: this would be a job queue (BullMQ/SQS)
        sendToChannelServiceAsync(id, allCommunications, campaign.channel);
        return { campaignId: id, totalTargeted: allCommunications.length };
    },
    async getOverviewStats() {
        return campaign_repository_1.campaignRepository.getOverviewStats();
    },
};
/**
 * Fire-and-forget: sends all communications to the channel service.
 * We don't await this — it runs in background. The channel service calls back via /api/callbacks.
 * At scale: replace with a job queue (BullMQ, SQS) and a worker process.
 */
async function sendToChannelServiceAsync(campaignId, communications, channel) {
    // Find actual communication IDs from DB (they were just inserted)
    const dbComms = await communication_repository_1.communicationRepository.getByCampaign(campaignId, 10000);
    const commMap = new Map(dbComms.map(c => [c.idempotency_key, c.id]));
    for (const comm of communications) {
        const commId = commMap.get(comm.idempotency_key);
        if (!commId)
            continue;
        try {
            // Non-blocking: channel service will callback later
            axios_1.default.post(`${CHANNEL_SERVICE_URL}/api/channel/send`, {
                communicationId: commId,
                campaignId,
                channel,
                recipient: comm.recipient,
                message: comm.message,
                callbackUrl: `${CRM_CALLBACK_URL}/api/callbacks/communication-event`,
            }).catch((err) => {
                logger_1.logger.error('Failed to send to channel service', { commId, error: err.message });
            });
            // Small delay to avoid overwhelming the channel service in demo
            // At scale: remove this — use a proper queue with rate limiting
            await new Promise(r => setTimeout(r, 20));
        }
        catch (err) {
            logger_1.logger.error('Channel service dispatch error', { commId });
        }
    }
    logger_1.logger.info(`Dispatched ${communications.length} messages to channel service for campaign ${campaignId}`);
}
//# sourceMappingURL=campaign.service.js.map