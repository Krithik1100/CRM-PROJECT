"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationRepository = void 0;
const pool_1 = require("../../db/pool");
exports.communicationRepository = {
    async createBatch(communications) {
        if (communications.length === 0)
            return [];
        const results = [];
        for (const comm of communications) {
            const rows = await (0, pool_1.query)(`INSERT INTO communications (campaign_id, customer_id, channel, recipient, message, status, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING *`, [comm.campaign_id, comm.customer_id, comm.channel, comm.recipient,
                comm.message, comm.status, comm.idempotency_key]);
            if (rows[0])
                results.push(rows[0]);
        }
        return results;
    },
    async findById(id) {
        return (0, pool_1.queryOne)('SELECT * FROM communications WHERE id = $1', [id]);
    },
    async updateStatus(id, status) {
        await (0, pool_1.query)('UPDATE communications SET status = $2, updated_at = NOW() WHERE id = $1', [id, status]);
    },
    async recordEvent(data) {
        // Idempotent: silently ignore duplicate events
        const rows = await (0, pool_1.query)(`INSERT INTO communication_events (communication_id, event_type, event_data, idempotency_key)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`, [data.communication_id, data.event_type, JSON.stringify(data.event_data || {}), data.idempotency_key]);
        return rows.length > 0; // false = duplicate, already processed
    },
    async getByCampaign(campaignId, limit = 50) {
        return (0, pool_1.query)(`SELECT cm.*, cu.name as customer_name 
       FROM communications cm
       JOIN customers cu ON cm.customer_id = cu.id
       WHERE cm.campaign_id = $1
       ORDER BY cm.created_at DESC LIMIT $2`, [campaignId, limit]);
    },
};
//# sourceMappingURL=communication.repository.js.map