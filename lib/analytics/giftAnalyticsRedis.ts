/**
 * Gift Analytics Redis Helper - CORRECTED VERSION
 *
 * Uses the correct patterns:
 * - Single hash per gift (NOT multiple string keys)
 * - Dirty set for sync tracking (NOT KEYS command)
 * - Atomic operations for data integrity
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { Redis } from '@upstash/redis'

// ============================================================================
// CONSTANTS
// ============================================================================

const DIRTY_SET_KEY = 'gift:analytics:dirty'
const GIFT_HASH_PREFIX = 'gift:analytics:'
const CAMPAIGN_COUNTERS_PREFIX = 'gift:campaign:'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GiftAnalyticsData {
  gift_id: string
  token_id?: number
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
  value_usd?: number
  email_hash?: string
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  country?: string
  source?: string
  campaign?: string
}

export type GiftEventType =
  | 'created'
  | 'viewed'
  | 'preclaim'
  | 'education_completed'
  | 'claimed'
  | 'expired'
  | 'returned'

// ============================================================================
// REDIS CLIENT SINGLETON
// ============================================================================

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    console.warn('Redis not configured for gift analytics')
    return null
  }

  try {
    redisClient = new Redis({ url, token })
    return redisClient
  } catch (error) {
    console.error('Failed to initialize Redis:', error)
    return null
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Record a gift event in Redis
 * Uses single hash per gift + dirty set for sync tracking
 */
export async function recordGiftEvent(
  giftId: string,
  eventType: GiftEventType,
  data: Partial<GiftAnalyticsData>
): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) {
    console.warn('Redis not available, event not recorded')
    return false
  }

  try {
    const hashKey = `${GIFT_HASH_PREFIX}${giftId}`
    const timestamp = new Date().toISOString()

    // Build the hash fields to update
    const hashFields: Record<string, string> = {
      gift_id: giftId
    }

    // Set the appropriate timestamp field based on event type
    if (eventType === 'education_completed') {
      hashFields.education_completed_at = timestamp
    } else {
      hashFields[`${eventType}_at`] = timestamp
    }

    // Add additional data fields
    if (data.token_id !== undefined) hashFields.token_id = String(data.token_id)
    if (data.campaign_id) hashFields.campaign_id = data.campaign_id
    if (data.creator_address) hashFields.creator_address = data.creator_address.toLowerCase()
    if (data.claimer_address) hashFields.claimer_address = data.claimer_address.toLowerCase()
    if (data.referrer_address) hashFields.referrer_address = data.referrer_address.toLowerCase()
    if (data.value_usd !== undefined) hashFields.value_usd = String(data.value_usd)
    if (data.email_hash) hashFields.email_hash = data.email_hash
    if (data.device_type) hashFields.device_type = data.device_type
    if (data.country) hashFields.country = data.country
    if (data.source) hashFields.source = data.source
    if (data.campaign) hashFields.campaign = data.campaign

    // Use pipeline for atomic operations
    const pipeline = redis.pipeline()

    // 1. Update the gift hash
    pipeline.hset(hashKey, hashFields)

    // 2. Add to dirty set for sync
    pipeline.sadd(DIRTY_SET_KEY, giftId)

    // 3. Update campaign counter if campaign_id exists
    if (data.campaign_id) {
      const counterKey = `${CAMPAIGN_COUNTERS_PREFIX}${data.campaign_id}:counters`
      pipeline.hincrby(counterKey, eventType, 1)
    }

    await pipeline.exec()

    console.log(`Gift event recorded: ${giftId} - ${eventType}`)
    return true

  } catch (error) {
    console.error('Failed to record gift event:', error)
    return false
  }
}

/**
 * Get gift analytics data from Redis
 */
