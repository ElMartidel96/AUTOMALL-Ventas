-- ═══════════════════════════════════════════════════════════════
-- Meta Integration Tables
-- WhatsApp Catalog + Facebook Auto-Publishing
--
-- Tables:
--   1. seller_meta_connections — Facebook OAuth tokens per seller
--   2. meta_publication_log    — Log of every FB publication
--
-- Run in Supabase SQL Editor BEFORE enabling Meta features.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. seller_meta_connections
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seller_meta_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,

  -- Facebook OAuth data
  fb_user_id TEXT NOT NULL,
  fb_page_id TEXT NOT NULL,
  fb_page_name TEXT NOT NULL DEFAULT '',
  fb_page_access_token TEXT NOT NULL,

  -- WhatsApp Business (optional, future)
  waba_id TEXT,
  catalog_id TEXT,

  -- Permissions granted
  permissions TEXT[] NOT NULL DEFAULT '{}',

  -- Auto-publish configuration
  auto_publish_on_active BOOLEAN NOT NULL DEFAULT true,
  auto_publish_on_sold BOOLEAN NOT NULL DEFAULT true,
  include_price BOOLEAN NOT NULL DEFAULT true,
  include_hashtags BOOLEAN NOT NULL DEFAULT true,
  caption_language TEXT NOT NULL DEFAULT 'both' CHECK (caption_language IN ('en', 'es', 'both')),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One active connection per seller
  UNIQUE(seller_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meta_conn_wallet ON seller_meta_connections(wallet_address);
CREATE INDEX IF NOT EXISTS idx_meta_conn_page ON seller_meta_connections(fb_page_id);
CREATE INDEX IF NOT EXISTS idx_meta_conn_active ON seller_meta_connections(is_active) WHERE is_active = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_meta_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meta_connection_updated ON seller_meta_connections;
CREATE TRIGGER trg_meta_connection_updated
  BEFORE UPDATE ON seller_meta_connections
  FOR EACH ROW EXECUTE FUNCTION update_meta_connection_timestamp();

-- RLS
ALTER TABLE seller_meta_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meta_conn_service_all" ON seller_meta_connections
  FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- 2. meta_publication_log
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meta_publication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES seller_meta_connections(id) ON DELETE CASCADE,

  -- Publication details
  post_type TEXT NOT NULL CHECK (post_type IN ('new_listing', 'sold', 'repost')),
  fb_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
  error_message TEXT,

  -- Content snapshot
  caption TEXT NOT NULL DEFAULT '',
  image_urls TEXT[] NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meta_pub_vehicle ON meta_publication_log(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_meta_pub_seller ON meta_publication_log(seller_id);
CREATE INDEX IF NOT EXISTS idx_meta_pub_status ON meta_publication_log(status);
CREATE INDEX IF NOT EXISTS idx_meta_pub_created ON meta_publication_log(created_at DESC);

-- RLS
ALTER TABLE meta_publication_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meta_pub_service_all" ON meta_publication_log
  FOR ALL USING (auth.role() = 'service_role');
