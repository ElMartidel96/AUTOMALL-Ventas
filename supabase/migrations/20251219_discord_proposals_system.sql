-- ============================================================================
-- DISCORD BIDIRECTIONAL PROPOSALS SYSTEM
-- Migration: 20251219_discord_proposals_system.sql
--
-- Creates tables for:
-- 1. task_proposals - Community proposals before they become tasks
-- 2. proposal_votes - Voting on proposals
-- 3. discord_user_links - Link Discord accounts to wallets
-- ============================================================================

-- ============================================================================
-- TABLE: task_proposals
-- Stores task proposals from Discord or Web before approval
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,

  -- Origin tracking
  source TEXT NOT NULL CHECK (source IN ('discord', 'web')),
  proposed_by_wallet TEXT,
  proposed_by_discord_id TEXT,
  proposed_by_discord_username TEXT,

  -- Discord integration
  discord_message_id TEXT,
  discord_channel_id TEXT,
  discord_thread_id TEXT,

  -- Voting
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,

  -- Categorization (suggested by AI or user)
  suggested_domain TEXT,
  suggested_category TEXT,
  suggested_task_type TEXT,
  suggested_reward INTEGER DEFAULT 100,
  suggested_complexity INTEGER DEFAULT 3,
  suggested_estimated_days INTEGER DEFAULT 3,

  -- AI Refinement
  ai_refined_title TEXT,
  ai_refined_description TEXT,
  ai_analysis JSONB,
  ai_processed_at TIMESTAMPTZ,

  -- Status workflow: pending → voting → approved/rejected → converted
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Just created, awaiting initial review
    'voting',       -- Open for community voting
    'approved',     -- Approved by moderator
    'rejected',     -- Rejected by moderator
    'converted'     -- Converted to actual task
  )),

  -- Approval info
  approved_by_wallet TEXT,
  approved_by_discord_id TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Final reward (may differ from suggested)
  final_reward INTEGER,
  final_complexity INTEGER,
  final_domain TEXT,
  final_category TEXT,

  -- Resulting task (after conversion)
  resulting_task_id UUID REFERENCES dao_tasks(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_proposals_status ON task_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_source ON task_proposals(source);
CREATE INDEX IF NOT EXISTS idx_proposals_discord_msg ON task_proposals(discord_message_id);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer_wallet ON task_proposals(proposed_by_wallet);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer_discord ON task_proposals(proposed_by_discord_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON task_proposals(created_at DESC);

-- ============================================================================
-- TABLE: proposal_votes
-- Tracks votes on proposals
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES task_proposals(id) ON DELETE CASCADE,

  -- Voter identity (one or both)
  voter_wallet TEXT,
  voter_discord_id TEXT,
  voter_discord_username TEXT,

  -- Vote type
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),

  -- Where the vote came from
  source TEXT NOT NULL CHECK (source IN ('discord', 'web')),

  -- Optional comment
  comment TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints: one vote per user per proposal
  CONSTRAINT unique_wallet_vote UNIQUE (proposal_id, voter_wallet),
  CONSTRAINT unique_discord_vote UNIQUE (proposal_id, voter_discord_id),

  -- Must have at least one identifier
  CONSTRAINT must_have_voter CHECK (
    voter_wallet IS NOT NULL OR voter_discord_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_wallet ON proposal_votes(voter_wallet);
CREATE INDEX IF NOT EXISTS idx_votes_voter_discord ON proposal_votes(voter_discord_id);

-- ============================================================================
-- TABLE: discord_user_links
-- Links Discord accounts to wallet addresses
-- ============================================================================

CREATE TABLE IF NOT EXISTS discord_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Wallet info
  wallet_address TEXT NOT NULL,

  -- Discord info
  discord_id TEXT NOT NULL,
  discord_username TEXT,
  discord_discriminator TEXT,
  discord_avatar TEXT,
  discord_global_name TEXT,

  -- Verification
  verification_code TEXT,
  verification_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraints
  CONSTRAINT unique_wallet UNIQUE (wallet_address),
  CONSTRAINT unique_discord UNIQUE (discord_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discord_links_wallet ON discord_user_links(wallet_address);
CREATE INDEX IF NOT EXISTS idx_discord_links_discord ON discord_user_links(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_links_verified ON discord_user_links(is_verified);

-- ============================================================================
-- FUNCTIONS: Vote counting trigger
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
    -- Handle vote change
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

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_proposal_votes ON proposal_votes;
CREATE TRIGGER trigger_update_proposal_votes
  AFTER INSERT OR UPDATE OR DELETE ON proposal_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_vote_counts();

-- ============================================================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_proposal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proposal_updated ON task_proposals;
CREATE TRIGGER trigger_proposal_updated
  BEFORE UPDATE ON task_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_timestamp();

DROP TRIGGER IF EXISTS trigger_discord_link_updated ON discord_user_links;
CREATE TRIGGER trigger_discord_link_updated
  BEFORE UPDATE ON discord_user_links
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_timestamp();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE task_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_user_links ENABLE ROW LEVEL SECURITY;

-- Proposals: Anyone can read, authenticated can create, only proposer can update their own
CREATE POLICY "proposals_select_all" ON task_proposals FOR SELECT USING (true);
CREATE POLICY "proposals_insert_authenticated" ON task_proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "proposals_update_own" ON task_proposals FOR UPDATE USING (
  proposed_by_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR proposed_by_discord_id IS NOT NULL
);

-- Votes: Anyone can read, authenticated can vote
CREATE POLICY "votes_select_all" ON proposal_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert_authenticated" ON proposal_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "votes_delete_own" ON proposal_votes FOR DELETE USING (
  voter_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  OR voter_discord_id IS NOT NULL
);

-- Discord links: Users can read and manage their own
CREATE POLICY "discord_links_select_all" ON discord_user_links FOR SELECT USING (true);
CREATE POLICY "discord_links_insert" ON discord_user_links FOR INSERT WITH CHECK (true);
CREATE POLICY "discord_links_update_own" ON discord_user_links FOR UPDATE USING (
  wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
);

-- ============================================================================
-- ADD DISCORD FIELDS TO EXISTING dao_tasks TABLE
-- ============================================================================

-- Add Discord-related columns to dao_tasks if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dao_tasks' AND column_name = 'discord_message_id') THEN
    ALTER TABLE dao_tasks ADD COLUMN discord_message_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dao_tasks' AND column_name = 'discord_thread_id') THEN
    ALTER TABLE dao_tasks ADD COLUMN discord_thread_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dao_tasks' AND column_name = 'from_proposal_id') THEN
    ALTER TABLE dao_tasks ADD COLUMN from_proposal_id UUID REFERENCES task_proposals(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dao_tasks' AND column_name = 'posted_to_discord_at') THEN
    ALTER TABLE dao_tasks ADD COLUMN posted_to_discord_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- VIEWS FOR EASIER QUERYING
-- ============================================================================

CREATE OR REPLACE VIEW v_proposals_with_stats AS
SELECT
  p.*,
  (p.votes_up - p.votes_down) as vote_score,
  CASE
    WHEN p.votes_up + p.votes_down = 0 THEN 0
    ELSE ROUND((p.votes_up::numeric / (p.votes_up + p.votes_down)::numeric) * 100, 1)
  END as approval_percentage,
  (p.votes_up + p.votes_down) as total_votes,
  t.task_id as resulting_task_code
FROM task_proposals p
LEFT JOIN dao_tasks t ON p.resulting_task_id = t.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE task_proposals IS 'Community proposals for new tasks before they are approved';
COMMENT ON TABLE proposal_votes IS 'Votes on task proposals from community members';
COMMENT ON TABLE discord_user_links IS 'Links between Discord accounts and wallet addresses';
COMMENT ON COLUMN task_proposals.source IS 'Where the proposal originated: discord or web';
COMMENT ON COLUMN task_proposals.status IS 'Workflow status: pending → voting → approved/rejected → converted';
COMMENT ON COLUMN proposal_votes.vote_type IS 'Vote direction: up (approve) or down (reject)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON task_proposals TO authenticated;
GRANT SELECT, INSERT, DELETE ON proposal_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON discord_user_links TO authenticated;
GRANT SELECT ON v_proposals_with_stats TO authenticated;

-- Allow anon for public read
GRANT SELECT ON task_proposals TO anon;
GRANT SELECT ON proposal_votes TO anon;
GRANT SELECT ON v_proposals_with_stats TO anon;
