-- ============================================================================
-- FIX: Add missing columns to existing tables
-- Run this BEFORE the main migration if tables already exist
-- ============================================================================

-- Check and add missing columns to proposal_votes
DO $$
BEGIN
  -- Add source column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'proposal_votes' AND column_name = 'source') THEN
    ALTER TABLE proposal_votes ADD COLUMN source TEXT DEFAULT 'web';
    ALTER TABLE proposal_votes ALTER COLUMN source SET NOT NULL;
    ALTER TABLE proposal_votes ADD CONSTRAINT proposal_votes_source_check
      CHECK (source IN ('discord', 'web'));
  END IF;
END $$;

-- Check and add missing columns to task_proposals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'source') THEN
    ALTER TABLE task_proposals ADD COLUMN source TEXT DEFAULT 'web';
    ALTER TABLE task_proposals ALTER COLUMN source SET NOT NULL;
    ALTER TABLE task_proposals ADD CONSTRAINT task_proposals_source_check
      CHECK (source IN ('discord', 'web'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'discord_message_id') THEN
    ALTER TABLE task_proposals ADD COLUMN discord_message_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'discord_channel_id') THEN
    ALTER TABLE task_proposals ADD COLUMN discord_channel_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'discord_thread_id') THEN
    ALTER TABLE task_proposals ADD COLUMN discord_thread_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'proposed_by_discord_id') THEN
    ALTER TABLE task_proposals ADD COLUMN proposed_by_discord_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'proposed_by_discord_username') THEN
    ALTER TABLE task_proposals ADD COLUMN proposed_by_discord_username TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'ai_refined_title') THEN
    ALTER TABLE task_proposals ADD COLUMN ai_refined_title TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'ai_refined_description') THEN
    ALTER TABLE task_proposals ADD COLUMN ai_refined_description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'ai_analysis') THEN
    ALTER TABLE task_proposals ADD COLUMN ai_analysis JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'ai_processed_at') THEN
    ALTER TABLE task_proposals ADD COLUMN ai_processed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'approved_by_discord_id') THEN
    ALTER TABLE task_proposals ADD COLUMN approved_by_discord_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'suggested_domain') THEN
    ALTER TABLE task_proposals ADD COLUMN suggested_domain TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'suggested_task_type') THEN
    ALTER TABLE task_proposals ADD COLUMN suggested_task_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'suggested_estimated_days') THEN
    ALTER TABLE task_proposals ADD COLUMN suggested_estimated_days INTEGER DEFAULT 3;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'final_reward') THEN
    ALTER TABLE task_proposals ADD COLUMN final_reward INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'final_complexity') THEN
    ALTER TABLE task_proposals ADD COLUMN final_complexity INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'final_domain') THEN
    ALTER TABLE task_proposals ADD COLUMN final_domain TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'task_proposals' AND column_name = 'final_category') THEN
    ALTER TABLE task_proposals ADD COLUMN final_category TEXT;
  END IF;
END $$;

-- ============================================================================
-- TABLE: discord_user_links (create if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS discord_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  discord_id TEXT NOT NULL,
  discord_username TEXT,
  discord_discriminator TEXT,
  discord_avatar TEXT,
  discord_global_name TEXT,
  verification_code TEXT,
  verification_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discord_user_links_wallet_address_key') THEN
    ALTER TABLE discord_user_links ADD CONSTRAINT discord_user_links_wallet_address_key UNIQUE (wallet_address);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discord_user_links_discord_id_key') THEN
    ALTER TABLE discord_user_links ADD CONSTRAINT discord_user_links_discord_id_key UNIQUE (discord_id);
  END IF;
END $$;

-- Add missing columns to proposal_votes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'proposal_votes' AND column_name = 'voter_discord_id') THEN
    ALTER TABLE proposal_votes ADD COLUMN voter_discord_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'proposal_votes' AND column_name = 'voter_discord_username') THEN
    ALTER TABLE proposal_votes ADD COLUMN voter_discord_username TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'proposal_votes' AND column_name = 'comment') THEN
    ALTER TABLE proposal_votes ADD COLUMN comment TEXT;
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_proposals_source ON task_proposals(source);
CREATE INDEX IF NOT EXISTS idx_proposals_discord_msg ON task_proposals(discord_message_id);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer_discord ON task_proposals(proposed_by_discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_links_wallet ON discord_user_links(wallet_address);
CREATE INDEX IF NOT EXISTS idx_discord_links_discord ON discord_user_links(discord_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_discord ON proposal_votes(voter_discord_id);

-- ============================================================================
-- VOTE COUNTING TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_proposal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE task_proposals SET votes_up = votes_up + 1, updated_at = NOW() WHERE id = NEW.proposal_id;
    ELSE
      UPDATE task_proposals SET votes_down = votes_down + 1, updated_at = NOW() WHERE id = NEW.proposal_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE task_proposals SET votes_up = GREATEST(votes_up - 1, 0), updated_at = NOW() WHERE id = OLD.proposal_id;
    ELSE
      UPDATE task_proposals SET votes_down = GREATEST(votes_down - 1, 0), updated_at = NOW() WHERE id = OLD.proposal_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type != NEW.vote_type THEN
      IF OLD.vote_type = 'up' THEN
        UPDATE task_proposals SET votes_up = GREATEST(votes_up - 1, 0), votes_down = votes_down + 1, updated_at = NOW() WHERE id = NEW.proposal_id;
      ELSE
        UPDATE task_proposals SET votes_down = GREATEST(votes_down - 1, 0), votes_up = votes_up + 1, updated_at = NOW() WHERE id = NEW.proposal_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_proposal_votes ON proposal_votes;
CREATE TRIGGER trigger_update_proposal_votes
  AFTER INSERT OR UPDATE OR DELETE ON proposal_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_vote_counts();

-- ============================================================================
-- RLS POLICIES (safe to run multiple times)
-- ============================================================================

ALTER TABLE discord_user_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discord_links_select_all" ON discord_user_links;
CREATE POLICY "discord_links_select_all" ON discord_user_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "discord_links_insert" ON discord_user_links;
CREATE POLICY "discord_links_insert" ON discord_user_links FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "discord_links_update_own" ON discord_user_links;
CREATE POLICY "discord_links_update_own" ON discord_user_links FOR UPDATE USING (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON discord_user_links TO authenticated;
GRANT SELECT ON discord_user_links TO anon;

-- ============================================================================
-- VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_proposals_with_stats AS
SELECT
  p.*,
  (p.votes_up - p.votes_down) as vote_score,
  CASE
    WHEN p.votes_up + p.votes_down = 0 THEN 0
    ELSE ROUND((p.votes_up::numeric / (p.votes_up + p.votes_down)::numeric) * 100, 1)
  END as approval_percentage,
  (p.votes_up + p.votes_down) as total_votes
FROM task_proposals p;

GRANT SELECT ON v_proposals_with_stats TO authenticated;
GRANT SELECT ON v_proposals_with_stats TO anon;

-- Done!
SELECT 'Discord integration migration completed successfully!' as result;
