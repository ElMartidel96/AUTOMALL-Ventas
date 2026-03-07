-- ============================================================
-- WhatsApp AI Assistant — Database Schema
-- Run manually in Supabase SQL Editor
-- ============================================================

-- 1. wa_phone_links — Maps WhatsApp phone → seller account
CREATE TABLE IF NOT EXISTS wa_phone_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  auto_activate BOOLEAN NOT NULL DEFAULT true,
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('en', 'es')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phone_number),
  UNIQUE(wallet_address)
);

CREATE INDEX idx_wa_phone_links_phone ON wa_phone_links(phone_number);
CREATE INDEX idx_wa_phone_links_wallet ON wa_phone_links(wallet_address);

-- 2. wa_sessions — Conversation state per phone number
CREATE TABLE IF NOT EXISTS wa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  wa_phone_number_id TEXT,
  state TEXT NOT NULL DEFAULT 'idle' CHECK (state IN ('idle','collecting','extracting','confirming','creating','complete','error')),
  image_media_ids TEXT[] DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}',
  raw_text_messages TEXT[] DEFAULT '{}',
  extracted_vehicle JSONB,
  missing_fields TEXT[] DEFAULT '{}',
  vehicle_id UUID,
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('en', 'es')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phone_number)
);

CREATE INDEX idx_wa_sessions_phone ON wa_sessions(phone_number);
CREATE INDEX idx_wa_sessions_seller ON wa_sessions(wallet_address);
CREATE INDEX idx_wa_sessions_state ON wa_sessions(state);
CREATE INDEX idx_wa_sessions_expires ON wa_sessions(expires_at);

-- 3. wa_message_log — Every message in/out for debug + audit
CREATE TABLE IF NOT EXISTS wa_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES wa_sessions(id) ON DELETE SET NULL,
  wa_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text',
  phone_number TEXT NOT NULL,
  content TEXT,
  media_id TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_message_log_session ON wa_message_log(session_id);
CREATE INDEX idx_wa_message_log_phone ON wa_message_log(phone_number);
CREATE INDEX idx_wa_message_log_created ON wa_message_log(created_at DESC);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_wa_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wa_sessions_updated
  BEFORE UPDATE ON wa_sessions
  FOR EACH ROW EXECUTE FUNCTION update_wa_session_timestamp();

CREATE TRIGGER trg_wa_phone_links_updated
  BEFORE UPDATE ON wa_phone_links
  FOR EACH ROW EXECUTE FUNCTION update_wa_session_timestamp();

-- RLS: service_role only (server-side API routes)
ALTER TABLE wa_phone_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_wa_phone_links" ON wa_phone_links
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_wa_sessions" ON wa_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_wa_message_log" ON wa_message_log
  FOR ALL USING (auth.role() = 'service_role');
