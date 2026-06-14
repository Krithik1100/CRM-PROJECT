import { query, queryOne } from '../../db/pool';
import { filterJsonToSql, FilterJson } from './filter.translator';
import { Customer } from '../customers/customer.types';

export interface Segment {
  id: string;
  name: string;
  description?: string;
  filter_json: FilterJson;
  ai_query?: string;
  customer_count: number;
  last_computed_at?: string;
  created_at: string;
  updated_at: string;
}

export const segmentRepository = {
  async findAll(): Promise<Segment[]> {
    return query<Segment>('SELECT * FROM segments ORDER BY created_at DESC');
  },

  async findById(id: string): Promise<Segment | null> {
    return queryOne<Segment>('SELECT * FROM segments WHERE id = $1', [id]);
  },

  async create(data: {
    name: string;
    description?: string;
    filter_json: FilterJson;
    ai_query?: string;
    customer_count: number;
  }): Promise<Segment> {
    const rows = await query<Segment>(
      `INSERT INTO segments (name, description, filter_json, ai_query, customer_count, last_computed_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [data.name, data.description, JSON.stringify(data.filter_json), data.ai_query, data.customer_count]
    );
    return rows[0];
  },

  async computeCustomers(filterJson: FilterJson): Promise<{ customers: Customer[]; count: number }> {
    const { sql, params } = filterJsonToSql(filterJson);
    const customers = await query<Customer>(
      `SELECT * FROM customers WHERE ${sql} ORDER BY total_spent DESC LIMIT 200`,
      params
    );

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM customers WHERE ${sql}`,
      params
    );

    return { customers, count: parseInt(countResult?.count || '0') };
  },

  async refreshCount(segmentId: string, filterJson: FilterJson): Promise<number> {
    const { sql, params } = filterJsonToSql(filterJson);
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM customers WHERE ${sql}`,
      params
    );
    const count = parseInt(result?.count || '0');
    await query(
      'UPDATE segments SET customer_count = $1, last_computed_at = NOW() WHERE id = $2',
      [count, segmentId]
    );
    return count;
  },

  async getCustomerIds(filterJson: FilterJson): Promise<string[]> {
    const { sql, params } = filterJsonToSql(filterJson);
    const rows = await query<{ id: string }>(
      `SELECT id FROM customers WHERE ${sql}`,
      params
    );
    return rows.map(r => r.id);
  },
};
