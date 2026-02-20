/**
 * REDIS CONFIGURATION - CryptoGift DAO
 * Centralized Redis configuration for email verification and rate limiting.
 * Uses Upstash Redis with Vercel KV compatibility.
 *
 * @version 1.0.0
 */

import { Redis } from '@upstash/redis';

// Redis connection singleton
let redis: Redis | null = null;
let redisStatus: 'uninitialized' | 'connected' | 'error' | 'missing' = 'uninitialized';
let redisError: string | null = null;

/**
 * Get environment variables for Redis
 * Supports multiple naming conventions for flexibility:
 * 1. KV_DAO_REST_API_* (DAO-specific, preferred)
 * 2. KV_REST_API_* (Vercel KV standard)
 * 3. UPSTASH_REDIS_REST_* (Direct Upstash)
 */
function getRedisConfig() {
  return {
    // DAO-prefixed Vercel KV format (preferred for this project)
    KV_DAO_REST_API_URL: process.env.KV_DAO_REST_API_URL,
    KV_DAO_REST_API_TOKEN: process.env.KV_DAO_REST_API_TOKEN,
    // Standard Vercel KV format
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    // Direct Upstash format
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

/**
 * Initialize Redis connection
 */
function initializeRedis(): Redis {
  if (redis && redisStatus === 'connected') {
    return redis;
  }

  const config = getRedisConfig();

  try {
    // Try DAO-prefixed Vercel KV format first (preferred for this project)
    if (config.KV_DAO_REST_API_URL && config.KV_DAO_REST_API_TOKEN) {
      redis = new Redis({
        url: config.KV_DAO_REST_API_URL,
        token: config.KV_DAO_REST_API_TOKEN,
      });
      redisStatus = 'connected';
      console.log('✅ Redis connected: DAO Vercel KV');
      return redis;
    }

    // Try standard Vercel KV format
    if (config.KV_REST_API_URL && config.KV_REST_API_TOKEN) {
      redis = new Redis({
        url: config.KV_REST_API_URL,
        token: config.KV_REST_API_TOKEN,
      });
      redisStatus = 'connected';
      console.log('✅ Redis connected: Vercel KV');
      return redis;
    }

    // Try direct Upstash format
    if (config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: config.UPSTASH_REDIS_REST_URL,
        token: config.UPSTASH_REDIS_REST_TOKEN,
      });
      redisStatus = 'connected';
      console.log('✅ Redis connected: Direct Upstash');
      return redis;
    }

    // No valid configuration
    redisStatus = 'missing';
    redisError = 'Redis configuration missing';
    throw new Error('Redis environment variables not configured');
  } catch (error) {
    redisStatus = 'error';
    redisError = (error as Error).message;
    throw error;
  }
}

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  const config = getRedisConfig();
  return !!(
    (config.KV_DAO_REST_API_URL && config.KV_DAO_REST_API_TOKEN) ||
    (config.KV_REST_API_URL && config.KV_REST_API_TOKEN) ||
    (config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN)
  );
}

/**
 * Get Redis connection with validation
 * Returns null if not configured (for graceful degradation)
 */
export function getRedis(): Redis | null {
  if (!isRedisConfigured()) {
    console.warn('⚠️ Redis not configured - email verification unavailable');
    return null;
  }

  if (redisStatus === 'connected' && redis) {
    return redis;
  }

  try {
    return initializeRedis();
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    return null;
  }
}

/**
 * Validate Redis for critical operations
 * In development mode, allows null (graceful degradation)
 * In production, returns Redis or null with warning
 */
export function validateRedisForEmail(operation: string): Redis | null {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isRedisConfigured()) {
    if (isDevelopment) {
      console.warn(`⚠️ [DEV] Redis not configured for ${operation} - feature unavailable`);
    } else {
      console.error(`❌ [PROD] Redis required for ${operation} - configure KV_REST_API_URL and KV_REST_API_TOKEN`);
    }
    return null;
  }

  return getRedis();
}

/**
 * Get Redis status for debugging
 */
export function getRedisStatus(): {
  status: typeof redisStatus;
  error: string | null;
  configured: boolean;
} {
  return {
    status: redisStatus,
    error: redisError,
    configured: isRedisConfigured(),
  };
}

// Try to initialize on module load
try {
  if (isRedisConfigured()) {
    initializeRedis();
  }
} catch {
  // Silent fail on module load - will report on first use
}
