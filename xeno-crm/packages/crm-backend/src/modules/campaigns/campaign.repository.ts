import { query, queryOne } from '../../db/pool';

export interface Campaign {
  id: string;
  name: string;
  goal?: string;
  segment_id?: string;
  channel: string;
  message_template: string;
  ai_reasoning?: string;
  status: 'draft' | 'sending' | 'completed' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignStats {
  campaign_id: string;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  total_read: number;
  total_clicked: number;
  total_purchased: number;
  revenue_attributed: number;
  updated_at: string;
}

export interface CampaignWithStats extends Campaign {
  stats: CampaignStats | null;
  segment_name?: string;
}

export const campaignRepository = {
  async findAll(): Promise<CampaignWithStats[]> {
    return query<CampaignWithStats>(
      `SELECT c.*, 
        s.name as segment_name,
        cs.total_sent, cs.total_delivered, cs.total_failed,
        cs.total_opened, cs.total_read, cs.total_clicked,
        cs.total_purchased, cs.revenue_attributed
       FROM campaigns c
       LEFT JOIN segments s ON c.segment_id = s.id
       LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
       ORDER BY c.created_at DESC`
    );
  },

  async findById(id: string): Promise<CampaignWithStats | null> {
    const rows = await query<CampaignWithStats>(
      `SELECT c.*, 
        s.name as segment_name,
        cs.total_sent, cs.total_delivered, cs.total_failed,
        cs.total_opened, cs.total_read, cs.total_clicked,
        cs.total_purchased, cs.revenue_attributed, cs.updated_at as stats_updated_at
       FROM campaigns c
       LEFT JOIN segments s ON c.segment_id = s.id
       LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
       WHERE c.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async create(data: Partial<Campaign>): Promise<Campaign> {
    const rows = await query<Campaign>(
      `INSERT INTO campaigns (name, goal, segment_id, channel, message_template, ai_reasoning, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft') RETURNING *`,
      [data.name, data.goal, data.segment_id, data.channel, data.message_template, data.ai_reasoning]
    );
    const campaign = rows[0];

    // Initialize stats row
    await query(
      `INSERT INTO campaign_stats (campaign_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [campaign.id]
    );

    return campaign;
  },

  async updateStatus(id: string, status: string, extra?: Partial<Campaign>): Promise<void> {
    const updates: string[] = ['status = $2', 'updated_at = NOW()'];
    const params: unknown[] = [id, status];
    let idx = 3;

    if (extra?.sent_at) { updates.push(`sent_at = $${idx++}`); params.push(extra.sent_at); }
    if (extra?.completed_at) { updates.push(`completed_at = $${idx++}`); params.push(extra.completed_at); }

    await query(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = $1`, params);
  },

  async delete(id: string): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM campaigns WHERE id = $1 RETURNING id',
      [id]
    );
    return rows.length > 0;
  },

  async incrementStat(campaignId: string, field: string, amount = 1): Promise<void> {
    const allowed = ['total_sent', 'total_delivered', 'total_failed', 'total_opened', 'total_read', 'total_clicked', 'total_purchased'];
    if (!allowed.includes(field)) return;
    await query(
      `UPDATE campaign_stats SET ${field} = ${field} + $2, updated_at = NOW() WHERE campaign_id = $1`,
      [campaignId, amount]
    );
  },

  async addRevenue(campaignId: string, amount: number): Promise<void> {
    await query(
      `UPDATE campaign_stats SET revenue_attributed = revenue_attributed + $2, updated_at = NOW() WHERE campaign_id = $1`,
      [campaignId, amount]
    );
  },

  async getOverviewStats() {
    return queryOne(
      `SELECT
        COUNT(DISTINCT c.id) as total_campaigns,
        COALESCE(SUM(cs.total_sent), 0) as total_messages_sent,
        COALESCE(SUM(cs.total_delivered), 0) as total_delivered,
        COALESCE(SUM(cs.total_opened), 0) as total_opened,
        COALESCE(SUM(cs.total_clicked), 0) as total_clicked,
        COALESCE(SUM(cs.total_purchased), 0) as total_purchased,
        COALESCE(SUM(cs.revenue_attributed), 0) as total_revenue
       FROM campaigns c
       LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id`
    );
  },
};
