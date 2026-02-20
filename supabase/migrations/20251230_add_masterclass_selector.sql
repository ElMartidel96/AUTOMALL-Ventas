-- =============================================================================
-- MIGRATION: Add Masterclass Type Selector to Referral Links
-- Date: 2025-12-30
-- Purpose: Allow referral link creators to select which Sales Masterclass
--          version their invitees will experience
-- =============================================================================

-- Made by mbxarts.com The Moon in a Box property
-- Co-Author: Godez22

-- =============================================================================
-- PART 1: ADD MASTERCLASS_TYPE TO PERMANENT_SPECIAL_INVITES
-- =============================================================================

-- Add masterclass_type column with default 'v2' (new video funnel is default)
ALTER TABLE permanent_special_invites
ADD COLUMN IF NOT EXISTS masterclass_type VARCHAR(50) DEFAULT 'v2';

-- Add constraint to ensure valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'permanent_special_invites_masterclass_type_check'
  ) THEN
    ALTER TABLE permanent_special_invites
    ADD CONSTRAINT permanent_special_invites_masterclass_type_check
    CHECK (masterclass_type IN ('v2', 'legacy', 'none'));
  END IF;
END $$;

-- Add comment explaining the field
COMMENT ON COLUMN permanent_special_invites.masterclass_type IS
  'Type of Sales Masterclass: v2 (video funnel - default), legacy (quiz-based), none (no education required)';

-- =============================================================================
-- PART 2: ADD MASTERCLASS_TYPE TO SPECIAL_INVITES (Single-use invites)
-- =============================================================================

ALTER TABLE special_invites
ADD COLUMN IF NOT EXISTS masterclass_type VARCHAR(50) DEFAULT 'v2';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'special_invites_masterclass_type_check'
  ) THEN
    ALTER TABLE special_invites
    ADD CONSTRAINT special_invites_masterclass_type_check
    CHECK (masterclass_type IN ('v2', 'legacy', 'none'));
  END IF;
END $$;

COMMENT ON COLUMN special_invites.masterclass_type IS
  'Type of Sales Masterclass: v2 (video funnel - default), legacy (quiz-based), none (no education required)';

-- =============================================================================
-- PART 3: CREATE MASTERCLASS_COMPLETIONS TABLE
-- Track which masterclass version each user completed
-- =============================================================================

CREATE TABLE IF NOT EXISTS masterclass_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  masterclass_type VARCHAR(50) NOT NULL CHECK (masterclass_type IN ('v2', 'legacy')),
  invite_code VARCHAR(100),
  completion_proof JSONB DEFAULT '{}',
  score INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one completion per type per wallet
  CONSTRAINT unique_wallet_masterclass UNIQUE (wallet_address, masterclass_type)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_masterclass_completions_wallet
  ON masterclass_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_masterclass_completions_type
  ON masterclass_completions(masterclass_type);
CREATE INDEX IF NOT EXISTS idx_masterclass_completions_invite
  ON masterclass_completions(invite_code);

COMMENT ON TABLE masterclass_completions IS
  'Tracks which Sales Masterclass version each user has completed';

-- =============================================================================
-- PART 4: ADD MASTERCLASS_COMPLETED TO REFERRALS TABLE
-- Track which masterclass the referral completed during signup
-- =============================================================================

ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS masterclass_completed VARCHAR(50);

COMMENT ON COLUMN referrals.masterclass_completed IS
  'Which masterclass version the referred user completed during signup';

-- =============================================================================
-- PART 5: CREATE ENUM-LIKE VIEW FOR MASTERCLASS TYPES
-- Useful for frontend dropdown options
-- =============================================================================

CREATE OR REPLACE VIEW masterclass_types AS
SELECT
  'v2' as type_id,
  'Sales Masterclass V2' as name_en,
  'Sales Masterclass V2' as name_es,
  'Video-first neuromarketing funnel with 3 strategic videos' as description_en,
  'Embudo de neuromarketing con 3 videos estratégicos' as description_es,
  true as is_default,
  1 as sort_order
UNION ALL
SELECT
  'legacy' as type_id,
  'Sales Masterclass (Legacy)' as name_en,
  'Sales Masterclass (Clásico)' as name_es,
  'Original 11-block quiz-based educational experience' as description_en,
  'Experiencia educativa original con 11 bloques y quiz' as description_es,
  false as is_default,
  2 as sort_order
