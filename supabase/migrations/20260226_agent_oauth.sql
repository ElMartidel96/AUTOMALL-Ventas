-- =============================================
-- OAuth 2.1 for MCP Gateway — Database Migration
-- AutoMALL Platform
-- =============================================

-- agent_oauth_clients: Dynamic Client Registration (RFC 7591)
CREATE TABLE IF NOT EXISTS agent_oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT UNIQUE NOT NULL,
  client_name TEXT,
  redirect_uris TEXT[] NOT NULL,
  grant_types TEXT[] NOT NULL DEFAULT '{authorization_code,refresh_token}',
  response_types TEXT[] NOT NULL DEFAULT '{code}',
  token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- agent_oauth_codes: Authorization codes (short-lived, 10 min)
CREATE TABLE IF NOT EXISTS agent_oauth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'mcp:read mcp:write',
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL DEFAULT 'S256',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- agent_oauth_tokens: Access + refresh tokens
CREATE TABLE IF NOT EXISTS agent_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  token_type TEXT NOT NULL, -- 'access' or 'refresh'
  client_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'mcp:read mcp:write',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON agent_oauth_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_hash ON agent_oauth_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON agent_oauth_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_hash ON agent_oauth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_wallet ON agent_oauth_tokens(wallet_address);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON agent_oauth_tokens(expires_at);

-- RLS
ALTER TABLE agent_oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_oauth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_oauth_clients_service_all" ON agent_oauth_clients
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "agent_oauth_codes_service_all" ON agent_oauth_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "agent_oauth_tokens_service_all" ON agent_oauth_tokens
  FOR ALL USING (auth.role() = 'service_role');
