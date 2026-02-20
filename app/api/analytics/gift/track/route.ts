/**
 * 🎁 GIFT ANALYTICS TRACKING API
 *
 * POST - Record gift lifecycle events
 * GET - Get gift analytics status and pending sync count
 *
 * Events tracked:
 * - created: Gift minted on-chain
 * - viewed: Claim page opened
 * - preclaim: Preclaim flow started
 * - education_completed: All education modules done
 * - claimed: Gift successfully claimed
 * - expired: Gift expired without claim
 * - returned: Gift returned to creator
 *
 * Security:
 * - Rate limiting (60 events/minute per IP)
 * - Event deduplication (same gift+event in 5 min = idempotent)
 * - Input validation + sanitization
 * - CORS configured for allowed origins
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 *
 * @endpoint /api/analytics/gift/track
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  recordGiftEvent,
  getGiftAnalytics,
  getPendingSyncCount,
  getRedisStatus,
  type GiftEventType,
  type GiftAnalyticsData
} from '@/lib/analytics'
import crypto from 'crypto'

// ============================================================================
// CONFIGURATION
// ============================================================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Allowed origins for CORS (add your domains)
const ALLOWED_ORIGINS = [
  'https://www.mbxarts.com',
  'https://mbxarts.com',
  'https://cryptogift.com',
  'https://www.cryptogift.com',
  'https://dao.cryptogift.com',
  'http://localhost:3000',
  'http://localhost:3001',
]

// Valid event types (whitelist)
const VALID_EVENT_TYPES: GiftEventType[] = [
  'created',
  'viewed',
  'preclaim',
  'education_completed',
  'claimed',
  'expired',
  'returned'
]

// ============================================================================
// RATE LIMITING & DEDUPLICATION
// ============================================================================

// Rate limit: 60 events per minute per IP
const RATE_LIMIT_MAX = 60
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

// Deduplication: same gift+event ignored for 5 minutes (idempotency)
const DEDUP_WINDOW = 5 * 60 * 1000 // 5 minutes

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const dedupStore = new Map<string, number>()

/**
 * Hash IP for privacy
 */
function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'gift-analytics-salt'
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').substring(0, 16)
}

/**
 * Check rate limit for an IP
 */
function checkRateLimit(ipHash: string): boolean {
  const now = Date.now()
  const key = `rate_${ipHash}`
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

/**
 * Check if event is duplicate (idempotency)
 * Returns true if duplicate, false if new
 */
function isDuplicate(giftId: string, eventType: string): boolean {
  const now = Date.now()
  const key = `${giftId}:${eventType}`
  const lastEvent = dedupStore.get(key)

  if (lastEvent && (now - lastEvent) < DEDUP_WINDOW) {
    return true
  }

  dedupStore.set(key, now)
  return false
}

// Clean up old entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()

    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }

    for (const [key, timestamp] of dedupStore.entries()) {
      if ((now - timestamp) > DEDUP_WINDOW) {
        dedupStore.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  const ua = userAgent.toLowerCase()
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile'
  }
  if (/windows|macintosh|linux/i.test(ua)) {
    return 'desktop'
  }
  return 'unknown'
}

/**
 * Validate wallet address format
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Sanitize string input
 */
