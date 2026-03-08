-- ============================================================
-- Campaign System — Single Complete Migration
-- ============================================================
-- Tables: campaigns, campaign_leads, campaign_events
-- Also adds campaign_id + permalink_url to meta_publication_log
-- RLS: service_role only (matches seller_meta_connections pattern)
-- Run in Supabase SQL Editor
-- ============================================================

-- Helper function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────
-- Campaigns table
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'inventory_showcase'
    CHECK (type IN ('inventory_showcase','seasonal_promo','clearance','financing','trade_in','custom')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','completed','archived')),
  vehicle_ids UUID[] DEFAULT ARRAY[]::UUID[],
  headline_en TEXT,
  headline_es TEXT,
  body_en TEXT,
  body_es TEXT,
  cta_text_en TEXT DEFAULT 'Message on WhatsApp',
  cta_text_es TEXT DEFAULT 'Escribenos por WhatsApp',
  landing_slug TEXT UNIQUE,
  daily_budget_usd NUMERIC(10,2),
  total_budget_usd NUMERIC(10,2),
  start_date DATE,
  end_date DATE,
  caption_language TEXT DEFAULT 'both' CHECK (caption_language IN ('en','es','both')),
  target_audience_notes TEXT,
  fb_post_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  fb_published_at TIMESTAMPTZ,
  fb_publish_status TEXT DEFAULT 'unpublished'
    CHECK (fb_publish_status IN ('unpublished','publishing','published','failed')),
  fb_permalink_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Campaign leads
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES sellers(id),
  name TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  vehicle_interest_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new'
    CHECK (status IN ('new','contacted','qualified','negotiating','sold','lost')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  first_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Campaign events (landing page analytics)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('page_view','vehicle_view','whatsapp_click','phone_click','scroll_50','scroll_100')),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Extend meta_publication_log for campaigns
-- ─────────────────────────────────────────────

ALTER TABLE meta_publication_log ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE meta_publication_log ADD COLUMN IF NOT EXISTS permalink_url TEXT;

-- Update post_type check to include 'campaign'
ALTER TABLE meta_publication_log DROP CONSTRAINT IF EXISTS meta_publication_log_post_type_check;
ALTER TABLE meta_publication_log ADD CONSTRAINT meta_publication_log_post_type_check
  CHECK (post_type IN ('new_listing','sold','repost','manual','campaign'));

-- ─────────────────────────────────────────────
-- Slug generation trigger
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_campaign_slug() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.landing_slug IS NULL THEN
    NEW.landing_slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]', '-', 'g'))
      || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campaign_slug ON campaigns;
CREATE TRIGGER trg_campaign_slug BEFORE INSERT ON campaigns
  FOR EACH ROW EXECUTE FUNCTION generate_campaign_slug();

DROP TRIGGER IF EXISTS trg_campaigns_updated ON campaigns;
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_campaign_leads_updated ON campaign_leads;
CREATE TRIGGER trg_campaign_leads_updated BEFORE UPDATE ON campaign_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_campaigns_wallet_status ON campaigns(wallet_address, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(landing_slug);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_seller ON campaign_leads(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON campaign_leads(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign ON campaign_events(campaign_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_pub_log_campaign ON meta_publication_log(campaign_id) WHERE campaign_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- RLS: service_role only (matches seller_meta_connections)
-- ─────────────────────────────────────────────

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;

-- Campaigns: only service_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'campaigns_service') THEN
    CREATE POLICY campaigns_service ON campaigns FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Campaign leads: only service_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_leads' AND policyname = 'campaign_leads_service') THEN
    CREATE POLICY campaign_leads_service ON campaign_leads FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Campaign events: INSERT allowed by anyone (public tracking), SELECT only service_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_events' AND policyname = 'campaign_events_insert') THEN
    CREATE POLICY campaign_events_insert ON campaign_events FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_events' AND policyname = 'campaign_events_select') THEN
    CREATE POLICY campaign_events_select ON campaign_events FOR SELECT USING (auth.role() = 'service_role');
  END IF;
END $$;
