-- ============================================================================
-- 👤 USER PROFILES SYSTEM - CryptoGift DAO
-- ============================================================================
-- Version: 1.0.0
-- Description: Complete user profile system with optional email/password recovery
-- Author: CryptoGift DAO Team
-- Date: 2025-11-28
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For trigram-based fuzzy text search

-- ============================================================================
-- 🗃️ TABLES
-- ============================================================================

-- Main user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Primary identifier (wallet address)
  wallet_address VARCHAR(42) NOT NULL UNIQUE,

  -- Optional display info
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,

  -- Optional recovery credentials
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expires_at TIMESTAMPTZ,
  password_hash VARCHAR(255),

  -- Password reset
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMPTZ,

  -- Social links (optional)
  twitter_handle VARCHAR(50),
  telegram_handle VARCHAR(50),
  discord_handle VARCHAR(100),
  website_url TEXT,

  -- Profile settings
  is_public BOOLEAN DEFAULT true,
  show_email BOOLEAN DEFAULT false,
  show_balance BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,

  -- Gamification/stats (cached for performance)
  total_tasks_completed INTEGER DEFAULT 0,
  total_cgc_earned DECIMAL(18, 8) DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,

  -- Metadata
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_wallet CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
  CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_username CHECK (username IS NULL OR (length(username) >= 3 AND username ~ '^[a-zA-Z0-9_]+$')),
  CONSTRAINT valid_twitter CHECK (twitter_handle IS NULL OR twitter_handle ~ '^[a-zA-Z0-9_]{1,15}$'),
  CONSTRAINT valid_telegram CHECK (telegram_handle IS NULL OR telegram_handle ~ '^[a-zA-Z0-9_]{5,32}$')
);

-- Profile recovery requests (for email/password recovery)
CREATE TABLE IF NOT EXISTS profile_recovery_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Recovery type
  recovery_type VARCHAR(20) NOT NULL CHECK (recovery_type IN ('email_verify', 'password_reset', 'wallet_change')),

  -- Token and status
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),

  -- For wallet change requests
  new_wallet_address VARCHAR(42),
  old_wallet_address VARCHAR(42),

  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile activity log (for security)
CREATE TABLE IF NOT EXISTS profile_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Activity details
  action VARCHAR(50) NOT NULL,
  description TEXT,

  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avatar uploads tracking
CREATE TABLE IF NOT EXISTS profile_avatars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 📊 INDEXES
-- ============================================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON user_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON user_profiles(username) WHERE username IS NOT NULL;

-- Search
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON user_profiles(display_name) WHERE display_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON user_profiles USING gin(username gin_trgm_ops) WHERE username IS NOT NULL;

