/**
 * 🎁 GIFT ANALYTICS HOOKS
 *
 * React hooks for tracking gift lifecycle events.
 * Provides easy-to-use interfaces for gift analytics.
 *
 * Usage:
 * ```tsx
 * const { trackEvent, trackCreated, trackViewed, trackClaimed } = useGiftAnalytics()
 *
 * // Track gift created
 * await trackCreated({
 *   gift_id: 'abc123',
 *   creator_address: '0x...',
 *   value_usd: 10.5
 * })
 *
 * // Track gift viewed
 * await trackViewed({ gift_id: 'abc123' })
 *
 * // Track gift claimed
 * await trackClaimed({
 *   gift_id: 'abc123',
 *   claimer_address: '0x...'
 * })
 * ```
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 *
 * @version 1.0.0
 */

'use client'

import { useCallback, useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type GiftEventType =
  | 'created'
  | 'viewed'
  | 'preclaim'
  | 'education_completed'
  | 'claimed'
  | 'expired'
  | 'returned'

export interface GiftEventData {
  gift_id: string
  token_id?: number
  campaign_id?: string
  creator_address?: string
  claimer_address?: string
  referrer_address?: string
  value_usd?: number
  email_hash?: string
  country?: string
  source?: string
  campaign?: string
}

export interface TrackEventResult {
  success: boolean
  gift_id: string
  event_type: GiftEventType
  recorded: boolean
  reason?: string
  timestamp?: string
  error?: string
}

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

export interface AnalyticsStatus {
  redis: {
    configured: boolean
    connected: boolean
    pendingSync: number
  }
  pending_sync: number
  timestamp: string
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// API base URL (uses relative URL to work with any domain)
const API_BASE = '/api/analytics/gift/track'

// ============================================================================
// HOOK: useGiftAnalytics
// ============================================================================

export function useGiftAnalytics() {
  const [isTracking, setIsTracking] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  /**
   * Track a gift event
   */
  const trackEvent = useCallback(async (
    eventType: GiftEventType,
    data: GiftEventData
  ): Promise<TrackEventResult> => {
    setIsTracking(true)
    setLastError(null)

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          ...data
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to track event')
      }

      return {
        success: true,
        gift_id: data.gift_id,
        event_type: eventType,
        recorded: result.data?.recorded ?? true,
        reason: result.data?.reason,
        timestamp: result.data?.timestamp
      }

    } catch (error) {
      const errorMessage = (error as Error).message
      setLastError(errorMessage)
      console.error('[GiftAnalytics] Track error:', errorMessage)

      return {
        success: false,
        gift_id: data.gift_id,
        event_type: eventType,
        recorded: false,
        error: errorMessage
      }

    } finally {
      setIsTracking(false)
    }
  }, [])

  /**
   * Track gift created event
   */
  const trackCreated = useCallback(async (data: GiftEventData) => {
    return trackEvent('created', data)
  }, [trackEvent])

  /**
   * Track gift viewed event
   */
  const trackViewed = useCallback(async (data: Pick<GiftEventData, 'gift_id' | 'referrer_address' | 'source' | 'campaign'>) => {
    return trackEvent('viewed', data as GiftEventData)
  }, [trackEvent])

  /**
   * Track preclaim started event
   */
  const trackPreclaim = useCallback(async (data: Pick<GiftEventData, 'gift_id' | 'email_hash'>) => {
    return trackEvent('preclaim', data as GiftEventData)
  }, [trackEvent])

  /**
   * Track education completed event
   */
  const trackEducationCompleted = useCallback(async (data: Pick<GiftEventData, 'gift_id'>) => {
    return trackEvent('education_completed', data as GiftEventData)
  }, [trackEvent])

  /**
   * Track gift claimed event
   */
  const trackClaimed = useCallback(async (data: Pick<GiftEventData, 'gift_id' | 'claimer_address' | 'referrer_address'>) => {
    return trackEvent('claimed', data as GiftEventData)
  }, [trackEvent])

  /**
   * Track gift expired event
   */
  const trackExpired = useCallback(async (data: Pick<GiftEventData, 'gift_id'>) => {
    return trackEvent('expired', data as GiftEventData)
  }, [trackEvent])

  /**
   * Track gift returned event
   */
  const trackReturned = useCallback(async (data: Pick<GiftEventData, 'gift_id'>) => {
    return trackEvent('returned', data as GiftEventData)
  }, [trackEvent])

  /**
   * Get analytics for a specific gift
   */
  const getGiftAnalytics = useCallback(async (giftId: string): Promise<GiftAnalyticsData | null> => {
    try {
      const response = await fetch(`${API_BASE}?gift_id=${encodeURIComponent(giftId)}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        return null
      }

      return result.data

    } catch (error) {
      console.error('[GiftAnalytics] Get error:', error)
      return null
    }
  }, [])

  /**
   * Get analytics system status
   */
  const getStatus = useCallback(async (): Promise<AnalyticsStatus | null> => {
    try {
      const response = await fetch(API_BASE)
      const result = await response.json()

      if (!response.ok || !result.success) {
        return null
      }

      return result.status

    } catch (error) {
      console.error('[GiftAnalytics] Status error:', error)
      return null
    }
  }, [])

  return {
    // State
    isTracking,
    lastError,

    // Generic tracker
    trackEvent,

    // Convenience methods for each event type
    trackCreated,
    trackViewed,
    trackPreclaim,
    trackEducationCompleted,
    trackClaimed,
    trackExpired,
    trackReturned,

    // Query methods
    getGiftAnalytics,
    getStatus
  }
}

// ============================================================================
// STANDALONE FUNCTIONS (for use outside React components)
// ============================================================================

/**
 * Track a gift event (standalone, non-hook version)
 * Use this for server components or non-React contexts
 */
export async function trackGiftEvent(
  eventType: GiftEventType,
  data: GiftEventData,
  baseUrl?: string
): Promise<TrackEventResult> {
  const apiUrl = baseUrl ? `${baseUrl}${API_BASE}` : API_BASE

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        ...data
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to track event')
    }

    return {
      success: true,
      gift_id: data.gift_id,
      event_type: eventType,
      recorded: result.data?.recorded ?? true,
      reason: result.data?.reason,
      timestamp: result.data?.timestamp
    }

  } catch (error) {
    return {
      success: false,
      gift_id: data.gift_id,
      event_type: eventType,
      recorded: false,
      error: (error as Error).message
    }
  }
}

export default useGiftAnalytics
