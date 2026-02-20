-- ============================================================================
-- DISCORD PROPOSALS SYSTEM - DEFINITIVE MIGRATION
-- Safely handles: fresh install, partial tables, or existing tables
-- RUN THIS FILE - IT WILL WORK IN ANY SCENARIO
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing broken/partial tables (clean slate approach)
-- ============================================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS v_proposals_with_stats;

-- Drop tables FIRST (this automatically drops triggers attached to them)
-- Order matters: proposal_votes has FK to task_proposals
DROP TABLE IF EXISTS proposal_votes CASCADE;
DROP TABLE IF EXISTS discord_user_links CASCADE;
DROP TABLE IF EXISTS task_proposals CASCADE;

-- Now drop functions (safe since triggers are gone with tables)
DROP FUNCTION IF EXISTS update_proposal_vote_counts();
DROP FUNCTION IF EXISTS update_discord_timestamp();

-- ============================================================================
-- STEP 2: Create tables fresh
-- ============================================================================

-- task_proposals table
CREATE TABLE task_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('discord', 'web')),
  proposed_by_wallet TEXT,
  proposed_by_discord_id TEXT,
  proposed_by_discord_username TEXT,
  discord_message_id TEXT,
  discord_channel_id TEXT,
  discord_thread_id TEXT,
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,
  suggested_domain TEXT,
  suggested_category TEXT,
  suggested_task_type TEXT,
  suggested_reward INTEGER DEFAULT 100,
  suggested_complexity INTEGER DEFAULT 3,
  suggested_estimated_days INTEGER DEFAULT 3,
  ai_refined_title TEXT,
  ai_refined_description TEXT,
  ai_analysis JSONB,
  ai_processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'approved', 'rejected', 'converted')),
  approved_by_wallet TEXT,
  approved_by_discord_id TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  final_reward INTEGER,
  final_complexity INTEGER,
  final_domain TEXT,
  final_category TEXT,
  resulting_task_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- proposal_votes table
CREATE TABLE proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES task_proposals(id) ON DELETE CASCADE,
  voter_wallet TEXT,
  voter_discord_id TEXT,
  voter_discord_username TEXT,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('discord', 'web')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT must_have_voter CHECK (voter_wallet IS NOT NULL OR voter_discord_id IS NOT NULL)
);

-- discord_user_links table
CREATE TABLE discord_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  discord_id TEXT NOT NULL UNIQUE,
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

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_proposals_status ON task_proposals(status);
CREATE INDEX idx_proposals_source ON task_proposals(source);
CREATE INDEX idx_proposals_discord_msg ON task_proposals(discord_message_id);
CREATE INDEX idx_proposals_proposer_wallet ON task_proposals(proposed_by_wallet);
CREATE INDEX idx_proposals_proposer_discord ON task_proposals(proposed_by_discord_id);
CREATE INDEX idx_proposals_created ON task_proposals(created_at DESC);

CREATE INDEX idx_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX idx_votes_voter_wallet ON proposal_votes(voter_wallet);
CREATE INDEX idx_votes_voter_discord ON proposal_votes(voter_discord_id);

CREATE INDEX idx_discord_links_wallet ON discord_user_links(wallet_address);
CREATE INDEX idx_discord_links_discord ON discord_user_links(discord_id);
CREATE INDEX idx_discord_links_verified ON discord_user_links(is_verified);

-- Unique constraints for votes (one vote per user per proposal)
ALTER TABLE proposal_votes ADD CONSTRAINT unique_wallet_vote UNIQUE (proposal_id, voter_wallet);
ALTER TABLE proposal_votes ADD CONSTRAINT unique_discord_vote UNIQUE (proposal_id, voter_discord_id);

-- ============================================================================
-- STEP 4: Create trigger functions
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

CREATE OR REPLACE FUNCTION update_discord_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Create triggers
-- ============================================================================

CREATE TRIGGER trigger_update_proposal_votes
  AFTER INSERT OR UPDATE OR DELETE ON proposal_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_vote_counts();

CREATE TRIGGER trigger_proposal_updated
  BEFORE UPDATE ON task_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_timestamp();

CREATE TRIGGER trigger_discord_link_updated
  BEFORE UPDATE ON discord_user_links
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_timestamp();

-- ============================================================================
-- STEP 6: Enable RLS and create policies
-- ============================================================================

ALTER TABLE task_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_user_links ENABLE ROW LEVEL SECURITY;

-- Proposals policies
CREATE POLICY "proposals_select_all" ON task_proposals FOR SELECT USING (true);
CREATE POLICY "proposals_insert_auth" ON task_proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "proposals_update_auth" ON task_proposals FOR UPDATE USING (true);

-- Votes policies
CREATE POLICY "votes_select_all" ON proposal_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert_auth" ON proposal_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "votes_update_auth" ON proposal_votes FOR UPDATE USING (true);
CREATE POLICY "votes_delete_auth" ON proposal_votes FOR DELETE USING (true);

-- Discord links policies
CREATE POLICY "discord_links_select_all" ON discord_user_links FOR SELECT USING (true);
CREATE POLICY "discord_links_insert_auth" ON discord_user_links FOR INSERT WITH CHECK (true);
CREATE POLICY "discord_links_update_auth" ON discord_user_links FOR UPDATE USING (true);

-- ============================================================================
-- STEP 7: Create view
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

-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON task_proposals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON proposal_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON discord_user_links TO authenticated;
GRANT SELECT ON v_proposals_with_stats TO authenticated;

GRANT SELECT ON task_proposals TO anon;
GRANT SELECT ON proposal_votes TO anon;
GRANT SELECT ON v_proposals_with_stats TO anon;

-- ============================================================================
-- DONE - Success message
-- ============================================================================

SELECT 'Discord proposals system created successfully! All 3 tables ready.' as result;
