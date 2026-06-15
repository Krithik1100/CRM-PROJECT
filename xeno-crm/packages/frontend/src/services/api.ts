import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const isFrontendOrigin =
  typeof window !== 'undefined' &&
  configuredApiUrl &&
  configuredApiUrl === window.location.origin;

const api = axios.create({
  baseURL: configuredApiUrl && !isFrontendOrigin ? configuredApiUrl : '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  tier: 'bronze' | 'silver' | 'gold';
  total_spent: number;
  order_count: number;
  last_order_at?: string;
  first_order_at?: string;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  filter_json: object;
  ai_query?: string;
  customer_count: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  goal?: string;
  segment_id?: string;
  segment_name?: string;
  channel: string;
  message_template: string;
  ai_reasoning?: string;
  status: 'draft' | 'sending' | 'completed' | 'failed';
  created_at: string;
  sent_at?: string;
  completed_at?: string;
  total_sent?: number;
  total_delivered?: number;
  total_failed?: number;
  total_opened?: number;
  total_read?: number;
  total_clicked?: number;
  total_purchased?: number;
  revenue_attributed?: number;
  communications?: Communication[];
}

export interface Communication {
  id: string;
  customer_id: string;
  customer_name?: string;
  channel: string;
  recipient: string;
  message: string;
  status: string;
}

export interface CopilotRecommendation {
  campaignName: string;
  segmentName: string;
  segmentDescription: string;
  filterJson: object;
  channel: string;
  channelReasoning: string;
  messageTemplate: string;
  reasoning: string;
  estimatedAudience: number;
}

export interface OverviewStats {
  campaigns: {
    total_campaigns: string;
    total_messages_sent: string;
    total_delivered: string;
    total_opened: string;
    total_clicked: string;
    total_purchased: string;
    total_revenue: string;
  };
  customers: {
    total: number;
    gold: number;
    silver: number;
    bronze: number;
    avg_spent: number;
  };
}

// API methods
export const customerApi = {
  list: (params?: Record<string, unknown>) => api.get('/customers', { params }).then(r => r.data),
  get: (id: string) => api.get(`/customers/${id}`).then(r => r.data),
  stats: () => api.get('/customers/stats').then(r => r.data),
  seed: (count = 500) => api.post('/customers/seed', { count }).then(r => r.data),
};

export const segmentApi = {
  list: () => api.get('/segments').then(r => r.data),
  get: (id: string) => api.get(`/segments/${id}`).then(r => r.data),
  aiQuery: (query: string) => api.post('/segments/ai-query', { query }).then(r => r.data),
  create: (data: object) => api.post('/segments', data).then(r => r.data),
  getCustomers: (id: string) => api.get(`/segments/${id}/customers`).then(r => r.data),
};

export const campaignApi = {
  list: () => api.get('/campaigns').then(r => r.data),
  get: (id: string) => api.get(`/campaigns/${id}`).then(r => r.data),
  copilot: (goal: string) => api.post('/campaigns/copilot', { goal }).then(r => r.data),
  create: (data: object) => api.post('/campaigns', data).then(r => r.data),
  launch: (id: string) => api.post(`/campaigns/${id}/launch`).then(r => r.data),
  delete: (id: string) => api.delete(`/campaigns/${id}`).then(r => r.data),
};

export const analyticsApi = {
  overview: () => api.get('/analytics/overview').then(r => r.data),
};

export default api;
