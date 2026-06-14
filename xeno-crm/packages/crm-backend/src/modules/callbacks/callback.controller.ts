import { Request, Response, NextFunction } from 'express';
import { communicationRepository } from '../communications/communication.repository';
import { campaignRepository } from '../campaigns/campaign.repository';
import { logger } from '../../shared/utils/logger';
import { sendSuccess } from '../../shared/utils/response';

// Status progression — each event can only move forward
const STATUS_ORDER = ['queued', 'sent', 'delivered', 'failed', 'opened', 'read', 'clicked', 'purchased'];

function isStatusProgression(current: string, next: string): boolean {
  const currentIdx = STATUS_ORDER.indexOf(current);
  const nextIdx = STATUS_ORDER.indexOf(next);
  return nextIdx > currentIdx;
}

const STAT_MAP: Record<string, string> = {
  sent: 'total_sent',
  delivered: 'total_delivered',
  failed: 'total_failed',
  opened: 'total_opened',
  read: 'total_read',
  clicked: 'total_clicked',
  purchased: 'total_purchased',
};

export const callbackController = {
  async handleCommunicationEvent(req: Request, res: Response, next: NextFunction) {
    const { communicationId, campaignId, eventType, eventData, idempotencyKey } = req.body;

    if (!communicationId || !campaignId || !eventType || !idempotencyKey) {
      res.status(400).json({ success: false, error: { message: 'Missing required fields' } });
      return;
    }

    try {
      // 1. Idempotency check — record event (returns false if duplicate)
      const isNew = await communicationRepository.recordEvent({
        communication_id: communicationId,
        event_type: eventType,
        event_data: eventData || {},
        idempotency_key: idempotencyKey,
      });

      if (!isNew) {
        logger.debug('Duplicate event ignored', { idempotencyKey, eventType });
        // Acknowledge to channel service regardless — it succeeded, just already processed
        sendSuccess(res, { processed: false, reason: 'duplicate' });
        return;
      }

      // 2. Update communication status (only if it's a valid progression)
      const communication = await communicationRepository.findById(communicationId);
      if (communication && isStatusProgression(communication.status, eventType)) {
        await communicationRepository.updateStatus(communicationId, eventType);
      }

      // 3. Increment campaign stat counter
      const statField = STAT_MAP[eventType];
      if (statField) {
        await campaignRepository.incrementStat(campaignId, statField);
      }

      // 4. For purchase events, attribute revenue
      if (eventType === 'purchased' && eventData?.order_amount) {
        await campaignRepository.addRevenue(campaignId, Number(eventData.order_amount));
      }

      // 5. Check if campaign is complete (all sent have terminal status)
      // Simplified: mark complete if no queued/sent comms remain after a delay
      // At scale: use a separate completion-checker worker
      checkCampaignCompletion(campaignId);

      logger.info('Communication event processed', { communicationId, eventType, campaignId });
      sendSuccess(res, { processed: true });
    } catch (err) {
      logger.error('Callback processing error', { err, communicationId, eventType });
      next(err);
    }
  },
};

/**
 * Non-blocking campaign completion checker.
 * Runs asynchronously after each event — marks campaign complete when all comms have terminal status.
 * At scale: run as a scheduled job, not per-event.
 */
async function checkCampaignCompletion(campaignId: string) {
  setTimeout(async () => {
    try {
      const { query } = await import('../../db/pool');
      const result = await query<{ pending: string }>(
        `SELECT COUNT(*) as pending FROM communications
         WHERE campaign_id = $1
           AND status NOT IN ('failed', 'delivered', 'opened', 'read', 'clicked', 'purchased')`,
        [campaignId]
      );
      const pending = parseInt(result[0]?.pending || '0');

      if (pending === 0) {
        await campaignRepository.updateStatus(campaignId, 'completed', {
          completed_at: new Date().toISOString(),
        });
        logger.info(`Campaign ${campaignId} marked as completed`);
      }
    } catch (err) {
      logger.error('Completion check error', { campaignId, err });
    }
  }, 2000); // Wait 2s before checking — gives other callbacks time to arrive
}
