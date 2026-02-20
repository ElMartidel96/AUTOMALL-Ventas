-- ============================================
-- Migration: Add Social Verification Fields
-- Date: 2025-12-03
-- Description: Adds verification status fields for Twitter, Discord, and Telegram
-- ============================================

-- Add Twitter verification fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS twitter_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS twitter_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS twitter_id TEXT;

-- Add Discord verification fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS discord_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS discord_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discord_id TEXT;

-- Add Telegram verification fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS telegram_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS telegram_id TEXT;

-- Create indexes for faster lookups by platform ID
CREATE INDEX IF NOT EXISTS idx_user_profiles_twitter_id ON user_profiles(twitter_id) WHERE twitter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_discord_id ON user_profiles(discord_id) WHERE discord_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_telegram_id ON user_profiles(telegram_id) WHERE telegram_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.twitter_verified IS 'Whether the Twitter account has been verified via OAuth';
COMMENT ON COLUMN user_profiles.twitter_verified_at IS 'Timestamp when Twitter was verified';
COMMENT ON COLUMN user_profiles.twitter_id IS 'Twitter user ID (numeric string)';
COMMENT ON COLUMN user_profiles.discord_verified IS 'Whether the Discord account has been verified via OAuth';
COMMENT ON COLUMN user_profiles.discord_verified_at IS 'Timestamp when Discord was verified';
COMMENT ON COLUMN user_profiles.discord_id IS 'Discord user ID (snowflake)';
COMMENT ON COLUMN user_profiles.telegram_verified IS 'Whether the Telegram account has been verified via Login Widget';
COMMENT ON COLUMN user_profiles.telegram_verified_at IS 'Timestamp when Telegram was verified';
COMMENT ON COLUMN user_profiles.telegram_id IS 'Telegram user ID';
