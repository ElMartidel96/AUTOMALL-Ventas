-- ============================================================================
-- Autos MALL — Multi-Tenant Sellers System
-- Sellers table, RLS, Indexes, vehicle linkage
-- ============================================================================

-- ── Sellers Table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  tagline TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  address TEXT,
  city TEXT DEFAULT 'Houston',
  state TEXT DEFAULT 'TX',
  social_instagram TEXT,
  social_facebook TEXT,
  social_tiktok TEXT,
  theme_primary_color TEXT DEFAULT '#1B3A6B',
  theme_accent_color TEXT DEFAULT '#E8832A',
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Enable RLS ──────────────────────────────────────────────────────────────

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ────────────────────────────────────────────────────────────

-- Public can read active sellers (for subdomain resolution)
CREATE POLICY "sellers_public_read" ON sellers
  FOR SELECT USING (is_active = true);

-- Service role (API routes use service key) can do everything
CREATE POLICY "sellers_service_all" ON sellers
  FOR ALL USING (auth.role() = 'service_role');

-- ── Indexes ─────────────────────────────────────────────────────────────────

-- Handle lookup (every HTTP request on subdomain hits this)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sellers_handle ON sellers(handle);

-- Wallet lookup (profile/dashboard)
CREATE INDEX IF NOT EXISTS idx_sellers_wallet ON sellers(wallet_address);

-- Active sellers listing
CREATE INDEX IF NOT EXISTS idx_sellers_active ON sellers(is_active)
  WHERE is_active = true;

-- ── Link Vehicles to Sellers ────────────────────────────────────────────────

-- Add seller_handle column to vehicles (references seller handle for filtering)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seller_handle TEXT;

-- Index for filtering vehicles by seller
CREATE INDEX IF NOT EXISTS idx_vehicles_seller_handle ON vehicles(seller_handle);

-- ── Auto-update Trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_seller_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sellers_updated_at ON sellers;
CREATE TRIGGER sellers_updated_at
  BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION update_seller_timestamp();
