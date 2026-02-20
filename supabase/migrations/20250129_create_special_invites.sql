-- =====================================================
-- SPECIAL INVITES TABLE
-- =====================================================
-- Creates the special_invites table for tracking premium
-- referral invites with educational requirements.
--
-- Created: 2025-01-29
-- =====================================================

-- Create special_invites table
CREATE TABLE IF NOT EXISTS special_invites (
    id SERIAL PRIMARY KEY,

    -- Invite identification
    invite_code VARCHAR(50) UNIQUE NOT NULL,

    -- Referrer info
    referrer_wallet VARCHAR(42) NOT NULL,
    referrer_code VARCHAR(50),

    -- Protection & customization
    password_hash VARCHAR(64),
    custom_message TEXT,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired', 'revoked')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- Claim tracking
    claimed_by VARCHAR(42),
    claimed_at TIMESTAMPTZ,

    -- Progress tracking
    education_completed BOOLEAN DEFAULT FALSE,
    wallet_connected BOOLEAN DEFAULT FALSE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_special_invites_code ON special_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_special_invites_referrer ON special_invites(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_special_invites_status ON special_invites(status);
CREATE INDEX IF NOT EXISTS idx_special_invites_claimed_by ON special_invites(claimed_by) WHERE claimed_by IS NOT NULL;

-- Add comment
COMMENT ON TABLE special_invites IS 'Premium referral invites with educational requirements (Sales Masterclass)';

-- Optional: Create RPC function for auto-creating table (called from API as fallback)
CREATE OR REPLACE FUNCTION create_special_invites_table()
RETURNS void AS $$
BEGIN
    -- This function exists as a fallback - table should already exist
    RAISE NOTICE 'special_invites table already exists';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS (Row Level Security)
ALTER TABLE special_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active invites by code
CREATE POLICY "Anyone can read active invites by code"
    ON special_invites
    FOR SELECT
    USING (status = 'active');

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access"
    ON special_invites
    FOR ALL
    USING (true)
    WITH CHECK (true);