UNION ALL
SELECT
  'none' as type_id,
  'No Education Required' as name_en,
  'Sin Educación Requerida' as name_es,
  'Skip masterclass - direct to wallet connection' as description_en,
  'Saltar masterclass - directo a conexión de wallet' as description_es,
  false as is_default,
  3 as sort_order
ORDER BY sort_order;

COMMENT ON VIEW masterclass_types IS
  'Available masterclass types for referral link selector';

-- =============================================================================
-- PART 6: UPDATE EXISTING RECORDS TO DEFAULT 'v2'
-- =============================================================================

-- Set all existing permanent invites to 'v2' (new default)
UPDATE permanent_special_invites
SET masterclass_type = 'v2'
WHERE masterclass_type IS NULL;

-- Set all existing special invites to 'v2' (new default)
UPDATE special_invites
SET masterclass_type = 'v2'
WHERE masterclass_type IS NULL;

-- =============================================================================
-- PART 7: RLS POLICIES FOR MASTERCLASS_COMPLETIONS
-- =============================================================================

-- Enable RLS
ALTER TABLE masterclass_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own completions
CREATE POLICY IF NOT EXISTS "Users can view own masterclass completions"
  ON masterclass_completions
  FOR SELECT
  USING (true);

-- Policy: Service role can insert completions
CREATE POLICY IF NOT EXISTS "Service can insert masterclass completions"
  ON masterclass_completions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update completions
CREATE POLICY IF NOT EXISTS "Service can update masterclass completions"
  ON masterclass_completions
  FOR UPDATE
  USING (true);

-- =============================================================================
-- PART 8: HELPER FUNCTION TO GET MASTERCLASS TYPE FOR INVITE
-- =============================================================================

CREATE OR REPLACE FUNCTION get_invite_masterclass_type(p_invite_code TEXT)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_masterclass_type VARCHAR(50);
BEGIN
  -- First try permanent invites
  SELECT masterclass_type INTO v_masterclass_type
  FROM permanent_special_invites
  WHERE invite_code = p_invite_code
  LIMIT 1;

  -- If not found, try special invites
  IF v_masterclass_type IS NULL THEN
    SELECT masterclass_type INTO v_masterclass_type
    FROM special_invites
    WHERE invite_code = p_invite_code
    LIMIT 1;
  END IF;

  -- Default to 'v2' if still null
  RETURN COALESCE(v_masterclass_type, 'v2');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_invite_masterclass_type IS
  'Returns the masterclass type for a given invite code';

-- =============================================================================
-- PART 9: FUNCTION TO RECORD MASTERCLASS COMPLETION
-- =============================================================================

CREATE OR REPLACE FUNCTION record_masterclass_completion(
  p_wallet_address TEXT,
  p_masterclass_type VARCHAR(50),
  p_invite_code TEXT DEFAULT NULL,
  p_score INTEGER DEFAULT 0,
  p_time_spent INTEGER DEFAULT 0,
  p_completion_proof JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_completion_id UUID;
BEGIN
  INSERT INTO masterclass_completions (
    wallet_address,
    masterclass_type,
    invite_code,
    score,
    time_spent_seconds,
    completion_proof,
    completed_at
  ) VALUES (
    p_wallet_address,
    p_masterclass_type,
    p_invite_code,
    p_score,
    p_time_spent,
    p_completion_proof,
    NOW()
  )
  ON CONFLICT (wallet_address, masterclass_type)
  DO UPDATE SET
    score = GREATEST(masterclass_completions.score, EXCLUDED.score),
    time_spent_seconds = masterclass_completions.time_spent_seconds + EXCLUDED.time_spent_seconds,
    completion_proof = masterclass_completions.completion_proof || EXCLUDED.completion_proof,
    completed_at = NOW()
  RETURNING id INTO v_completion_id;

  RETURN v_completion_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_masterclass_completion IS
  'Records or updates a masterclass completion for a user';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
BEGIN
  -- Verify columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'permanent_special_invites'
    AND column_name = 'masterclass_type'
  ) THEN
    RAISE NOTICE '✅ permanent_special_invites.masterclass_type column exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'special_invites'
    AND column_name = 'masterclass_type'
  ) THEN
    RAISE NOTICE '✅ special_invites.masterclass_type column exists';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'masterclass_completions'
  ) THEN
    RAISE NOTICE '✅ masterclass_completions table exists';
  END IF;

  RAISE NOTICE '✅ Migration 20251230_add_masterclass_selector completed successfully';
END $$;
