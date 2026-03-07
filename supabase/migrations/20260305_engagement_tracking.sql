-- ============================================================
-- Engagement Tracking + Fix CHECK Constraint
-- Run in Supabase SQL Editor
-- ============================================================

-- 1) Fix CHECK constraint: add 'manual' to post_type
ALTER TABLE meta_publication_log
  DROP CONSTRAINT IF EXISTS meta_publication_log_post_type_check;
ALTER TABLE meta_publication_log
  ADD CONSTRAINT meta_publication_log_post_type_check
  CHECK (post_type IN ('new_listing', 'sold', 'repost', 'manual'));

-- 2) Add permalink_url to publication log
ALTER TABLE meta_publication_log
  ADD COLUMN IF NOT EXISTS permalink_url TEXT;

-- 3) Facebook post engagement snapshots
CREATE TABLE IF NOT EXISTS fb_post_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES meta_publication_log(id) ON DELETE CASCADE,
  fb_post_id TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  reactions_count INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER,
  reach INTEGER,
  clicks INTEGER,
  engaged_users INTEGER,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fb_engagement_pub ON fb_post_engagement(publication_id);
CREATE INDEX IF NOT EXISTS idx_fb_engagement_fetched ON fb_post_engagement(fetched_at DESC);

ALTER TABLE fb_post_engagement ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "fb_engagement_service_all" ON fb_post_engagement
  FOR ALL USING (auth.role() = 'service_role');
