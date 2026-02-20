# 📊 Metabase Implementation Plan - CORRECTED VERSION

## Overview

This document outlines the corrected implementation plan for connecting CryptoGift platforms to Metabase analytics, incorporating all feedback corrections.

---

## 🔴 Critical Corrections Applied

### 1. Redis KEYS Command Issue (FIXED)
**Problem**: Original plan used `redis.keys('gift:analytics:*')` which BLOCKS Redis at scale.

**Solution**: Use **dirty set pattern**:
```redis
# When analytics data changes:
SADD gift:analytics:dirty {giftId}

# During sync:
SMEMBERS gift:analytics:dirty    # Get all dirty IDs
# Process each...
SREM gift:analytics:dirty {giftId}  # Remove after processing
```

### 2. Single Hash per Gift (FIXED)
**Problem**: Original used string keys like `gift:analytics:{giftId}:email_plain`

**Solution**: Single hash per giftId:
```redis
HSET gift:analytics:{giftId}
  created_at "2025-01-22T10:00:00Z"
  viewed_at "2025-01-22T11:30:00Z"
  preclaim_at "2025-01-22T12:00:00Z"
  education_completed_at "2025-01-22T12:15:00Z"
  claimed_at "2025-01-22T12:30:00Z"
  claimer_address "0x..."
  referrer_address "0x..."
  campaign_id "..."
  token_id "..."
  value_usd "10.50"
  email_hash "sha256:..."
```

### 3. Serverless Node Runtime (FIXED)
**Problem**: Original used Edge runtime for heavy batch operations.

**Solution**: Use Serverless Node with batch processing:
```typescript
// ❌ WRONG
export const runtime = 'edge'

// ✅ CORRECT
export const runtime = 'nodejs'
export const maxDuration = 60  // Allow up to 60s for sync
```

### 4. Independent Metrics Queries (FIXED)
**Problem**: Original queries were conceptually wrong for funnel metrics.

**Solution**: Separate time series for created vs claimed:
```sql
-- Created gifts over time
SELECT DATE(gift_created_at) as date, COUNT(*) as created
FROM gift_analytics
WHERE gift_created_at IS NOT NULL
GROUP BY DATE(gift_created_at);

-- Claimed gifts over time
SELECT DATE(gift_claimed_at) as date, COUNT(*) as claimed
FROM gift_analytics
WHERE gift_claimed_at IS NOT NULL
GROUP BY DATE(gift_claimed_at);
```

### 5. Column Names Standardized (FIXED)
**Problem**: Inconsistent column names (`created_at` vs `clicked_at`)

**Solution**: Standard naming convention:
- `gift_created_at` - When gift was minted
- `gift_viewed_at` - First view timestamp
- `gift_claimed_at` - When claimed
- `click_created_at` - Referral click timestamp

### 6. Embedding Security (FIXED)
**Problem**: Guest embed doesn't respect RBAC as originally suggested.

**Solution**: Use views + locked parameters:
```sql
-- Create view with limited data
CREATE VIEW gift_funnel_public AS
SELECT
  DATE(gift_created_at) as date,
  COUNT(*) as total,
  campaign_id
FROM gift_analytics
WHERE gift_created_at > NOW() - INTERVAL '90 days'
GROUP BY date, campaign_id;

-- Metabase: Lock filters to prevent SQL injection
-- Use "locked" parameter type in dashboard
```

---

## 📐 Architecture Design

### Data Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                    CRYPTOGIFT-WALLETS (NFT Gifts)                   │
├─────────────────────────────────────────────────────────────────────┤
│ Events → Redis Hash (gift:analytics:{giftId}) + Dirty Set          │
│                           ↓                                         │
│ Cron Job (Serverless Node) → sync_cursor tracking                  │
│                           ↓                                         │
│ Supabase: gift_analytics table                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    CRYPTOGIFT-WALLETS-DAO                           │
├─────────────────────────────────────────────────────────────────────┤
│ Supabase (Direct): tasks, referrals, rewards                        │
│ Redis DAO: attestations, sessions, rate limiting                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         METABASE                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Connection 1: Supabase PostgreSQL (cryptogift-wallets)              │
│ Connection 2: Supabase PostgreSQL (cryptogift-wallets-DAO)          │
│                           ↓                                         │
│ Dashboards: Gift Funnel, Tasks, Referrals, Financial                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### New Table: `gift_analytics` (cryptogift-wallets)