-- Stats and ranking
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON user_profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_tasks ON user_profiles(total_tasks_completed DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_cgc ON user_profiles(total_cgc_earned DESC);

-- Activity
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON user_profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON user_profiles(created_at DESC);

-- Recovery requests
CREATE INDEX IF NOT EXISTS idx_recovery_token ON profile_recovery_requests(token);
CREATE INDEX IF NOT EXISTS idx_recovery_user ON profile_recovery_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_status ON profile_recovery_requests(status) WHERE status = 'pending';

-- Activity log
CREATE INDEX IF NOT EXISTS idx_activity_user ON profile_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON profile_activity_log(created_at DESC);

-- Avatars
CREATE INDEX IF NOT EXISTS idx_avatars_user ON profile_avatars(user_id) WHERE is_active = true;

-- ============================================================================
-- 🔧 FUNCTIONS
-- ============================================================================

-- Function to update profile stats when tasks are completed
CREATE OR REPLACE FUNCTION update_profile_task_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile when a task is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE user_profiles
    SET
      total_tasks_completed = total_tasks_completed + 1,
      total_cgc_earned = total_cgc_earned + COALESCE(NEW.reward_amount, 0),
      reputation_score = reputation_score + 10,
      updated_at = NOW()
    WHERE wallet_address = NEW.assignee;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile referral stats
CREATE OR REPLACE FUNCTION update_profile_referral_stats()
RETURNS TRIGGER AS $$
DECLARE
  referrer_wallet VARCHAR(42);
BEGIN
  -- Get referrer wallet from referral_codes
  SELECT wallet_address INTO referrer_wallet
  FROM referral_codes
  WHERE code = NEW.referrer_code;

  IF referrer_wallet IS NOT NULL THEN
    UPDATE user_profiles
    SET
      total_referrals = total_referrals + 1,
      reputation_score = reputation_score + 5,
      updated_at = NOW()
    WHERE wallet_address = referrer_wallet;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log profile activity
CREATE OR REPLACE FUNCTION log_profile_activity(
  p_user_id UUID,
  p_action VARCHAR(50),
  p_description TEXT DEFAULT NULL,
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO profile_activity_log (user_id, action, description, ip_address, user_agent, metadata)
  VALUES (p_user_id, p_action, p_description, p_ip_address, p_user_agent, p_metadata)
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure token
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 64)
RETURNS VARCHAR AS $$
BEGIN
  RETURN encode(gen_random_bytes(length / 2), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to create or get profile
CREATE OR REPLACE FUNCTION get_or_create_profile(p_wallet VARCHAR(42))
RETURNS user_profiles AS $$
DECLARE
  profile_record user_profiles;
BEGIN
  -- Try to get existing profile
  SELECT * INTO profile_record
  FROM user_profiles
  WHERE wallet_address = p_wallet;

  -- Create if not exists
  IF NOT FOUND THEN
    INSERT INTO user_profiles (wallet_address)
    VALUES (p_wallet)
    RETURNING * INTO profile_record;
  END IF;

  RETURN profile_record;
END;
$$ LANGUAGE plpgsql;

-- Function to update login stats
CREATE OR REPLACE FUNCTION update_login_stats(p_wallet VARCHAR(42))
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET
    last_login_at = NOW(),
    login_count = login_count + 1,
    updated_at = NOW()
  WHERE wallet_address = p_wallet;
END;
$$ LANGUAGE plpgsql;

-- Function to request password reset
CREATE OR REPLACE FUNCTION request_password_reset(p_email VARCHAR(255))
RETURNS TABLE(success BOOLEAN, token VARCHAR, expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_user_id UUID;
  v_token VARCHAR(255);
  v_expires TIMESTAMPTZ;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE email = p_email AND email_verified = true;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::VARCHAR, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Cancel existing pending requests
  UPDATE profile_recovery_requests
  SET status = 'cancelled'
  WHERE user_id = v_user_id
    AND recovery_type = 'password_reset'
    AND status = 'pending';

  -- Generate new token
  v_token := generate_secure_token(64);
  v_expires := NOW() + INTERVAL '1 hour';

  -- Create recovery request
  INSERT INTO profile_recovery_requests (user_id, recovery_type, token, expires_at)
  VALUES (v_user_id, 'password_reset', v_token, v_expires);

  -- Update profile
  UPDATE user_profiles
  SET
    password_reset_token = v_token,
    password_reset_expires_at = v_expires,
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN QUERY SELECT true, v_token, v_expires;
END;
$$ LANGUAGE plpgsql;

-- Function to verify email
CREATE OR REPLACE FUNCTION verify_email_token(p_token VARCHAR(255))
RETURNS TABLE(success BOOLEAN, wallet_address VARCHAR, message TEXT) AS $$
DECLARE
  v_user_id UUID;
  v_wallet VARCHAR(42);
BEGIN
  -- Find request
  SELECT pr.user_id, up.wallet_address INTO v_user_id, v_wallet
  FROM profile_recovery_requests pr
  JOIN user_profiles up ON pr.user_id = up.id
  WHERE pr.token = p_token
    AND pr.recovery_type = 'email_verify'
    AND pr.status = 'pending'
    AND pr.expires_at > NOW();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::VARCHAR, 'Invalid or expired token'::TEXT;
    RETURN;
  END IF;

  -- Update request
  UPDATE profile_recovery_requests
  SET status = 'completed', completed_at = NOW()
  WHERE token = p_token;

  -- Update profile
  UPDATE user_profiles
  SET
    email_verified = true,
    email_verification_token = NULL,
    email_verification_expires_at = NULL,
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN QUERY SELECT true, v_wallet, 'Email verified successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 🔐 ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_recovery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_avatars ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read for public profiles, full access for owner
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (true); -- Service role has full access

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (true); -- Service role handles auth

CREATE POLICY "System can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- Recovery requests: Only system access
CREATE POLICY "System access to recovery requests"
  ON profile_recovery_requests FOR ALL
  USING (true);

-- Activity log: Only system access
CREATE POLICY "System access to activity log"
  ON profile_activity_log FOR ALL
  USING (true);

-- Avatars: Public read, owner write
CREATE POLICY "Avatars are viewable by everyone"
  ON profile_avatars FOR SELECT
  USING (true);

CREATE POLICY "System can manage avatars"
  ON profile_avatars FOR ALL
  USING (true);

-- ============================================================================
-- 📊 VIEWS
-- ============================================================================

-- Public profile view (hides sensitive data)
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id,
  wallet_address,
  username,
  display_name,
  bio,
  avatar_url,
  twitter_handle,
  telegram_handle,
  discord_handle,
  website_url,
  total_tasks_completed,
  total_cgc_earned,
  total_referrals,
  reputation_score,
  created_at,
  CASE WHEN show_balance THEN total_cgc_earned ELSE NULL END as visible_balance
FROM user_profiles
WHERE is_public = true;

-- Leaderboard view
CREATE OR REPLACE VIEW profile_leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY reputation_score DESC, total_cgc_earned DESC) as rank,
  id,
  wallet_address,
  COALESCE(username, CONCAT(SUBSTRING(wallet_address, 1, 6), '...', SUBSTRING(wallet_address, 39, 4))) as display,
  avatar_url,
  total_tasks_completed,
  total_cgc_earned,
  total_referrals,
  reputation_score,
  CASE
    WHEN reputation_score >= 10000 THEN 'Diamond'
    WHEN reputation_score >= 5000 THEN 'Platinum'
    WHEN reputation_score >= 2500 THEN 'Gold'
    WHEN reputation_score >= 1000 THEN 'Silver'
    WHEN reputation_score >= 500 THEN 'Bronze'
    ELSE 'Starter'
  END as tier,
  CASE
    WHEN reputation_score >= 10000 THEN '#B9F2FF'
    WHEN reputation_score >= 5000 THEN '#E5E4E2'
    WHEN reputation_score >= 2500 THEN '#FFD700'
    WHEN reputation_score >= 1000 THEN '#C0C0C0'
    WHEN reputation_score >= 500 THEN '#CD7F32'
    ELSE '#808080'
  END as tier_color
FROM user_profiles
WHERE is_public = true
ORDER BY reputation_score DESC, total_cgc_earned DESC;

-- ============================================================================
-- 🔔 TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: Task stats trigger would need tasks table, add when available
-- CREATE TRIGGER update_profile_on_task_complete
--   AFTER UPDATE ON tasks
--   FOR EACH ROW
--   EXECUTE FUNCTION update_profile_task_stats();

-- Note: Referral stats trigger would need referrals table
-- CREATE TRIGGER update_profile_on_referral
--   AFTER INSERT ON referrals
--   FOR EACH ROW
--   EXECUTE FUNCTION update_profile_referral_stats();

-- ============================================================================
-- 📝 COMMENTS
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'Main user profile storage with wallet-based identity and optional recovery credentials';
COMMENT ON TABLE profile_recovery_requests IS 'Tracks email verification and password reset requests';
COMMENT ON TABLE profile_activity_log IS 'Security audit log for profile actions';
COMMENT ON TABLE profile_avatars IS 'Tracks uploaded avatar images';

COMMENT ON COLUMN user_profiles.wallet_address IS 'Primary identifier - Ethereum wallet address';
COMMENT ON COLUMN user_profiles.email IS 'Optional recovery email';
COMMENT ON COLUMN user_profiles.password_hash IS 'Optional recovery password (bcrypt hashed)';
COMMENT ON COLUMN user_profiles.reputation_score IS 'Gamification score based on activity';

-- ============================================================================
-- ✅ VERIFICATION
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    RAISE EXCEPTION 'user_profiles table not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_recovery_requests') THEN
    RAISE EXCEPTION 'profile_recovery_requests table not created';
  END IF;

  RAISE NOTICE '✅ User profiles migration completed successfully';
END $$;
