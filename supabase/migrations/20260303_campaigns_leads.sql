-- ─────────────────────────────────────────────────────────────────────────
-- Facebook Click-to-WhatsApp (CTWA) Campaign System
-- Tables: campaigns, campaign_leads, campaign_events
-- ─────────────────────────────────────────────────────────────────────────

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. Campaigns Table
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,

  -- Campaign Info
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'inventory_showcase'
    CHECK (type IN ('inventory_showcase', 'seasonal_promo', 'clearance', 'financing', 'trade_in', 'custom')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  objective TEXT NOT NULL DEFAULT 'conversations'
    CHECK (objective IN ('conversations', 'leads', 'traffic')),
  ad_format TEXT NOT NULL DEFAULT 'carousel'
    CHECK (ad_format IN ('single_image', 'carousel', 'video', 'collection')),

  -- Targeting
  target_location TEXT DEFAULT 'Houston, TX',
  target_radius_miles INTEGER DEFAULT 25,
  target_languages TEXT[] DEFAULT ARRAY['en', 'es'],
  target_audience_notes TEXT DEFAULT '',

  -- Creative — Bilingual
  headline_en TEXT NOT NULL DEFAULT '',
  headline_es TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  body_es TEXT NOT NULL DEFAULT '',
  cta_text TEXT DEFAULT 'Chat on WhatsApp',
  caption_language TEXT DEFAULT 'both' CHECK (caption_language IN ('en', 'es', 'both')),

  -- Vehicles
  vehicle_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- WhatsApp Flow
  whatsapp_number TEXT NOT NULL DEFAULT '',
  welcome_message_en TEXT DEFAULT '',
  welcome_message_es TEXT DEFAULT '',
  icebreakers_en TEXT[] DEFAULT ARRAY[]::TEXT[],
  icebreakers_es TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Budget
  daily_budget_usd NUMERIC(10,2) DEFAULT 25.00,
  total_budget_usd NUMERIC(10,2) DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT NULL,

  -- Landing Page
  landing_slug TEXT UNIQUE,
  landing_enabled BOOLEAN DEFAULT true,

  -- UTM Tracking
  utm_source TEXT DEFAULT 'facebook',
  utm_medium TEXT DEFAULT 'ctwa',
  utm_campaign TEXT DEFAULT '',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_seller ON campaigns(seller_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_wallet ON campaigns(wallet_address);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(landing_slug);

-- Auto-generate landing_slug from name if not provided
CREATE OR REPLACE FUNCTION generate_campaign_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.landing_slug IS NULL OR NEW.landing_slug = '' THEN
    NEW.landing_slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    ) || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  END IF;

  -- Auto-set utm_campaign
  IF NEW.utm_campaign IS NULL OR NEW.utm_campaign = '' THEN
    NEW.utm_campaign := NEW.landing_slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_campaign_slug
  BEFORE INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION generate_campaign_slug();

-- Auto-update updated_at
CREATE TRIGGER trg_campaigns_updated
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────
-- 2. Campaign Leads Table
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Contact
  name TEXT,
  phone TEXT NOT NULL,
  whatsapp_verified BOOLEAN DEFAULT false,

  -- Source
  source TEXT NOT NULL DEFAULT 'ctwa_ad'
    CHECK (source IN ('ctwa_ad', 'landing_page', 'organic_whatsapp', 'referral', 'direct')),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,

  -- Qualification
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'test_drive', 'negotiating', 'sold', 'lost')),
  budget_range TEXT,
  preferred_brands TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_type TEXT,
  timeline TEXT,
  has_trade_in BOOLEAN DEFAULT false,
  needs_financing BOOLEAN DEFAULT false,
  notes TEXT,

  -- Engagement
  first_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  message_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_seller ON campaign_leads(seller_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON campaign_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON campaign_leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_source ON campaign_leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created ON campaign_leads(created_at DESC);

CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON campaign_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────
-- 3. Campaign Events (Landing Page Analytics)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Event
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'page_view', 'whatsapp_click', 'phone_click',
      'vehicle_view', 'share', 'scroll_50', 'scroll_100'
    )),

  -- Context
  vehicle_id UUID,
  referrer TEXT,
  user_agent TEXT,

  -- UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_campaign ON campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON campaign_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON campaign_events(created_at DESC);


-- ─────────────────────────────────────────────
-- 4. RLS Policies
-- ─────────────────────────────────────────────

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;

-- Campaigns: sellers can CRUD their own
CREATE POLICY campaigns_select ON campaigns FOR SELECT USING (true);
CREATE POLICY campaigns_insert ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY campaigns_update ON campaigns FOR UPDATE USING (true);
CREATE POLICY campaigns_delete ON campaigns FOR DELETE USING (true);

-- Leads: sellers can CRUD their own
CREATE POLICY leads_select ON campaign_leads FOR SELECT USING (true);
CREATE POLICY leads_insert ON campaign_leads FOR INSERT WITH CHECK (true);
CREATE POLICY leads_update ON campaign_leads FOR UPDATE USING (true);

-- Events: public insert (from landing page), seller select
CREATE POLICY events_select ON campaign_events FOR SELECT USING (true);
CREATE POLICY events_insert ON campaign_events FOR INSERT WITH CHECK (true);
