-- Add whatsapp_conversations to fb_ad_objective CHECK constraint
-- whatsapp_conversations = OUTCOME_ENGAGEMENT + CONVERSATIONS + native CTWA (recommended)
-- whatsapp_clicks = OUTCOME_TRAFFIC + LINK_CLICKS + wa.me link (legacy, not recommended)
-- awareness = OUTCOME_AWARENESS + REACH + boost organic post

-- Drop existing constraint and recreate with new value
ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_fb_ad_objective_check;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_fb_ad_objective_check
  CHECK (fb_ad_objective IN ('awareness', 'whatsapp_clicks', 'whatsapp_conversations'));

-- Update default for new campaigns
ALTER TABLE campaigns
  ALTER COLUMN fb_ad_objective SET DEFAULT 'whatsapp_conversations';

-- Migrate existing whatsapp_clicks campaigns to whatsapp_conversations
-- (they will recreate the FB ad with the correct objective on next publish/switch)
UPDATE campaigns
  SET fb_ad_objective = 'whatsapp_conversations'
  WHERE fb_ad_objective = 'whatsapp_clicks';
