import { Request, Response, NextFunction } from 'express'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { appConfig } from '@/config'
import logger from '@/utils/logger'

/**
 * Rate limiter implementation using @upstash/ratelimit
 * Provides sliding window and fixed window algorithms
 * Eliminates GET/INCR desynchronization issues
 */

interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
  keyGenerator?: (req: Request) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  algorithm?: 'sliding' | 'fixed'
}

// Initialize Upstash Redis client for rate limiting
const upstashRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export class RateLimiter {
  private limiter: Ratelimit
  private options: Required<Omit<RateLimitOptions, 'algorithm'>>

  constructor(options: RateLimitOptions = {}) {
    const windowMs = options.windowMs || appConfig.RATE_LIMIT_WINDOW_MS
    const maxRequests = options.maxRequests || appConfig.RATE_LIMIT_MAX_REQUESTS
    const algorithm = options.algorithm || 'sliding'
    
    // Convert window from ms to appropriate unit for Upstash
    const windowSeconds = Math.ceil(windowMs / 1000)
    const window = windowSeconds < 60 
      ? `${windowSeconds}s`
      : windowSeconds < 3600 
        ? `${Math.ceil(windowSeconds / 60)}m`
        : `${Math.ceil(windowSeconds / 3600)}h`

    // Initialize Upstash rate limiter with selected algorithm
    this.limiter = algorithm === 'sliding'
      ? new Ratelimit({
          redis: upstashRedis,
          limiter: Ratelimit.slidingWindow(maxRequests, window),
          analytics: true, // Enable analytics for monitoring
        })
      : new Ratelimit({
          redis: upstashRedis,
          limiter: Ratelimit.fixedWindow(maxRequests, window),
          analytics: true,
        })

    this.options = {
      windowMs,
      maxRequests,
      keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown'),
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      message: options.message || 'Too many requests from this IP, please try again later.',
    }
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const identifier = this.generateKey(req)
        
        // Use Upstash rate limiter
        const { success, limit, reset, remaining, pending } = await this.limiter.limit(identifier)
        
        // Wait for analytics to be recorded
        await pending

        // Set comprehensive rate limit headers for client visibility
        res.set({
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'X-RateLimit-Window': this.options.windowMs.toString(),
          'X-RateLimit-Policy': `${limit};w=${this.options.windowMs};comment="sliding window"`,
          'RateLimit-Remaining': remaining.toString(), // IETF draft header
          'RateLimit-Limit': limit.toString(),
          'RateLimit-Reset': Math.ceil((reset - Date.now()) / 1000).toString(),
        })

        if (!success) {
          logger.warn(`Rate limit exceeded for key: ${identifier}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            limit,
            remaining,
            reset: new Date(reset),
          })

          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: this.options.message,
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
            limit,
            remaining,
            resetTime: new Date(reset),
          })
        }

        // Track successful requests if not skipped
        if (!this.options.skipSuccessfulRequests) {
          logger.debug(`Rate limit check passed for ${identifier}`, {
            remaining,
            limit,
          })
        }

        next()
      } catch (error) {
        logger.error('Rate limiting error:', error)
        // On error, allow request to proceed to avoid blocking service
        next()
      }
    }
  }

  private generateKey(req: Request): string {
    const baseKey = this.options.keyGenerator(req)
    // Normalize key for consistency across algorithms
    // Remove potential inconsistencies from forwarded headers
    const normalizedKey = baseKey.toLowerCase().replace(/[^a-z0-9:._-]/g, '_')
    return `ratelimit:${normalizedKey}`
  }

  /**
   * Check current rate limit status without consuming a token
   * Useful for displaying rate limit info to users
   */
  async checkStatus(req: Request): Promise<{
    limit: number
    remaining: number
    reset: Date
  }> {
    const identifier = this.generateKey(req)
    const response = await this.limiter.getRemaining(identifier)
    
    return {
      limit: response.limit,
      remaining: response.remaining,
      reset: new Date(response.reset),
    }
  }

  /**
   * Reset rate limit for a specific identifier
   * Useful for testing or admin operations
   */
  async reset(req: Request): Promise<void> {
    const identifier = this.generateKey(req)
    await this.limiter.reset(identifier)
    logger.info(`Rate limit reset for ${identifier}`)
  }
}

// Factory function for creating rate limiters
export const createRateLimiter = (options?: RateLimitOptions) => {
  const limiter = new RateLimiter(options)
  return limiter.middleware()
}

// Pre-configured rate limiters
export const defaultRateLimit = createRateLimiter({
  algorithm: 'sliding',
})

export const strictRateLimit = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests. Please wait before trying again.',
  algorithm: 'sliding',
})

export const apiRateLimit = createRateLimiter({
  windowMs: appConfig.RATE_LIMIT_WINDOW_MS,
  maxRequests: appConfig.RATE_LIMIT_MAX_REQUESTS,
  keyGenerator: (req: Request) => {
    const forwarded = req.get('X-Forwarded-For')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip
    return `api:${ip || 'unknown'}`
  },
  algorithm: 'sliding',
})

export const websocketRateLimit = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 200, // Higher limit for WebSocket connections
  keyGenerator: (req: Request) => {
    const forwarded = req.get('X-Forwarded-For')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip
    return `ws:${ip || 'unknown'}`
  },
  algorithm: 'sliding',
})

// Auth endpoints get stricter limits
export const authRateLimit = createRateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5, // Only 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: (req: Request) => {
    const forwarded = req.get('X-Forwarded-For')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip
    return `auth:${ip || 'unknown'}`
  },
  algorithm: 'fixed', // Use fixed window for auth to be more restrictive
})

// Export the RateLimiter class for advanced usage
export { RateLimiter }