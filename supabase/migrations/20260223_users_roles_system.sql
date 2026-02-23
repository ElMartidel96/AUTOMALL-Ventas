-- Migration: User Roles System (buyer / seller / birddog)
-- Creates the `users` table that maps wallet addresses to roles.
-- Every connected wallet gets exactly one row; role defaults to 'buyer'.

-- 1. Enum type for roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'birddog');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'buyer',
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "users_public_read" ON users FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "users_service_all" ON users FOR ALL USING (auth.role() = 'service_role');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 6. Backfill: migrate existing sellers as role='seller'
INSERT INTO users (wallet_address, role, display_name, email, phone, avatar_url, created_at)
SELECT wallet_address, 'seller'::user_role, business_name, email, phone, logo_url, created_at
FROM sellers
ON CONFLICT (wallet_address) DO NOTHING;
