-- =============================================
-- AI Agent Connector — Database Migration
-- AutoMALL Platform
-- =============================================

-- agent_api_keys: API keys for remote access (MCP/OpenAPI)
CREATE TABLE IF NOT EXISTS agent_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  scopes TEXT[] NOT NULL DEFAULT '{read}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  rate_limit INTEGER NOT NULL DEFAULT 100,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- agent_audit_log: Every action executed by an agent
CREATE TABLE IF NOT EXISTS agent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  api_key_id UUID REFERENCES agent_api_keys(id),
  tool_name TEXT NOT NULL,
  tool_input JSONB,
  tool_output JSONB,
  connection_mode TEXT NOT NULL,
  ai_provider TEXT,
  duration_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- agent_approval_queue: Destructive actions requiring approval (Phase 2+)
CREATE TABLE IF NOT EXISTS agent_approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  api_key_id UUID REFERENCES agent_api_keys(id),
  tool_name TEXT NOT NULL,
  tool_input JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_wallet ON agent_api_keys(wallet_address);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_hash ON agent_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_wallet ON agent_audit_log(wallet_address);
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_created ON agent_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_approval_queue_wallet ON agent_approval_queue(wallet_address, status);

-- RLS
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_approval_queue ENABLE ROW LEVEL SECURITY;
