-- ─────────────────────────────────────────────
-- Add 'deleted' to meta_publication_log status enum
-- ─────────────────────────────────────────────
-- Run manually in Supabase SQL Editor

-- Drop and re-add constraint to include 'deleted' status
ALTER TABLE meta_publication_log DROP CONSTRAINT IF EXISTS meta_publication_log_status_check;
ALTER TABLE meta_publication_log ADD CONSTRAINT meta_publication_log_status_check
  CHECK (status IN ('pending', 'published', 'failed', 'deleted'));
