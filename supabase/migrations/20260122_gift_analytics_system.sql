-- ============================================================================
-- Gift Analytics System Migration
-- Created: 2026-01-22
-- Purpose: Unified analytics for gift lifecycle tracking
--
-- Made by mbxarts.com The Moon in a Box property
-- Co-Author: Godez22
-- ============================================================================

-- Drop existing objects if they exist (for re-running)
DROP MATERIALIZED VIEW IF EXISTS mv_gift_funnel_daily CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_task_operations_daily CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_referral_network_daily CASCADE;
DROP TABLE IF EXISTS gift_analytics CASCADE;
DROP TABLE IF EXISTS sync_state CASCADE;

-- ============================================================================
-- TABLE: gift_analytics
-- Main table for gift lifecycle analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gift_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gift identification
  gift_id TEXT NOT NULL UNIQUE,           -- Internal gift ID from Redis
  token_id INTEGER,                        -- NFT token ID on-chain
  campaign_id TEXT,                        -- Creator's campaign ID

  -- Lifecycle timestamps (CRITICAL: separate columns for each stage)
  gift_created_at TIMESTAMPTZ,            -- When gift was minted on-chain
  gift_viewed_at TIMESTAMPTZ,             -- First view of claim page
  preclaim_started_at TIMESTAMPTZ,        -- Pre-claim flow initiated
  education_completed_at TIMESTAMPTZ,     -- All education modules done
  gift_claimed_at TIMESTAMPTZ,            -- Successfully claimed on-chain
  gift_expired_at TIMESTAMPTZ,            -- If expired unclaimed
  gift_returned_at TIMESTAMPTZ,           -- If returned to creator

  -- Addresses (normalized to lowercase)
  creator_address TEXT NOT NULL,          -- Gift creator wallet
  claimer_address TEXT,                   -- Claimer wallet (null until claimed)
  referrer_address TEXT,                  -- Referral attribution

  -- Value tracking
  value_usd DECIMAL(20,8) DEFAULT 0,      -- USD value at creation time
  value_cgc DECIMAL(20,8) DEFAULT 0,      -- CGC tokens if applicable
  value_eth DECIMAL(20,18) DEFAULT 0,     -- ETH value if applicable

  -- User tracking (privacy-conscious)
  email_hash TEXT,                         -- SHA256 hash of email (not plaintext)
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  os TEXT,
  country TEXT,                            -- ISO country code

  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Sync status
  redis_synced_at TIMESTAMPTZ,            -- Last sync from Redis
  blockchain_synced_at TIMESTAMPTZ,       -- Last sync from blockchain

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE gift_analytics IS 'Unified gift lifecycle analytics synced from Redis and blockchain';

-- Column comments for documentation
COMMENT ON COLUMN gift_analytics.gift_id IS 'Unique gift identifier from Redis (not token_id)';
COMMENT ON COLUMN gift_analytics.gift_created_at IS 'Timestamp when gift was minted on-chain';
COMMENT ON COLUMN gift_analytics.gift_claimed_at IS 'Timestamp when gift was successfully claimed';
COMMENT ON COLUMN gift_analytics.email_hash IS 'SHA256 hash of recipient email for privacy';

-- ============================================================================
-- INDEXES for gift_analytics
-- ============================================================================

-- Primary lookup patterns
CREATE INDEX idx_gift_analytics_gift_id ON gift_analytics(gift_id);
CREATE INDEX idx_gift_analytics_token_id ON gift_analytics(token_id);
CREATE INDEX idx_gift_analytics_campaign ON gift_analytics(campaign_id);

-- Time-based queries (dashboard aggregations)
CREATE INDEX idx_gift_analytics_created ON gift_analytics(gift_created_at DESC);
CREATE INDEX idx_gift_analytics_claimed ON gift_analytics(gift_claimed_at DESC);
CREATE INDEX idx_gift_analytics_viewed ON gift_analytics(gift_viewed_at DESC);

-- Address lookups
CREATE INDEX idx_gift_analytics_creator ON gift_analytics(creator_address);
CREATE INDEX idx_gift_analytics_claimer ON gift_analytics(claimer_address);
CREATE INDEX idx_gift_analytics_referrer ON gift_analytics(referrer_address);

-- Compound indexes for common queries
CREATE INDEX idx_gift_analytics_funnel ON gift_analytics(
  gift_created_at,
  gift_viewed_at,
  preclaim_started_at,
  education_completed_at,
  gift_claimed_at
);

-- Partial index for unclaimed gifts
CREATE INDEX idx_gift_analytics_unclaimed ON gift_analytics(gift_created_at)
  WHERE gift_claimed_at IS NULL AND gift_expired_at IS NULL;

