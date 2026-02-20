/**
 * Analytics Module Index
 *
 * Exports all analytics-related functions and types
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

export {
  recordGiftEvent,
  getGiftAnalytics,
  getPendingSyncCount,
  getCampaignCounters,
  batchRecordGiftEvents,
  isRedisConfigured,
  getRedisStatus,
  type GiftAnalyticsData,
  type GiftEventType
} from './giftAnalyticsRedis'
