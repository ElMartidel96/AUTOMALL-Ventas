-- ============================================================
-- CRM System — Leads + Interactions
-- Run in Supabase SQL Editor
-- ============================================================

-- 1) CRM Leads table
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'facebook', 'whatsapp', 'website', 'referral', 'phone', 'walk_in')),
  source_detail TEXT,
  vehicle_id UUID,
  interest_level TEXT NOT NULL DEFAULT 'warm'
    CHECK (interest_level IN ('hot', 'warm', 'cold', 'lost')),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'negotiating', 'won', 'lost')),
  notes TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_seller ON crm_leads(seller_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_interest ON crm_leads(interest_level);
CREATE INDEX IF NOT EXISTS idx_crm_leads_vehicle ON crm_leads(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created ON crm_leads(created_at DESC);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_leads_service_all" ON crm_leads
  FOR ALL USING (auth.role() = 'service_role');

-- 2) CRM Interactions table
CREATE TABLE IF NOT EXISTS crm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('call', 'whatsapp', 'email', 'sms', 'facebook_comment', 'facebook_message', 'website_visit', 'test_drive', 'walk_in', 'note', 'status_change')),
  direction TEXT NOT NULL DEFAULT 'internal'
    CHECK (direction IN ('inbound', 'outbound', 'internal')),
  summary TEXT NOT NULL,
  details TEXT,
  vehicle_id UUID,
  fb_post_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  interaction_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_interactions_lead ON crm_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_seller ON crm_interactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_crm_interactions_created ON crm_interactions(created_at DESC);

ALTER TABLE crm_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_interactions_service_all" ON crm_interactions
  FOR ALL USING (auth.role() = 'service_role');

-- 3) Auto-update updated_at on leads
CREATE OR REPLACE FUNCTION update_crm_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_leads_updated_at ON crm_leads;
CREATE TRIGGER trg_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION update_crm_leads_updated_at();
