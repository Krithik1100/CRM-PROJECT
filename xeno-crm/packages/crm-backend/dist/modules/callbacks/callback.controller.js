"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.callbackController = void 0;
const communication_repository_1 = require("../communications/communication.repository");
const campaign_repository_1 = require("../campaigns/campaign.repository");
const logger_1 = require("../../shared/utils/logger");
const response_1 = require("../../shared/utils/response");
// Status progression — each event can only move forward
const STATUS_ORDER = ['queued', 'sent', 'delivered', 'failed', 'opened', 'read', 'clicked', 'purchased'];
function isStatusProgression(current, next) {
    const currentIdx = STATUS_ORDER.indexOf(current);
    const nextIdx = STATUS_ORDER.indexOf(next);
    return nextIdx > currentIdx;
}
const STAT_MAP = {
    sent: 'total_sent',
    delivered: 'total_delivered',
    failed: 'total_failed',
    opened: 'total_opened',
    read: 'total_read',
    clicked: 'total_clicked',
    purchased: 'total_purchased',
};
exports.callbackController = {
    async handleCommunicationEvent(req, res, next) {
        const { communicationId, campaignId, eventType, eventData, idempotencyKey } = req.body;
        if (!communicationId || !campaignId || !eventType || !idempotencyKey) {
            res.status(400).json({ success: false, error: { message: 'Missing required fields' } });
            return;
        }
        try {
            // 1. Idempotency check — record event (returns false if duplicate)
            const isNew = await communication_repository_1.communicationRepository.recordEvent({
                communication_id: communicationId,
                event_type: eventType,
                event_data: eventData || {},
                idempotency_key: idempotencyKey,
            });
            if (!isNew) {
                logger_1.logger.debug('Duplicate event ignored', { idempotencyKey, eventType });
                // Acknowledge to channel service regardless — it succeeded, just already processed
                (0, response_1.sendSuccess)(res, { processed: false, reason: 'duplicate' });
                return;
            }
            // 2. Update communication status (only if it's a valid progression)
            const communication = await communication_repository_1.communicationRepository.findById(communicationId);
            if (communication && isStatusProgression(communication.status, eventType)) {
                await communication_repository_1.communicationRepository.updateStatus(communicationId, eventType);
            }
            // 3. Increment campaign stat counter
            const statField = STAT_MAP[eventType];
            if (statField) {
                await campaign_repository_1.campaignRepository.incrementStat(campaignId, statField);
            }
            // 4. For purchase events, attribute revenue
            if (eventType === 'purchased' && eventData?.order_amount) {
                await campaign_repository_1.campaignRepository.addRevenue(campaignId, Number(eventData.order_amount));
            }
            // 5. Check if campaign is complete (all sent have terminal status)
            // Simplified: mark complete if no queued/sent comms remain after a delay
            // At scale: use a separate completion-checker worker
            checkCampaignCompletion(campaignId);
            logger_1.logger.info('Communication event processed', { communicationId, eventType, campaignId });
            (0, response_1.sendSuccess)(res, { processed: true });
        }
        catch (err) {
            logger_1.logger.error('Callback processing error', { err, communicationId, eventType });
            next(err);
        }
    },
};
/**
 * Non-blocking campaign completion checker.
 * Runs asynchronously after each event — marks campaign complete when all comms have terminal status.
 * At scale: run as a scheduled job, not per-event.
 */
async function checkCampaignCompletion(campaignId) {
    setTimeout(async () => {
        try {
            const { query } = await Promise.resolve().then(() => __importStar(require('../../db/pool')));
            const result = await query(`SELECT COUNT(*) as pending FROM communications
         WHERE campaign_id = $1
           AND status NOT IN ('failed', 'delivered', 'opened', 'read', 'clicked', 'purchased')`, [campaignId]);
            const pending = parseInt(result[0]?.pending || '0');
            if (pending === 0) {
                await campaign_repository_1.campaignRepository.updateStatus(campaignId, 'completed', {
                    completed_at: new Date().toISOString(),
                });
                logger_1.logger.info(`Campaign ${campaignId} marked as completed`);
            }
        }
        catch (err) {
            logger_1.logger.error('Completion check error', { campaignId, err });
        }
    }, 2000); // Wait 2s before checking — gives other callbacks time to arrive
}
//# sourceMappingURL=callback.controller.js.map