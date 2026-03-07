-- ═══════════════════════════════════════════════════════════════
-- Campaign ↔ Publication Correlation
--
-- Adds campaign_id to meta_publication_log so we can track which
-- Facebook publications belong to which CTWA campaign.
--
-- Also adds post_type 'campaign' for campaign-triggered publications.
-- ═══════════════════════════════════════════════════════════════

-- 1. Add campaign_id to meta_publication_log
ALTER TABLE meta_publication_log
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- 2. Update post_type CHECK to include 'campaign' and 'manual'
ALTER TABLE meta_publication_log
  DROP CONSTRAINT IF EXISTS meta_publication_log_post_type_check;

ALTER TABLE meta_publication_log
  ADD CONSTRAINT meta_publication_log_post_type_check
  CHECK (post_type IN ('new_listing', 'sold', 'repost', 'manual', 'campaign'));

-- 3. Add permalink_url column if not exists (used by publish endpoint)
ALTER TABLE meta_publication_log
  ADD COLUMN IF NOT EXISTS permalink_url TEXT;

-- 4. Index for campaign correlation queries
CREATE INDEX IF NOT EXISTS idx_meta_pub_campaign ON meta_publication_log(campaign_id)
  WHERE campaign_id IS NOT NULL;

-- 5. Add fb_post_id to campaigns table for tracking the main campaign post
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS fb_post_ids TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS fb_published_at TIMESTAMPTZ;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS fb_publish_status TEXT DEFAULT NULL
  CHECK (fb_publish_status IS NULL OR fb_publish_status IN ('pending', 'publishing', 'published', 'partial', 'failed'));
