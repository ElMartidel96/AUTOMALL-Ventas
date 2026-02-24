-- Add personal social media columns to users table
-- These are optional personal accounts, separate from business accounts in sellers table

ALTER TABLE users ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_tiktok TEXT;