```sql
-- Migration: Create gift_analytics table
CREATE TABLE IF NOT EXISTS public.gift_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gift identification
  gift_id TEXT NOT NULL UNIQUE,           -- Internal gift ID
  token_id INTEGER,                        -- NFT token ID
  campaign_id TEXT,                        -- Creator's campaign

  -- Lifecycle timestamps (CRITICAL: separate columns)
  gift_created_at TIMESTAMPTZ,            -- When gift was minted
  gift_viewed_at TIMESTAMPTZ,             -- First view
  preclaim_started_at TIMESTAMPTZ,        -- Pre-claim flow started
  education_completed_at TIMESTAMPTZ,     -- Education modules done
  gift_claimed_at TIMESTAMPTZ,            -- Successfully claimed
  gift_expired_at TIMESTAMPTZ,            -- If expired
  gift_returned_at TIMESTAMPTZ,           -- If returned to creator

  -- Addresses
  creator_address TEXT NOT NULL,          -- Gift creator
  claimer_address TEXT,                   -- Who claimed it
  referrer_address TEXT,                  -- Referral attribution

  -- Value tracking
  value_usd DECIMAL(20,8) DEFAULT 0,      -- USD value at creation
  value_cgc DECIMAL(20,8) DEFAULT 0,      -- CGC tokens if applicable

  -- Metadata
  email_hash TEXT,                         -- SHA256 of email
  device_type TEXT,                        -- desktop/mobile/tablet
  country TEXT,                            -- Geo location
  source TEXT,                             -- UTM source
  campaign TEXT,                           -- UTM campaign

  -- Sync tracking
  redis_synced_at TIMESTAMPTZ,            -- Last Redis sync
  blockchain_synced_at TIMESTAMPTZ,       -- Last chain sync

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_gift_analytics_created ON gift_analytics(gift_created_at);
CREATE INDEX idx_gift_analytics_claimed ON gift_analytics(gift_claimed_at);
CREATE INDEX idx_gift_analytics_campaign ON gift_analytics(campaign_id);
CREATE INDEX idx_gift_analytics_creator ON gift_analytics(creator_address);
CREATE INDEX idx_gift_analytics_token ON gift_analytics(token_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_gift_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_analytics_updated_at
  BEFORE UPDATE ON gift_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_analytics_updated_at();
```

### New Table: `sync_state` (for cursor tracking)

```sql
CREATE TABLE IF NOT EXISTS public.sync_state (
  id TEXT PRIMARY KEY,                     -- 'gift_redis_sync', 'blockchain_sync'
  last_cursor TEXT,                        -- Last processed ID
  last_run_at TIMESTAMPTZ,
  items_processed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle',              -- idle, running, error
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial state
INSERT INTO sync_state (id, status) VALUES
  ('gift_redis_sync', 'idle'),
  ('blockchain_gift_sync', 'idle')
ON CONFLICT (id) DO NOTHING;
```

---

## 📦 Redis Structure (Corrected)

### Gift Analytics Hash
```redis
# Single hash per gift with all analytics data
HSET gift:analytics:{giftId}
  gift_id "{giftId}"
  token_id "123"
  campaign_id "camp_xyz"
  creator_address "0xCreator..."

  # Timestamps (ISO 8601)
  created_at "2025-01-22T10:00:00.000Z"
  viewed_at "2025-01-22T11:30:00.000Z"
  preclaim_at "2025-01-22T12:00:00.000Z"
  education_completed_at "2025-01-22T12:15:00.000Z"
  claimed_at ""                              # Empty if not claimed

  # Claim data
  claimer_address ""
  referrer_address ""

  # Value
  value_usd "10.50"

  # Tracking
  email_hash "sha256:abc123..."
  device_type "mobile"
  country "US"
  source "twitter"
  campaign "holiday2025"
```

### Dirty Set for Sync
```redis
# Add to dirty set when gift data changes
SADD gift:analytics:dirty {giftId}

# Check dirty count
SCARD gift:analytics:dirty

# Get all dirty IDs for batch processing
SMEMBERS gift:analytics:dirty

# Remove after successful sync
SREM gift:analytics:dirty {giftId}
```

### Campaign Counters (Atomic)
```redis
# Use HINCRBY for atomic counter updates
HINCRBY gift:campaign:{campaignId}:counters created 1
HINCRBY gift:campaign:{campaignId}:counters viewed 1
HINCRBY gift:campaign:{campaignId}:counters claimed 1

# Get all counters
HGETALL gift:campaign:{campaignId}:counters
```

---

## 🔄 Sync Script Design

