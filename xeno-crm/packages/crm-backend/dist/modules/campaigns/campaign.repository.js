"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignRepository = void 0;
const pool_1 = require("../../db/pool");
exports.campaignRepository = {
    async findAll() {
        return (0, pool_1.query)(`SELECT c.*, 
        s.name as segment_name,
        cs.total_sent, cs.total_delivered, cs.total_failed,
        cs.total_opened, cs.total_read, cs.total_clicked,
        cs.total_purchased, cs.revenue_attributed
       FROM campaigns c
       LEFT JOIN segments s ON c.segment_id = s.id
       LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
       ORDER BY c.created_at DESC`);
    },
    async findById(id) {
        const rows = await (0, pool_1.query)(`SELECT c.*, 
        s.name as segment_name,
        cs.total_sent, cs.total_delivered, cs.total_failed,
        cs.total_opened, cs.total_read, cs.total_clicked,
        cs.total_purchased, cs.revenue_attributed, cs.updated_at as stats_updated_at
       FROM campaigns c
       LEFT JOIN segments s ON c.segment_id = s.id
       LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
       WHERE c.id = $1`, [id]);
        return rows[0] ?? null;
    },
    async create(data) {
        const rows = await (0, pool_1.query)(`INSERT INTO campaigns (name, goal, segment_id, channel, message_template, ai_reasoning, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft') RETURNING *`, [data.name, data.goal, data.segment_id, data.channel, data.message_template, data.ai_reasoning]);
        const campaign = rows[0];
        // Initialize stats row
        await (0, pool_1.query)(`INSERT INTO campaign_stats (campaign_id) VALUES ($1) ON CONFLICT DO NOTHING`, [campaign.id]);
        return campaign;
    },
    async updateStatus(id, status, extra) {
        const updates = ['status = $2', 'updated_at = NOW()'];
        const params = [id, status];
        let idx = 3;
        if (extra?.sent_at) {
            updates.push(`sent_at = $${idx++}`);
            params.push(extra.sent_at);
        }
        if (extra?.completed_at) {
            updates.push(`completed_at = $${idx++}`);
            params.push(extra.completed_at);
        }
        await (0, pool_1.query)(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = $1`, params);
    },
    async delete(id) {
        const rows = await (0, pool_1.query)('DELETE FROM campaigns WHERE id = $1 RETURNING id', [id]);
        return rows.length > 0;
    },
    async incrementStat(campaignId, field, amount = 1) {
        const allowed = ['total_sent', 'total_delivered', 'total_failed', 'total_opened', 'total_read', 'total_clicked', 'total_purchased'];
        if (!allowed.includes(field))
            return;
        await (0, pool_1.query)(`UPDATE campaign_stats SET ${field} = ${field} + $2, updated_at = NOW() WHERE campaign_id = $1`, [campaignId, amount]);
    },
    async addRevenue(campaignId, amount) {
        await (0, pool_1.query)(`UPDATE campaign_stats SET revenue_attributed = revenue_attributed + $2, updated_at = NOW() WHERE campaign_id = $1`, [campaignId, amount]);
    },
    async getOverviewStats() {
        return (0, pool_1.queryOne)(`SELECT
        COUNT(DISTINCT c.id) as total_campaigns,
        COALESCE(SUM(cs.total_sent), 0) as total_messages_sent,
        COALESCE(SUM(cs.total_delivered), 0) as total_delivered,
        COALESCE(SUM(cs.total_opened), 0) as total_opened,
        COALESCE(SUM(cs.total_clicked), 0) as total_clicked,
        COALESCE(SUM(cs.total_purchased), 0) as total_purchased,
        COALESCE(SUM(cs.revenue_attributed), 0) as total_revenue
       FROM campaigns c
       LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id`);
    },
};
//# sourceMappingURL=campaign.repository.js.map