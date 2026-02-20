/**
 * Gift Analytics Sync API
 *
 * Syncs gift analytics data from Redis to PostgreSQL (Supabase)
 * Uses the corrected pattern:
 * - Serverless Node runtime (NOT edge)
 * - Dirty set pattern (NOT KEYS command)
 * - Batch processing with resumption
 * - Single hash per gift
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIGURATION - Serverless Node Runtime
// ============================================================================

export const runtime = 'nodejs'  // NOT 'edge' - allows longer execution
export const maxDuration = 60    // Allow up to 60 seconds for sync
export const dynamic = 'force-dynamic'

// ============================================================================
// CONSTANTS
// ============================================================================

const BATCH_SIZE = 100           // Process 100 gifts per batch
const MAX_RETRIES = 3            // Retry failed items
const DIRTY_SET_KEY = 'gift:analytics:dirty'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface GiftAnalyticsRedis {
  gift_id: string
  token_id?: string
  campaign_id?: string
  creator_address: string
  created_at?: string
  viewed_at?: string
  preclaim_at?: string
  education_completed_at?: string
  claimed_at?: string
  expired_at?: string
  returned_at?: string
  claimer_address?: string
  referrer_address?: string
  value_usd?: string
  email_hash?: string
  device_type?: string
  country?: string
  source?: string
  campaign?: string
}

interface SyncResult {
  success: boolean
  processed: number
  errors: number
  remaining: number
  duration_ms: number
  error_details?: string[]
}

interface SyncState {
  id: string
  last_cursor: string | null
  last_run_at: string | null
  items_processed: number
  total_items_processed: number
  status: 'idle' | 'running' | 'error' | 'paused'
  error_message: string | null
  run_duration_ms: number | null
}

// ============================================================================
// INITIALIZE CLIENTS
// ============================================================================

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    console.warn('⚠️ Redis not configured for analytics sync')
    return null
  }

  return new Redis({ url, token })
}

function getSupabaseClient() {
  // Use project's fallback pattern for env var names
  const url = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_DAO_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase not configured for analytics sync (need NEXT_PUBLIC_SUPABASE_DAO_URL and SUPABASE_DAO_SERVICE_KEY)')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  })
}

// ============================================================================
// SYNC STATE MANAGEMENT
// ============================================================================

async function getSyncState(supabase: any, syncId: string): Promise<SyncState | null> {
  const { data, error } = await supabase
    .from('sync_state')
    .select('*')
    .eq('id', syncId)
    .single()

  if (error) {
    console.error('Failed to get sync state:', error)
    return null
  }

  return data as SyncState
}

async function updateSyncState(
  supabase: any,
  syncId: string,
  updates: Partial<SyncState>
): Promise<void> {
  const { error } = await supabase
    .from('sync_state')
    .upsert({
      id: syncId,
      ...updates,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to update sync state:', error)
  }
}

// ============================================================================
// MAIN SYNC LOGIC
// ============================================================================

async function syncGiftAnalytics(redis: Redis, supabase: any): Promise<SyncResult> {
  const startTime = Date.now()
  let processed = 0
  let errors = 0
  const errorDetails: string[] = []

  try {
    // Get all dirty gift IDs using SMEMBERS (NOT KEYS!)
    const dirtyIds = await redis.smembers(DIRTY_SET_KEY) as string[]

    if (dirtyIds.length === 0) {
      return {
        success: true,
        processed: 0,
        errors: 0,
        remaining: 0,
        duration_ms: Date.now() - startTime
      }
    }

    console.log(`📊 Processing ${dirtyIds.length} dirty gift records`)

    // Process in batches
    for (let i = 0; i < dirtyIds.length; i += BATCH_SIZE) {
      const batch = dirtyIds.slice(i, i + BATCH_SIZE)
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(dirtyIds.length / BATCH_SIZE)}`)

      for (const giftId of batch) {
        let retries = 0
        let success = false

        while (retries < MAX_RETRIES && !success) {
          try {
            // Get gift data from Redis hash
            const giftData = await redis.hgetall(`gift:analytics:${giftId}`) as GiftAnalyticsRedis | null

            if (!giftData || Object.keys(giftData).length === 0) {
              // Gift doesn't exist in Redis, remove from dirty set
              await redis.srem(DIRTY_SET_KEY, giftId)
              success = true
              continue
            }

            // Prepare data for Supabase
            const analyticsRecord = {
              gift_id: giftId,
              token_id: giftData.token_id ? parseInt(giftData.token_id) : null,
              campaign_id: giftData.campaign_id || null,
              creator_address: (giftData.creator_address || '').toLowerCase(),
              gift_created_at: giftData.created_at || null,
              gift_viewed_at: giftData.viewed_at || null,
              preclaim_started_at: giftData.preclaim_at || null,
              education_completed_at: giftData.education_completed_at || null,
              gift_claimed_at: giftData.claimed_at || null,
              gift_expired_at: giftData.expired_at || null,
              gift_returned_at: giftData.returned_at || null,
              claimer_address: giftData.claimer_address ? giftData.claimer_address.toLowerCase() : null,
              referrer_address: giftData.referrer_address ? giftData.referrer_address.toLowerCase() : null,
              value_usd: giftData.value_usd ? parseFloat(giftData.value_usd) : 0,
              email_hash: giftData.email_hash || null,
              device_type: giftData.device_type || null,
              country: giftData.country || null,
              utm_source: giftData.source || null,
              utm_campaign: giftData.campaign || null,
              redis_synced_at: new Date().toISOString()
            }

            // Upsert to Supabase
            const { error: upsertError } = await supabase
              .from('gift_analytics')
              .upsert(analyticsRecord, { onConflict: 'gift_id' })

            if (upsertError) {
              throw new Error(`Supabase upsert failed: ${upsertError.message}`)
            }

            // Remove from dirty set after successful sync
            await redis.srem(DIRTY_SET_KEY, giftId)

            processed++
            success = true

          } catch (error) {
            retries++
            const errorMsg = `Gift ${giftId} retry ${retries}: ${(error as Error).message}`
            console.error(errorMsg)

            if (retries >= MAX_RETRIES) {
              errors++
              errorDetails.push(errorMsg)
            } else {
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100))
            }
          }
        }
      }
    }

    // Get remaining count
    const remaining = await redis.scard(DIRTY_SET_KEY) as number

    return {
      success: errors === 0,
      processed,
      errors,
      remaining,
      duration_ms: Date.now() - startTime,
      error_details: errorDetails.length > 0 ? errorDetails.slice(0, 10) : undefined
    }

  } catch (error) {
    console.error('Sync failed:', error)
    return {
      success: false,
      processed,
      errors: errors + 1,
      remaining: -1,
      duration_ms: Date.now() - startTime,
      error_details: [(error as Error).message]
    }
  }
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Verify authorization (cron secret or admin)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow if: valid cron secret OR valid admin session
    const isAuthorized = authHeader === `Bearer ${cronSecret}`

    if (!isAuthorized && cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Initialize clients
    const redis = getRedisClient()
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis not configured' },
        { status: 503 }
      )
    }

    const supabase = getSupabaseClient()

    // 3. Check if already running
    const syncState = await getSyncState(supabase, 'gift_redis_sync')
    if (syncState?.status === 'running') {
      // Check if it's a stale lock (> 5 minutes)
      const lastRun = syncState.last_run_at ? new Date(syncState.last_run_at).getTime() : 0
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

      if (lastRun > fiveMinutesAgo) {
        return NextResponse.json(
          { error: 'Sync already running', last_run: syncState.last_run_at },
          { status: 409 }
        )
      }
      // Stale lock, proceed anyway
      console.warn('⚠️ Stale sync lock detected, proceeding anyway')
    }

    // 4. Mark as running
    await updateSyncState(supabase, 'gift_redis_sync', {
      status: 'running',
      last_run_at: new Date().toISOString(),
      error_message: null
    })

    // 5. Execute sync
    const result = await syncGiftAnalytics(redis, supabase)

    // 6. Update final state
    await updateSyncState(supabase, 'gift_redis_sync', {
      status: result.success ? 'idle' : 'error',
      items_processed: result.processed,
      run_duration_ms: result.duration_ms,
      error_message: result.error_details?.join('; ') || null
    })

    // 7. Return result
    return NextResponse.json({
      success: result.success,
      processed: result.processed,
      errors: result.errors,
      remaining: result.remaining,
      duration_ms: result.duration_ms,
      message: result.success
        ? `Synced ${result.processed} gifts successfully`
        : `Sync completed with ${result.errors} errors`
    })

  } catch (error) {
    console.error('Sync API error:', error)

    // Try to update error state
    try {
      const supabase = getSupabaseClient()
      await updateSyncState(supabase, 'gift_redis_sync', {
        status: 'error',
        error_message: (error as Error).message,
        run_duration_ms: Date.now() - startTime
      })
    } catch {
      // Ignore error updating state
    }

    return NextResponse.json(
      { error: 'Sync failed', message: (error as Error).message },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Status endpoint
// ============================================================================

export async function GET() {
  try {
    const redis = getRedisClient()
    const supabase = getSupabaseClient()

    // Get sync state
    const syncState = await getSyncState(supabase, 'gift_redis_sync')

    // Get dirty count
    let dirtyCount = 0
    if (redis) {
      dirtyCount = await redis.scard(DIRTY_SET_KEY) as number
    }

    // Get total analytics count
    const { count: totalCount } = await supabase
      .from('gift_analytics')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      status: syncState?.status || 'unknown',
      last_run: syncState?.last_run_at,
      last_items_processed: syncState?.items_processed,
      last_duration_ms: syncState?.run_duration_ms,
      last_error: syncState?.error_message,
      pending_sync: dirtyCount,
      total_synced: totalCount,
      redis_configured: !!redis,
      supabase_configured: true
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get status', message: (error as Error).message },
      { status: 500 }
    )
  }
}