function sanitize(input: string | undefined, maxLength: number = 100): string | undefined {
  if (!input) return undefined
  return input.toString().slice(0, maxLength).replace(/[<>'"]/g, '')
}

/**
 * Add CORS headers
 */
function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * OPTIONS - Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(response, origin)
}

/**
 * GET - Get analytics status and gift data
 *
 * Query params:
 * - gift_id: Get specific gift analytics
 * - status: Get system status (default if no gift_id)
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')

  try {
    const { searchParams } = new URL(request.url)
    const giftId = searchParams.get('gift_id')

    // If gift_id provided, return that gift's analytics
    if (giftId) {
      const analytics = await getGiftAnalytics(giftId)

      if (!analytics) {
        const response = NextResponse.json(
          { error: 'Gift not found', gift_id: giftId },
          { status: 404 }
        )
        return addCorsHeaders(response, origin)
      }

      const response = NextResponse.json({
        success: true,
        data: analytics
      })
      return addCorsHeaders(response, origin)
    }

    // Otherwise return system status
    const redisStatus = await getRedisStatus()
    const pendingSync = await getPendingSyncCount()

    const response = NextResponse.json({
      success: true,
      status: {
        redis: redisStatus,
        pending_sync: pendingSync,
        timestamp: new Date().toISOString()
      }
    })
    return addCorsHeaders(response, origin)

  } catch (error) {
    console.error('Gift analytics GET error:', error)
    const response = NextResponse.json(
      { error: 'Failed to get analytics', message: (error as Error).message },
      { status: 500 }
    )
    return addCorsHeaders(response, origin)
  }
}

/**
 * POST - Record a gift event
 *
 * Body:
 * - gift_id (required): Unique gift identifier
 * - event_type (required): One of VALID_EVENT_TYPES
 * - token_id: NFT token ID
 * - campaign_id: Creator's campaign ID
 * - creator_address: Gift creator wallet
 * - claimer_address: Claimer wallet (for claimed events)
 * - referrer_address: Referral attribution
 * - value_usd: Gift value in USD
 * - email_hash: SHA256 hash of recipient email
 * - country: ISO country code
 * - source: UTM source
 * - campaign: UTM campaign
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')

  try {
    // Get IP for rate limiting
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIP || 'unknown'
    const ipHash = hashIP(ip)

    // Rate limit check
    if (!checkRateLimit(ipHash)) {
      console.warn(`[GiftTrack] Rate limit exceeded for IP hash: ${ipHash}`)
      const response = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
      return addCorsHeaders(response, origin)
    }

    // Parse body
    const body = await request.json()
    const {
      gift_id,
      event_type,
      token_id,
      campaign_id,
      creator_address,
      claimer_address,
      referrer_address,
      value_usd,
      email_hash,
      country,
      source,
      campaign
    } = body

    // Validate required fields
    if (!gift_id || typeof gift_id !== 'string') {
      const response = NextResponse.json(
        { error: 'gift_id is required and must be a string' },
        { status: 400 }
      )
      return addCorsHeaders(response, origin)
    }

    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      const response = NextResponse.json(
        {
          error: 'Invalid event_type',
          valid_types: VALID_EVENT_TYPES
        },
        { status: 400 }
      )
      return addCorsHeaders(response, origin)
    }

    // Validate addresses if provided
    if (creator_address && !isValidAddress(creator_address)) {
      const response = NextResponse.json(
        { error: 'Invalid creator_address format' },
        { status: 400 }
      )
      return addCorsHeaders(response, origin)
    }

    if (claimer_address && !isValidAddress(claimer_address)) {
      const response = NextResponse.json(
        { error: 'Invalid claimer_address format' },
        { status: 400 }
      )
      return addCorsHeaders(response, origin)
    }

    if (referrer_address && !isValidAddress(referrer_address)) {
      const response = NextResponse.json(
        { error: 'Invalid referrer_address format' },
        { status: 400 }
      )
      return addCorsHeaders(response, origin)
    }

    // Idempotency check
    if (isDuplicate(gift_id, event_type)) {
      // Return success but don't record again (idempotent)
      console.log(`[GiftTrack] Duplicate event ignored: ${gift_id} - ${event_type}`)
      const response = NextResponse.json({
        success: true,
        data: {
          gift_id,
          event_type,
          recorded: false,
          reason: 'duplicate_within_window'
        }
      })
      return addCorsHeaders(response, origin)
    }

    // Get device type from user agent
    const userAgent = request.headers.get('user-agent') || ''
    const deviceType = detectDeviceType(userAgent)

    // Build event data with sanitization
    const eventData: Partial<GiftAnalyticsData> = {
      gift_id: sanitize(gift_id, 100),
      token_id: token_id ? parseInt(token_id) : undefined,
      campaign_id: sanitize(campaign_id, 50),
      creator_address: creator_address?.toLowerCase(),
      claimer_address: claimer_address?.toLowerCase(),
      referrer_address: referrer_address?.toLowerCase(),
      value_usd: value_usd ? parseFloat(value_usd) : undefined,
      email_hash: sanitize(email_hash, 64),
      device_type: deviceType,
      country: sanitize(country, 2),
      source: sanitize(source, 50),
      campaign: sanitize(campaign, 50)
    }

    // Record the event
    const recorded = await recordGiftEvent(gift_id, event_type as GiftEventType, eventData)

    if (!recorded) {
      // Redis might be down - return success but warn
      console.warn(`[GiftTrack] Failed to record event (Redis issue): ${gift_id} - ${event_type}`)
      const response = NextResponse.json({
        success: true,
        data: {
          gift_id,
          event_type,
          recorded: false,
          reason: 'storage_unavailable'
        }
      })
      return addCorsHeaders(response, origin)
    }

    console.log(`[GiftTrack] Event recorded: ${gift_id} - ${event_type}`)

    const response = NextResponse.json({
      success: true,
      data: {
        gift_id,
        event_type,
        recorded: true,
        timestamp: new Date().toISOString()
      }
    })
    return addCorsHeaders(response, origin)

  } catch (error) {
    console.error('Gift analytics POST error:', error)
    const response = NextResponse.json(
      { error: 'Failed to record event', message: (error as Error).message },
      { status: 500 }
    )
    return addCorsHeaders(response, origin)
  }
}