### Cron API Route: `/api/analytics/sync`

```typescript
// app/api/analytics/sync/route.ts

export const runtime = 'nodejs'        // NOT edge!
export const maxDuration = 60          // Allow 60 seconds

const BATCH_SIZE = 100                 // Process 100 gifts per run
const MAX_RETRIES = 3                  // Retry failed items

export async function POST(request: NextRequest) {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get sync state from Supabase
  const syncState = await getSyncState('gift_redis_sync')
  if (syncState.status === 'running') {
    return Response.json({ error: 'Sync already running' }, { status: 409 })
  }

  // 3. Mark as running
  await updateSyncState('gift_redis_sync', { status: 'running' })

  try {
    // 4. Get dirty gift IDs from Redis
    const dirtyIds = await redis.smembers('gift:analytics:dirty')

    if (dirtyIds.length === 0) {
      await updateSyncState('gift_redis_sync', {
        status: 'idle',
        last_run_at: new Date().toISOString()
      })
      return Response.json({ message: 'No dirty items', processed: 0 })
    }

    // 5. Process in batches
    let processed = 0
    let errors = 0

    for (let i = 0; i < dirtyIds.length; i += BATCH_SIZE) {
      const batch = dirtyIds.slice(i, i + BATCH_SIZE)

      for (const giftId of batch) {
        try {
          // Get gift data from Redis
          const giftData = await redis.hgetall(`gift:analytics:${giftId}`)

          if (!giftData || Object.keys(giftData).length === 0) {
            // Gift doesn't exist in Redis, remove from dirty set
            await redis.srem('gift:analytics:dirty', giftId)
            continue
          }

          // Upsert to Supabase
          await supabase.from('gift_analytics').upsert({
            gift_id: giftId,
            token_id: giftData.token_id ? parseInt(giftData.token_id) : null,
            campaign_id: giftData.campaign_id || null,
            creator_address: giftData.creator_address,
            gift_created_at: giftData.created_at || null,
            gift_viewed_at: giftData.viewed_at || null,
            preclaim_started_at: giftData.preclaim_at || null,
            education_completed_at: giftData.education_completed_at || null,
            gift_claimed_at: giftData.claimed_at || null,
            claimer_address: giftData.claimer_address || null,
            referrer_address: giftData.referrer_address || null,
            value_usd: giftData.value_usd ? parseFloat(giftData.value_usd) : 0,
            email_hash: giftData.email_hash || null,
            device_type: giftData.device_type || null,
            country: giftData.country || null,
            source: giftData.source || null,
            campaign: giftData.campaign || null,
            redis_synced_at: new Date().toISOString()
          }, { onConflict: 'gift_id' })

          // Remove from dirty set after successful sync
          await redis.srem('gift:analytics:dirty', giftId)
          processed++

        } catch (error) {
          console.error(`Failed to sync gift ${giftId}:`, error)
          errors++
        }
      }
    }

    // 6. Update sync state
    await updateSyncState('gift_redis_sync', {
      status: 'idle',
      last_run_at: new Date().toISOString(),
      items_processed: processed,
      error_message: errors > 0 ? `${errors} items failed` : null
    })

    return Response.json({
      success: true,
      processed,
      errors,
      remaining: dirtyIds.length - processed
    })

  } catch (error) {
    await updateSyncState('gift_redis_sync', {
      status: 'error',
      error_message: (error as Error).message
    })
    throw error
  }
}
```

### Vercel Cron Configuration: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/analytics/sync",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 📈 Materialized Views for Dashboards

### Gift Funnel View

```sql
-- Materialized view for gift funnel metrics
CREATE MATERIALIZED VIEW mv_gift_funnel_daily AS
SELECT
  DATE(gift_created_at) as date,
  campaign_id,
  COUNT(*) as total_created,
  COUNT(gift_viewed_at) as total_viewed,
  COUNT(preclaim_started_at) as total_preclaim,
  COUNT(education_completed_at) as total_education,
  COUNT(gift_claimed_at) as total_claimed,

  -- Conversion rates
  ROUND(COUNT(gift_claimed_at)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate,

  -- Average claim time (minutes)
  AVG(EXTRACT(EPOCH FROM (gift_claimed_at - gift_created_at)) / 60)
    FILTER (WHERE gift_claimed_at IS NOT NULL) as avg_claim_time_min,

  -- Value
  SUM(value_usd) as total_value_usd
FROM gift_analytics
WHERE gift_created_at IS NOT NULL
GROUP BY DATE(gift_created_at), campaign_id
ORDER BY date DESC;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_mv_gift_funnel_daily
ON mv_gift_funnel_daily(date, COALESCE(campaign_id, 'no_campaign'));

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_mv_gift_funnel()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_gift_funnel_daily;
END;
$$ LANGUAGE plpgsql;
```