-- ============================================================================
-- TABLE: sync_state
-- Tracks sync cursors and status for Redis → PostgreSQL sync
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sync_state (
  id TEXT PRIMARY KEY,                     -- 'gift_redis_sync', 'blockchain_sync', etc.
  last_cursor TEXT,                        -- Last processed ID for resumption
  last_run_at TIMESTAMPTZ,                -- When last sync completed
  items_processed INTEGER DEFAULT 0,       -- Count of items in last run
  total_items_processed BIGINT DEFAULT 0,  -- Lifetime count
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'error', 'paused')),
  error_message TEXT,                      -- Last error if any
  run_duration_ms INTEGER,                 -- How long last run took
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sync_state IS 'Tracks sync state for Redis to PostgreSQL synchronization';

-- Insert initial sync states
INSERT INTO sync_state (id, status) VALUES
  ('gift_redis_sync', 'idle'),
  ('blockchain_gift_sync', 'idle'),
  ('referral_sync', 'idle')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_analytics_updated_at
  BEFORE UPDATE ON gift_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_state_updated_at
  BEFORE UPDATE ON sync_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEW: mv_gift_funnel_daily
-- Pre-aggregated daily gift funnel metrics
-- ============================================================================

CREATE MATERIALIZED VIEW mv_gift_funnel_daily AS
SELECT
  DATE(gift_created_at) as date,
  COALESCE(campaign_id, '__no_campaign__') as campaign_id,

  -- Counts at each funnel stage
  COUNT(*) as total_created,
  COUNT(gift_viewed_at) as total_viewed,
  COUNT(preclaim_started_at) as total_preclaim,
  COUNT(education_completed_at) as total_education,
  COUNT(gift_claimed_at) as total_claimed,
  COUNT(gift_expired_at) as total_expired,
  COUNT(gift_returned_at) as total_returned,

  -- Conversion rates (as percentages)
  ROUND(COUNT(gift_viewed_at)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as view_rate,
  ROUND(COUNT(preclaim_started_at)::numeric / NULLIF(COUNT(gift_viewed_at), 0) * 100, 2) as preclaim_rate,
  ROUND(COUNT(education_completed_at)::numeric / NULLIF(COUNT(preclaim_started_at), 0) * 100, 2) as education_rate,
  ROUND(COUNT(gift_claimed_at)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as claim_rate,

  -- Time metrics (in minutes)
  ROUND(AVG(EXTRACT(EPOCH FROM (gift_claimed_at - gift_created_at)) / 60)
    FILTER (WHERE gift_claimed_at IS NOT NULL), 2) as avg_claim_time_min,
  ROUND(AVG(EXTRACT(EPOCH FROM (education_completed_at - gift_viewed_at)) / 60)
    FILTER (WHERE education_completed_at IS NOT NULL), 2) as avg_education_time_min,

  -- Value metrics
  SUM(value_usd) as total_value_usd,
  SUM(value_usd) FILTER (WHERE gift_claimed_at IS NOT NULL) as claimed_value_usd,
  AVG(value_usd) as avg_gift_value_usd,

  -- Device breakdown (as separate columns to avoid nested aggregates)
  COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_count,
  COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_count,
  COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet_count,
  COUNT(*) FILTER (WHERE device_type = 'unknown' OR device_type IS NULL) as unknown_count

FROM gift_analytics
WHERE gift_created_at IS NOT NULL
  AND gift_created_at > NOW() - INTERVAL '365 days'  -- Rolling 1 year
GROUP BY DATE(gift_created_at), COALESCE(campaign_id, '__no_campaign__')
ORDER BY date DESC;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX idx_mv_gift_funnel_daily_pk
ON mv_gift_funnel_daily(date, campaign_id);

-- ============================================================================
-- MATERIALIZED VIEW: mv_task_operations_daily
-- Pre-aggregated daily task metrics for DAO operations
-- ============================================================================

CREATE MATERIALIZED VIEW mv_task_operations_daily AS
SELECT
  DATE(created_at) as date,
  COALESCE(domain, '__no_domain__') as domain,
  COALESCE(task_type, '__no_type__') as task_type,

  -- Task counts
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE status = 'available') as available,
  COUNT(*) FILTER (WHERE status = 'claimed') as claimed,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'pending_review') as pending_review,
  COUNT(*) FILTER (WHERE status = 'validated') as validated,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE status = 'expired') as expired,

  -- Completion metrics
  ROUND(COUNT(*) FILTER (WHERE status = 'completed')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('claimed', 'in_progress', 'completed')), 0) * 100, 2
  ) as completion_rate,

  -- Time metrics (hours)
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - claimed_at)) / 3600)
    FILTER (WHERE completed_at IS NOT NULL AND claimed_at IS NOT NULL), 2) as avg_completion_hours,

  -- Reward metrics
  SUM(reward_cgc) FILTER (WHERE status = 'completed') as total_rewards_paid,
  AVG(reward_cgc) FILTER (WHERE status = 'completed') as avg_reward_paid

