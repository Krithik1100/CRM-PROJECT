export interface Customer {
  id: string;
  external_id?: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  tier: 'bronze' | 'silver' | 'gold';
  total_spent: number;
  order_count: number;
  first_order_at?: string;
  last_order_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  amount: number;
  status: string;
  channel: string;
  category: string;
  items: unknown[];
  ordered_at: string;
  created_at: string;
}

export interface CustomerListQuery {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  city?: string;
}

export interface SeedOptions {
  customerCount?: number;
}