### Task Operations View (DAO)

```sql
-- Materialized view for task operations
CREATE MATERIALIZED VIEW mv_task_operations_daily AS
SELECT
  DATE(created_at) as date,
  domain,
  task_type,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'available') as available,
  COUNT(*) FILTER (WHERE status = 'claimed') as claimed,
  SUM(reward_cgc) FILTER (WHERE status = 'completed') as total_rewards_paid,
  AVG(EXTRACT(EPOCH FROM (completed_at - claimed_at)) / 3600)
    FILTER (WHERE completed_at IS NOT NULL) as avg_completion_hours
FROM tasks
WHERE created_at > NOW() - INTERVAL '180 days'
GROUP BY DATE(created_at), domain, task_type
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_mv_task_operations_daily
ON mv_task_operations_daily(date, COALESCE(domain, 'none'), COALESCE(task_type, 'none'));
```

### Referral Network View

```sql
-- Materialized view for referral network
CREATE MATERIALIZED VIEW mv_referral_network_daily AS
SELECT
  DATE(r.created_at) as date,
  rc.wallet_address as referrer_wallet,
  COUNT(*) as total_referrals,
  COUNT(*) FILTER (WHERE r.status = 'active') as active_referrals,
  COUNT(*) FILTER (WHERE r.level = 1) as level_1,
  COUNT(*) FILTER (WHERE r.level = 2) as level_2,
  COUNT(*) FILTER (WHERE r.level = 3) as level_3,
  SUM(rr.amount) FILTER (WHERE rr.status = 'completed') as total_rewards
FROM referral_codes rc
LEFT JOIN referrals r ON rc.id = r.referral_code_id
LEFT JOIN referral_rewards rr ON rr.referral_id = r.id
WHERE rc.created_at > NOW() - INTERVAL '180 days'
GROUP BY DATE(r.created_at), rc.wallet_address
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_mv_referral_network_daily
ON mv_referral_network_daily(date, referrer_wallet);
```

---

## 🔧 Implementation Phases

### Phase 1: Database Schema (Day 1)
- [ ] Create `gift_analytics` table in cryptogift-wallets Supabase
- [ ] Create `sync_state` table
- [ ] Create materialized views
- [ ] Set up refresh cron for materialized views

### Phase 2: Redis Refactor (Day 2-3)
- [ ] Implement new Redis key structure (single hash)
- [ ] Add dirty set tracking
- [ ] Migrate existing analytics writes
- [ ] Remove KEYS commands usage

### Phase 3: Sync Script (Day 3-4)
- [ ] Create sync API route with Serverless Node
- [ ] Configure Vercel cron
- [ ] Test batch processing
- [ ] Add monitoring/alerting

### Phase 4: Metabase Setup (Day 5)
- [ ] Install Metabase (Cloud or self-hosted)
- [ ] Connect Supabase databases
- [ ] Create core dashboards
- [ ] Configure embedding with locked parameters

### Phase 5: Testing & Optimization (Day 6-7)
- [ ] Load testing with production data
- [ ] Query optimization
- [ ] Dashboard refinement
- [ ] Documentation

---

## 🎯 Key Metrics to Track

### Gift Funnel Dashboard
1. **Creation Rate**: Gifts created per day/week
2. **View Rate**: % of gifts viewed
3. **Pre-claim Rate**: % that start claiming
4. **Education Completion**: % that complete education
5. **Claim Rate**: Final conversion %
6. **Average Claim Time**: Minutes from creation to claim
7. **Value Distribution**: USD value histogram

### Task Operations Dashboard
1. **Task Velocity**: Tasks completed per day
2. **Domain Distribution**: Tasks by domain (dev, design, etc.)
3. **Completion Rate**: % of claimed tasks completed
4. **Average Duration**: Hours to complete by type
5. **Rewards Distributed**: CGC paid out

### Referral Network Dashboard
1. **Network Growth**: New referrers per day
2. **Multi-level Distribution**: L1/L2/L3 split
3. **Top Referrers**: Leaderboard by conversions
4. **Reward Payouts**: CGC distributed
5. **Conversion Quality**: Claimed gifts per referral

---

Made by mbxarts.com The Moon in a Box property

Co-Author: Godez22
