-- Xeno Mini CRM - Database Schema
-- Run this on your Neon PostgreSQL instance

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  city VARCHAR(100),
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  total_spent DECIMAL(12, 2) DEFAULT 0,
  order_count INT DEFAULT 0,
  first_order_at TIMESTAMPTZ,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);
CREATE INDEX IF NOT EXISTS idx_customers_last_order_at ON customers(last_order_at);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_number VARCHAR(100) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  channel VARCHAR(50) DEFAULT 'online',
  category VARCHAR(100),
  items JSONB DEFAULT '[]',
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON orders(ordered_at);
CREATE INDEX IF NOT EXISTS idx_orders_category ON orders(category);

-- ============================================================
-- SEGMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filter_json JSONB NOT NULL DEFAULT '{"operator":"AND","conditions":[]}',
  ai_query TEXT,
  customer_count INT DEFAULT 0,
  last_computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  goal TEXT,
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'rcs')),
  message_template TEXT NOT NULL,
  ai_reasoning TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

-- ============================================================
-- COMMUNICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','opened','read','clicked','purchased')),
  idempotency_key VARCHAR(255) UNIQUE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communications_campaign_id ON communications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_communications_customer_id ON communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(status);
CREATE INDEX IF NOT EXISTS idx_communications_idempotency_key ON communications(idempotency_key);

-- ============================================================
-- COMMUNICATION EVENTS (full audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS communication_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('sent','delivered','failed','opened','read','clicked','purchased')),
  event_data JSONB DEFAULT '{}',
  idempotency_key VARCHAR(255) UNIQUE, -- prevents duplicate event processing
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_events_communication_id ON communication_events(communication_id);
CREATE INDEX IF NOT EXISTS idx_comm_events_event_type ON communication_events(event_type);

-- ============================================================
-- CAMPAIGN STATS (materialized counter, updated on each callback)
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID UNIQUE NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  total_opened INT DEFAULT 0,
  total_read INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  total_purchased INT DEFAULT 0,
  revenue_attributed DECIMAL(12, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HELPER: Update customer stats when order is inserted
-- ============================================================
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers SET
    total_spent = (SELECT COALESCE(SUM(amount), 0) FROM orders WHERE customer_id = NEW.customer_id),
    order_count = (SELECT COUNT(*) FROM orders WHERE customer_id = NEW.customer_id),
    last_order_at = (SELECT MAX(ordered_at) FROM orders WHERE customer_id = NEW.customer_id),
    first_order_at = (SELECT MIN(ordered_at) FROM orders WHERE customer_id = NEW.customer_id),
    updated_at = NOW()
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_customer_stats
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_customer_stats();
