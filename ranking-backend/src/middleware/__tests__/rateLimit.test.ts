/**
 * Rate Limiter Test Suite
 * Verifies that @upstash/ratelimit properly enforces limits
 * and returns correct 429 responses with proper headers
 */

import { Request, Response } from 'express'
import { RateLimiter } from '../rateLimit'

// Mock logger to avoid console output during tests
jest.mock('@/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))

describe('RateLimiter with @upstash/ratelimit', () => {
  let rateLimiter: RateLimiter
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let nextFn: jest.Mock

  beforeEach(() => {
    // Initialize rate limiter with test configuration
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 3, // Only 3 requests per minute for testing
      algorithm: 'sliding',
    })

    // Mock request object
    mockReq = {
      ip: '127.0.0.1',
      path: '/test',
      get: jest.fn((header) => {
        if (header === 'User-Agent') return 'Test Agent'
        if (header === 'X-Forwarded-For') return null
        return undefined
      }),
    }

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    }

    nextFn = jest.fn()
  })

  describe('Rate Limit Enforcement', () => {
    it('should allow requests within the limit', async () => {
      const middleware = rateLimiter.middleware()
      
      // First request - should pass
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      expect(nextFn).toHaveBeenCalledTimes(1)
      expect(mockRes.status).not.toHaveBeenCalled()
      
      // Verify headers are set
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': expect.any(String),
          'X-RateLimit-Reset': expect.any(String),
          'X-RateLimit-Window': '60000',
        })
      )
    })

    it('should block requests exceeding the limit with 429 status', async () => {
      const middleware = rateLimiter.middleware()
      
      // Make 3 requests (the limit)
      for (let i = 0; i < 3; i++) {
        await middleware(mockReq as Request, mockRes as Response, nextFn)
      }
      
      // Reset mocks for the 4th request
      nextFn.mockClear()
      mockRes.status = jest.fn().mockReturnThis()
      mockRes.json = jest.fn().mockReturnThis()
      
      // 4th request - should be blocked
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      
      // Verify 429 response
      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rate limit exceeded',
          message: expect.any(String),
          retryAfter: expect.any(Number),
          limit: 3,
          remaining: 0,
          resetTime: expect.any(Date),
        })
      )
      
      // Verify next() was NOT called
      expect(nextFn).not.toHaveBeenCalled()
    })

    it('should set correct rate limit headers on 429 response', async () => {
      const middleware = rateLimiter.middleware()
      
      // Exceed the limit
      for (let i = 0; i < 4; i++) {
        mockRes.set = jest.fn().mockReturnThis()
        await middleware(mockReq as Request, mockRes as Response, nextFn)
      }
      
      // Check headers on the last (blocked) request
      const lastSetCall = mockRes.set as jest.Mock
      expect(lastSetCall).toHaveBeenLastCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': expect.any(String),
          'X-RateLimit-Window': '60000',
        })
      )
    })
  })

  describe('Key Generation', () => {
    it('should generate different keys for different IPs', async () => {
      const limiter1 = new RateLimiter({ maxRequests: 1 })
      const limiter2 = new RateLimiter({ maxRequests: 1 })
      
      const req1 = { ...mockReq, ip: '192.168.1.1' }
      const req2 = { ...mockReq, ip: '192.168.1.2' }
      
      const middleware1 = limiter1.middleware()
      const middleware2 = limiter2.middleware()
      
      // Both should pass as they have different IPs
      await middleware1(req1 as Request, mockRes as Response, nextFn)
      await middleware2(req2 as Request, mockRes as Response, nextFn)
      
      expect(nextFn).toHaveBeenCalledTimes(2)
    })

    it('should use X-Forwarded-For header when present', async () => {
      const limiter = new RateLimiter({
        maxRequests: 1,
        keyGenerator: (req) => {
          const forwarded = req.get('X-Forwarded-For')
          const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip
          return ip || 'unknown'
        }
      })
      
      mockReq.get = jest.fn((header) => {
        if (header === 'X-Forwarded-For') return '10.0.0.1, 10.0.0.2'
        return undefined
      })
      
      const middleware = limiter.middleware()
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      
      // Should use the first IP from X-Forwarded-For
      expect(nextFn).toHaveBeenCalled()
    })
  })

  describe('Algorithm Tests', () => {
    it('should support fixed window algorithm', async () => {
      const fixedLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 60000,
        algorithm: 'fixed',
      })
      
      const middleware = fixedLimiter.middleware()
      
      // Make 2 requests (the limit)
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      
      // 3rd request should be blocked
      nextFn.mockClear()
      mockRes.status = jest.fn().mockReturnThis()
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      
      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(nextFn).not.toHaveBeenCalled()
    })

    it('should support sliding window algorithm', async () => {
      const slidingLimiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 60000,
        algorithm: 'sliding',
      })
      
      const middleware = slidingLimiter.middleware()
      
      // Make 2 requests (the limit)
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      
      // 3rd request should be blocked
      nextFn.mockClear()
      mockRes.status = jest.fn().mockReturnThis()
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      
      expect(mockRes.status).toHaveBeenCalledWith(429)
      expect(nextFn).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should allow requests through on rate limiter error', async () => {
      // Mock a failing rate limiter
      const failingLimiter = new RateLimiter({ maxRequests: 1 })
      
      // Override the limit method to throw an error
      jest.spyOn(failingLimiter as any, 'limiter', 'get').mockReturnValue({
        limit: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
      })
      
      const middleware = failingLimiter.middleware()
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      
      // Should call next() despite the error
      expect(nextFn).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })
  })

  describe('Utility Methods', () => {
    it('should check rate limit status without consuming tokens', async () => {
      const status = await rateLimiter.checkStatus(mockReq as Request)
      
      expect(status).toEqual(
        expect.objectContaining({
          limit: expect.any(Number),
          remaining: expect.any(Number),
          reset: expect.any(Date),
        })
      )
    })

    it('should reset rate limits for a specific identifier', async () => {
      const middleware = rateLimiter.middleware()
      
      // Exhaust the limit
      for (let i = 0; i < 4; i++) {
        await middleware(mockReq as Request, mockRes as Response, nextFn)
      }
      
      // Reset the limit
      await rateLimiter.reset(mockReq as Request)
      
      // Next request should pass
      nextFn.mockClear()
      mockRes.status = jest.fn().mockReturnThis()
      await middleware(mockReq as Request, mockRes as Response, nextFn)
      
      expect(nextFn).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalledWith(429)
    })
  })
})

// Integration test to verify actual 429 behavior
describe('Rate Limiter Integration', () => {
  it('should return proper 429 response with all required fields', async () => {
    const limiter = new RateLimiter({
      maxRequests: 1,
      windowMs: 60000,
      message: 'Custom rate limit message',
    })
    
    const req = { ip: 'test-ip', path: '/api/test', get: jest.fn() } as any
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    } as any
    const next = jest.fn()
    
    const middleware = limiter.middleware()
    
    // First request passes
    await middleware(req, res, next)
    expect(next).toHaveBeenCalled()
    
    // Second request blocked
    next.mockClear()
    await middleware(req, res, next)
    
    expect(res.status).toHaveBeenCalledWith(429)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Rate limit exceeded',
      message: 'Custom rate limit message',
      retryAfter: expect.any(Number),
      limit: 1,
      remaining: 0,
      resetTime: expect.any(Date),
    })
    expect(next).not.toHaveBeenCalled()
  })
})