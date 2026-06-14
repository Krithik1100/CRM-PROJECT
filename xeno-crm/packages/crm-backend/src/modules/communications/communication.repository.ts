import { query, queryOne } from '../../db/pool';

export interface Communication {
  id: string;
  campaign_id: string;
  customer_id: string;
  channel: string;
  recipient: string;
  message: string;
  status: string;
  idempotency_key: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationEvent {
  id: string;
  communication_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  idempotency_key: string;
  received_at: string;
}

export const communicationRepository = {
  async createBatch(communications: Array<Omit<Communication, 'id' | 'created_at' | 'updated_at'>>): Promise<Communication[]> {
    if (communications.length === 0) return [];

    const results: Communication[] = [];
    for (const comm of communications) {
      const rows = await query<Communication>(
        `INSERT INTO communications (campaign_id, customer_id, channel, recipient, message, status, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING *`,
        [comm.campaign_id, comm.customer_id, comm.channel, comm.recipient,
         comm.message, comm.status, comm.idempotency_key]
      );
      if (rows[0]) results.push(rows[0]);
    }
    return results;
  },

  async findById(id: string): Promise<Communication | null> {
    return queryOne<Communication>('SELECT * FROM communications WHERE id = $1', [id]);
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await query(
      'UPDATE communications SET status = $2, updated_at = NOW() WHERE id = $1',
      [id, status]
    );
  },

  async recordEvent(data: {
    communication_id: string;
    event_type: string;
    event_data?: Record<string, unknown>;
    idempotency_key: string;
  }): Promise<boolean> {
    // Idempotent: silently ignore duplicate events
    const rows = await query<{ id: string }>(
      `INSERT INTO communication_events (communication_id, event_type, event_data, idempotency_key)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [data.communication_id, data.event_type, JSON.stringify(data.event_data || {}), data.idempotency_key]
    );
    return rows.length > 0; // false = duplicate, already processed
  },

  async getByCampaign(campaignId: string, limit = 50): Promise<Communication[]> {
    return query<Communication>(
      `SELECT cm.*, cu.name as customer_name 
       FROM communications cm
       JOIN customers cu ON cm.customer_id = cu.id
       WHERE cm.campaign_id = $1
       ORDER BY cm.created_at DESC LIMIT $2`,
      [campaignId, limit]
    );
  },
};
