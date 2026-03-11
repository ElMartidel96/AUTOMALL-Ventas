-- Add fb_ad_objective column to campaigns
-- Supports dual ad objectives: awareness (OUTCOME_AWARENESS + REACH)
-- and whatsapp_clicks (OUTCOME_TRAFFIC + LINK_CLICKS + wa.me CTA)

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS fb_ad_objective TEXT
  DEFAULT 'whatsapp_clicks'
  CHECK (fb_ad_objective IN ('awareness', 'whatsapp_clicks'));

-- Backfill existing campaigns
UPDATE campaigns
  SET fb_ad_objective = 'whatsapp_clicks'
  WHERE fb_ad_objective IS NULL;
