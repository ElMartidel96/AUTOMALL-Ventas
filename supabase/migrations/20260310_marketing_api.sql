-- Marketing API — Ad tracking fields for paid CTWA campaigns
-- Run manually in Supabase SQL Editor

-- Campaigns: ad tracking fields
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fb_campaign_id TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fb_adset_id TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fb_ad_id TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fb_creative_id TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fb_ad_status TEXT DEFAULT 'none'
  CHECK (fb_ad_status IN ('none','creating','paused','active','completed','error'));

-- seller_meta_connections: ad account + user token for Marketing API
ALTER TABLE seller_meta_connections ADD COLUMN IF NOT EXISTS ad_account_id TEXT;
ALTER TABLE seller_meta_connections ADD COLUMN IF NOT EXISTS fb_user_access_token TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_ad_status ON campaigns(fb_ad_status) WHERE fb_ad_status != 'none';
