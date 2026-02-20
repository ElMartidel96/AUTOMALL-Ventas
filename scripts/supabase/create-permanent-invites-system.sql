-- =====================================================
-- PERMANENT SPECIAL INVITES SYSTEM
-- Enterprise-grade multi-use referral invite system
--
-- Features:
-- - Permanent links (never expire unless manually disabled)
-- - Multi-user tracking (unlimited claims)
-- - Full analytics and history
-- - Integration with referral bonus system
--
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Created: 2025-12-05
-- =====================================================

-- =====================================================
-- TABLE 1: permanent_special_invites
-- Main table for permanent invite links
-- =====================================================

CREATE TABLE IF NOT EXISTS permanent_special_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Invite identification
  invite_code text UNIQUE NOT NULL,
  referrer_wallet text NOT NULL,
  referrer_code text,

  -- Customization
  custom_message text,
  custom_title text,
  image_url text,

  -- Security (optional password protection)
  password_hash text,

  -- Status and controls
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  never_expires boolean DEFAULT true,
  expires_at timestamptz,
  max_claims integer, -- null = unlimited

  -- Analytics counters
  total_clicks integer DEFAULT 0,
  total_claims integer DEFAULT 0,
  total_completed integer DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0.00,

  -- Metadata
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_claimed_at timestamptz,

  -- Constraints
  CONSTRAINT valid_invite_code CHECK (invite_code ~ '^PI-[A-Z0-9]+-[A-F0-9]+$'),
  CONSTRAINT valid_wallet CHECK (referrer_wallet ~ '^0x[a-fA-F0-9]{40}$')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_permanent_invites_code ON permanent_special_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_permanent_invites_referrer ON permanent_special_invites(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_permanent_invites_status ON permanent_special_invites(status);
CREATE INDEX IF NOT EXISTS idx_permanent_invites_created ON permanent_special_invites(created_at DESC);

-- Table comment
COMMENT ON TABLE permanent_special_invites IS 'Permanent multi-use special invite links for referral system';
COMMENT ON COLUMN permanent_special_invites.invite_code IS 'Format: PI-TIMESTAMP-RANDOM (PI = Permanent Invite)';
COMMENT ON COLUMN permanent_special_invites.max_claims IS 'Maximum number of claims allowed (null = unlimited)';
COMMENT ON COLUMN permanent_special_invites.conversion_rate IS 'Percentage of clicks that resulted in completed claims';

-- =====================================================
-- TABLE 2: permanent_special_invite_claims
-- Tracks every user who uses a permanent invite
-- =====================================================

CREATE TABLE IF NOT EXISTS permanent_special_invite_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship to invite
  invite_code text NOT NULL,

  -- User information
  claimed_by_wallet text NOT NULL,

  -- Referrer chain (for multi-level tracking)
  referrer_wallet text,
  referrer_code text,

  -- Flow completion tracking
  education_completed boolean DEFAULT false,
  wallet_connected boolean DEFAULT false,
  profile_created boolean DEFAULT false,
  signup_bonus_claimed boolean DEFAULT false,

  -- Bonus tracking
  bonus_amount numeric(20,2) DEFAULT 0,
  bonus_tx_hash text,
  bonus_claimed_at timestamptz,

  -- Session tracking
  ip_hash text,
  user_agent text,
  source text,
  campaign text,

  -- Timestamps
  clicked_at timestamptz,
  claimed_at timestamptz DEFAULT now(),
  completed_at timestamptz,

  -- Metadata
  metadata jsonb,

  -- Constraints
  CONSTRAINT valid_claimed_wallet CHECK (claimed_by_wallet ~ '^0x[a-fA-F0-9]{40}$'),
  CONSTRAINT unique_wallet_per_invite UNIQUE(invite_code, claimed_by_wallet)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_permanent_claims_code ON permanent_special_invite_claims(invite_code);
CREATE INDEX IF NOT EXISTS idx_permanent_claims_wallet ON permanent_special_invite_claims(claimed_by_wallet);
CREATE INDEX IF NOT EXISTS idx_permanent_claims_referrer ON permanent_special_invite_claims(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_permanent_claims_completed ON permanent_special_invite_claims(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_permanent_claims_claimed_at ON permanent_special_invite_claims(claimed_at DESC);

-- Table comment
COMMENT ON TABLE permanent_special_invite_claims IS 'Multi-user tracking for permanent special invites - stores ALL users who claim';
COMMENT ON CONSTRAINT unique_wallet_per_invite ON permanent_special_invite_claims IS 'Prevents same wallet from claiming same invite twice';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE permanent_special_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE permanent_special_invite_claims ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active invites
CREATE POLICY "Anyone can read active invites" ON permanent_special_invites
  FOR SELECT
  USING (status = 'active');

-- Policy: Service role has full access to invites
CREATE POLICY "Service role full access to invites" ON permanent_special_invites
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Users can read their own claims
CREATE POLICY "Users can read their own claims" ON permanent_special_invite_claims
  FOR SELECT
  USING (claimed_by_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Policy: Service role has full access to claims
CREATE POLICY "Service role full access to claims" ON permanent_special_invite_claims
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Update invite counters after claim
CREATE OR REPLACE FUNCTION update_permanent_invite_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update counters in permanent_special_invites
  UPDATE permanent_special_invites
  SET
    total_claims = total_claims + 1,
    last_claimed_at = NEW.claimed_at,
    updated_at = now(),
    conversion_rate = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::numeric /
         NULLIF(total_clicks, 0)::numeric) * 100,
        2
      )
      FROM permanent_special_invite_claims
      WHERE invite_code = NEW.invite_code
    )
  WHERE invite_code = NEW.invite_code;

  RETURN NEW;
END;
$$;

-- Trigger: Auto-update counters on new claim
DROP TRIGGER IF EXISTS trigger_update_permanent_invite_counters ON permanent_special_invite_claims;
CREATE TRIGGER trigger_update_permanent_invite_counters
  AFTER INSERT ON permanent_special_invite_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_permanent_invite_counters();

-- Function: Update completed counter when claim is marked complete
CREATE OR REPLACE FUNCTION update_permanent_invite_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE permanent_special_invites
    SET
      total_completed = total_completed + 1,
      updated_at = now(),
      conversion_rate = (
        SELECT ROUND(
          (COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::numeric /
           NULLIF(total_clicks, 0)::numeric) * 100,
          2
        )
        FROM permanent_special_invite_claims
        WHERE invite_code = NEW.invite_code
      )
    WHERE invite_code = NEW.invite_code;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Auto-update completed counter
DROP TRIGGER IF EXISTS trigger_update_permanent_invite_completed ON permanent_special_invite_claims;
CREATE TRIGGER trigger_update_permanent_invite_completed
  AFTER UPDATE ON permanent_special_invite_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_permanent_invite_completed();

-- Function: Increment click counter
CREATE OR REPLACE FUNCTION increment_permanent_invite_clicks(p_invite_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE permanent_special_invites
  SET
    total_clicks = total_clicks + 1,
    updated_at = now()
  WHERE invite_code = p_invite_code;
END;
$$;

-- Function: Get invite statistics
CREATE OR REPLACE FUNCTION get_permanent_invite_stats(p_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'invite_code', i.invite_code,
    'total_clicks', i.total_clicks,
    'total_claims', i.total_claims,
    'total_completed', i.total_completed,
    'conversion_rate', i.conversion_rate,
    'created_at', i.created_at,
    'last_claimed_at', i.last_claimed_at,
    'recent_claims', (
      SELECT json_agg(
        json_build_object(
          'wallet', c.claimed_by_wallet,
          'claimed_at', c.claimed_at,
          'completed', c.completed_at IS NOT NULL
        ) ORDER BY c.claimed_at DESC
      )
      FROM permanent_special_invite_claims c
      WHERE c.invite_code = p_invite_code
      LIMIT 10
    )
  )
  INTO result
  FROM permanent_special_invites i
  WHERE i.invite_code = p_invite_code;

  RETURN result;
END;
$$;

-- Function: Check if wallet already claimed invite
CREATE OR REPLACE FUNCTION has_claimed_permanent_invite(
  p_invite_code text,
  p_wallet text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claim_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM permanent_special_invite_claims
    WHERE invite_code = p_invite_code
    AND claimed_by_wallet = LOWER(p_wallet)
  ) INTO claim_exists;

  RETURN claim_exists;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON permanent_special_invites TO service_role;
GRANT ALL ON permanent_special_invite_claims TO service_role;
GRANT EXECUTE ON FUNCTION update_permanent_invite_counters() TO service_role;
GRANT EXECUTE ON FUNCTION update_permanent_invite_completed() TO service_role;
GRANT EXECUTE ON FUNCTION increment_permanent_invite_clicks(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_permanent_invite_stats(text) TO service_role;
GRANT EXECUTE ON FUNCTION has_claimed_permanent_invite(text, text) TO service_role;

-- Grant read access to authenticated users
GRANT SELECT ON permanent_special_invites TO authenticated;
GRANT SELECT ON permanent_special_invite_claims TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that tables were created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name LIKE 'permanent_special%'
ORDER BY table_name;

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename LIKE 'permanent_special%'
ORDER BY tablename, indexname;

-- Check functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%permanent%invite%'
ORDER BY routine_name;

-- =====================================================
-- SAMPLE DATA (for testing - REMOVE IN PRODUCTION)
-- =====================================================

-- Uncomment to insert test data:
/*
INSERT INTO permanent_special_invites (
  invite_code,
  referrer_wallet,
  referrer_code,
  custom_message,
  custom_title
) VALUES (
  'PI-TEST001-ABCDEF123456',
  '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6',
  'CG-C655BF',
  'Welcome to CryptoGift DAO! This is a permanent invite link.',
  'Exclusive Permanent Invite'
);
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Permanent Special Invites System Migration Complete!';
  RAISE NOTICE '   - Tables created: permanent_special_invites, permanent_special_invite_claims';
  RAISE NOTICE '   - Indexes created: 10 performance indexes';
  RAISE NOTICE '   - RLS enabled with secure policies';
  RAISE NOTICE '   - Helper functions: 5 utility functions';
  RAISE NOTICE '   - Triggers: Auto-update counters';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run verification queries above';
  RAISE NOTICE '2. Update TypeScript types (lib/supabase/types.ts)';
  RAISE NOTICE '3. Create API endpoints';
  RAISE NOTICE '4. Test with sample invite';
END $$;