export async function getGiftAnalytics(giftId: string): Promise<GiftAnalyticsData | null> {
  const redis = getRedisClient()
  if (!redis) return null

  try {
    const hashKey = `${GIFT_HASH_PREFIX}${giftId}`
    const data = await redis.hgetall(hashKey) as Record<string, string> | null

    if (!data || Object.keys(data).length === 0) {
      return null
    }

    return {
      gift_id: data.gift_id || giftId,
      token_id: data.token_id ? parseInt(data.token_id) : undefined,
      campaign_id: data.campaign_id || undefined,
      creator_address: data.creator_address || '',
      created_at: data.created_at || undefined,
      viewed_at: data.viewed_at || undefined,
      preclaim_at: data.preclaim_at || undefined,
      education_completed_at: data.education_completed_at || undefined,
      claimed_at: data.claimed_at || undefined,
      expired_at: data.expired_at || undefined,
      returned_at: data.returned_at || undefined,
      claimer_address: data.claimer_address || undefined,
      referrer_address: data.referrer_address || undefined,
      value_usd: data.value_usd ? parseFloat(data.value_usd) : undefined,
      email_hash: data.email_hash || undefined,
      device_type: data.device_type as GiftAnalyticsData['device_type'] || undefined,
      country: data.country || undefined,
      source: data.source || undefined,
      campaign: data.campaign || undefined
    }

  } catch (error) {
    console.error('Failed to get gift analytics:', error)
    return null
  }
}

/**
 * Get count of pending syncs (dirty set size)
 */
export async function getPendingSyncCount(): Promise<number> {
  const redis = getRedisClient()
  if (!redis) return 0

  try {
    return await redis.scard(DIRTY_SET_KEY) as number
  } catch (error) {
    console.error('Failed to get pending sync count:', error)
    return 0
  }
}

/**
 * Get campaign counters
 */
export async function getCampaignCounters(campaignId: string): Promise<Record<string, number>> {
  const redis = getRedisClient()
  if (!redis) return {}

  try {
    const counterKey = `${CAMPAIGN_COUNTERS_PREFIX}${campaignId}:counters`
    const data = await redis.hgetall(counterKey) as Record<string, string> | null

    if (!data) return {}

    const counters: Record<string, number> = {}
    for (const [key, value] of Object.entries(data)) {
      counters[key] = parseInt(value) || 0
    }
    return counters

  } catch (error) {
    console.error('Failed to get campaign counters:', error)
    return {}
  }
}

/**
 * Batch record multiple gift events (for import/migration)
 */
export async function batchRecordGiftEvents(
  events: Array<{ giftId: string; eventType: GiftEventType; data: Partial<GiftAnalyticsData> }>
): Promise<{ success: number; failed: number }> {
  const redis = getRedisClient()
  if (!redis) return { success: 0, failed: events.length }

  let success = 0
  let failed = 0

  // Process in chunks of 50
  const chunkSize = 50
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize)
    const pipeline = redis.pipeline()

    for (const event of chunk) {
      try {
        const hashKey = `${GIFT_HASH_PREFIX}${event.giftId}`
        const timestamp = new Date().toISOString()

        const hashFields: Record<string, string> = {
          gift_id: event.giftId
        }

        if (event.eventType === 'education_completed') {
          hashFields.education_completed_at = timestamp
        } else {
          hashFields[`${event.eventType}_at`] = timestamp
        }

        if (event.data.token_id !== undefined) hashFields.token_id = String(event.data.token_id)
        if (event.data.campaign_id) hashFields.campaign_id = event.data.campaign_id
        if (event.data.creator_address) hashFields.creator_address = event.data.creator_address.toLowerCase()
        if (event.data.claimer_address) hashFields.claimer_address = event.data.claimer_address.toLowerCase()
        if (event.data.value_usd !== undefined) hashFields.value_usd = String(event.data.value_usd)

        pipeline.hset(hashKey, hashFields)
        pipeline.sadd(DIRTY_SET_KEY, event.giftId)

      } catch (error) {
        console.error(`Failed to prepare event for ${event.giftId}:`, error)
        failed++
      }
    }

    try {
      await pipeline.exec()
      success += chunk.length
    } catch (error) {
      console.error('Pipeline failed:', error)
      failed += chunk.length
    }
  }

  return { success, failed }
}

/**
 * Check if Redis is configured and connected
 */
export function isRedisConfigured(): boolean {
  return !!(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) ||
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  )
}

/**
 * Get Redis connection status
 */
export async function getRedisStatus(): Promise<{
  configured: boolean
  connected: boolean
  pendingSync: number
}> {
  const configured = isRedisConfigured()

  if (!configured) {
    return { configured: false, connected: false, pendingSync: 0 }
  }

  try {
    const redis = getRedisClient()
    if (!redis) {
      return { configured: true, connected: false, pendingSync: 0 }
    }

    // Test connection with PING
    await redis.ping()
    const pendingSync = await getPendingSyncCount()

    return { configured: true, connected: true, pendingSync }

  } catch (error) {
    console.error('Redis status check failed:', error)
    return { configured: true, connected: false, pendingSync: 0 }
  }
}
