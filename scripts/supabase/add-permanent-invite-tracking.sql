-- =====================================================
-- ADD PERMANENT INVITE TRACKING TO REFERRALS TABLE
-- Allows tracking which permanent invite code a user came from
-- =====================================================

-- Add column to referrals table
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS source_permanent_invite text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_referrals_permanent_invite
ON referrals(source_permanent_invite);

-- Add comment
COMMENT ON COLUMN referrals.source_permanent_invite IS 'Permanent invite code that brought this user (if applicable)';

-- Update existing referrals table types
-- The TypeScript types will be updated separately

-- Verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'referrals' AND column_name = 'source_permanent_invite';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Permanent invite tracking added to referrals table!';
  RAISE NOTICE '   - Column: source_permanent_invite';
  RAISE NOTICE '   - Index: idx_referrals_permanent_invite';
END $$;