FROM tasks
WHERE created_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '180 days'  -- Rolling 6 months
GROUP BY DATE(created_at), COALESCE(domain, '__no_domain__'), COALESCE(task_type, '__no_type__')
ORDER BY date DESC;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX idx_mv_task_operations_daily_pk
ON mv_task_operations_daily(date, domain, task_type);

-- ============================================================================
-- MATERIALIZED VIEW: mv_referral_network_daily
-- Pre-aggregated daily referral network metrics
-- ============================================================================

CREATE MATERIALIZED VIEW mv_referral_network_daily AS
SELECT
  DATE(r.created_at) as date,
  rc.wallet_address as referrer_wallet,

  -- Referral counts by level
  COUNT(DISTINCT r.id) as total_referrals,
  COUNT(DISTINCT r.id) FILTER (WHERE r.level = 1) as level_1_referrals,
  COUNT(DISTINCT r.id) FILTER (WHERE r.level = 2) as level_2_referrals,
  COUNT(DISTINCT r.id) FILTER (WHERE r.level = 3) as level_3_referrals,

  -- Status breakdown
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'active') as active_referrals,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'inactive') as inactive_referrals,

  -- Click metrics (from referral_codes pre-calculated)
  MAX(rc.click_count) as total_clicks,

  -- Reward metrics (join on referrer_address, status='paid')
  COALESCE(SUM(rr.amount) FILTER (WHERE rr.status = 'paid'), 0) as total_rewards_earned

FROM referral_codes rc
LEFT JOIN referrals r ON rc.code = r.referral_code
LEFT JOIN referral_rewards rr ON rr.referrer_address = rc.wallet_address
WHERE rc.created_at IS NOT NULL
  AND rc.created_at > NOW() - INTERVAL '180 days'
GROUP BY DATE(r.created_at), rc.wallet_address
HAVING DATE(r.created_at) IS NOT NULL
ORDER BY date DESC;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX idx_mv_referral_network_daily_pk
ON mv_referral_network_daily(date, referrer_wallet);

-- ============================================================================
-- FUNCTION: Refresh all materialized views
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  -- Use CONCURRENTLY to avoid locking
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_gift_funnel_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_task_operations_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_referral_network_daily;

  -- Log refresh
  INSERT INTO sync_state (id, last_run_at, status)
  VALUES ('materialized_views_refresh', NOW(), 'idle')
  ON CONFLICT (id) DO UPDATE SET
    last_run_at = NOW(),
    status = 'idle';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on gift_analytics
ALTER TABLE gift_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access to gift_analytics"
ON gift_analytics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can read their own gifts
CREATE POLICY "Users can read their created gifts"
ON gift_analytics
FOR SELECT
TO authenticated
USING (
  creator_address = auth.jwt()->>'sub'
  OR claimer_address = auth.jwt()->>'sub'
);

-- Enable RLS on sync_state
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access sync_state
CREATE POLICY "Service role manages sync_state"
ON sync_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions to authenticated role (for API access)
GRANT SELECT ON gift_analytics TO authenticated;
GRANT SELECT ON mv_gift_funnel_daily TO authenticated;
GRANT SELECT ON mv_task_operations_daily TO authenticated;
GRANT SELECT ON mv_referral_network_daily TO authenticated;

-- Grant permissions to anon role (for public dashboards)
GRANT SELECT ON mv_gift_funnel_daily TO anon;
GRANT SELECT ON mv_task_operations_daily TO anon;
GRANT SELECT ON mv_referral_network_daily TO anon;

-- Service role gets full access for sync operations
GRANT ALL ON gift_analytics TO service_role;
GRANT ALL ON sync_state TO service_role;
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO service_role;

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================

COMMENT ON MATERIALIZED VIEW mv_gift_funnel_daily IS
  'Pre-aggregated daily gift funnel metrics. Refresh with: SELECT refresh_analytics_views()';

COMMENT ON MATERIALIZED VIEW mv_task_operations_daily IS
  'Pre-aggregated daily task operation metrics. Refresh with: SELECT refresh_analytics_views()';

COMMENT ON MATERIALIZED VIEW mv_referral_network_daily IS
  'Pre-aggregated daily referral network metrics. Refresh with: SELECT refresh_analytics_views()';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
