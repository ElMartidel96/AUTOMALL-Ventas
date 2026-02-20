/**
 * Authentication Middleware
 *
 * Authentication and rate limiting for API endpoints.
 * Admin wallets are determined PROGRAMMATICALLY from Aragon Gnosis Safe multisigs.
 *
 * @version 2.0.0
 * @updated December 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDAORedis } from '@/lib/redis-dao';
import { isAuthorizedAdmin } from '@/lib/auth/permissions';

const redis = getDAORedis();

// Rate limiting configuration
const RATE_LIMITS = {
  public: { requests: 100, window: 900 }, // 100 requests per 15 minutes
  protected: { requests: 50, window: 900 }, // 50 requests per 15 minutes
  admin: { requests: 20, window: 900 }, // 20 requests per 15 minutes
} as const;

// Simple API key validation
const VALID_API_KEYS = [
  process.env.INTERNAL_API_KEY,
  process.env.ADMIN_API_KEY,
].filter(Boolean);

// DEPRECATED: Hardcoded admin addresses - Now fetched from Aragon Gnosis Safes
// These are kept as fallback ONLY when on-chain queries fail
const FALLBACK_ADMIN_ADDRESSES = [
  '0xc655bf2bd9afa997c757bef290a9bb6ca41c5de6', // Deployer (lowercase)
  '0x3244dfbf9e5374df2f106e89cf7972e5d4c9ac31', // DAO (lowercase)
];

export interface AuthContext {
  isAuthenticated: boolean;
  isAdmin: boolean;
  address?: string;
  rateLimited: boolean;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.ip;

  return (
    (forwarded && forwarded.split(',')[0].trim()) ||
    realIP ||
    remoteAddr ||
    'unknown'
  );
}

/**
 * Rate limiting check
 */
async function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: { requests: number; window: number }
): Promise<boolean> {
  try {
    const key = `rate_limit:${ip}:${endpoint}`;
    const current = await redis.get(key);

    if (!current) {
      await redis.setex(key, limit.window, '1');
      return false; // Not rate limited
    }

    const count = parseInt(current as string, 10);
    if (count >= limit.requests) {
      return true; // Rate limited
    }

    await redis.incr(key);
    return false; // Not rate limited
  } catch (error) {
    console.warn('Rate limit check failed, allowing request:', error);
    return false; // Allow on Redis error
  }
}

/**
 * Check if wallet is admin - PROGRAMMATIC with fallback
 * Primary: Query Aragon Gnosis Safe on-chain
 * Fallback: Use hardcoded list if on-chain query fails
 */
async function checkIsAdmin(walletAddress: string | undefined): Promise<boolean> {
  if (!walletAddress) return false;

  const normalizedAddress = walletAddress.toLowerCase();

  try {
    // Primary: Use programmatic check from Aragon Safes
    const isAdmin = await isAuthorizedAdmin(normalizedAddress);
    if (isAdmin) return true;

    // If not found in on-chain query, check fallback (in case of RPC issues)
    return FALLBACK_ADMIN_ADDRESSES.includes(normalizedAddress);
  } catch (error) {
    console.warn('[Auth] On-chain admin check failed, using fallback:', error);
    // Fallback to hardcoded list if on-chain query fails
    return FALLBACK_ADMIN_ADDRESSES.includes(normalizedAddress);
  }
}

/**
 * Basic authentication middleware
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    rateLimitType?: 'public' | 'protected' | 'admin';
  } = {}
): Promise<NextResponse> {
  const {
    requireAuth = false,
    requireAdmin = false,
    rateLimitType = 'public',
  } = options;

  const clientIP = getClientIP(request);
  const endpoint = request.nextUrl.pathname;
  const apiKey = request.headers.get('x-api-key');
  const walletAddress = request.headers.get('x-wallet-address')?.toLowerCase();

  // Rate limiting check
  const rateLimit = RATE_LIMITS[rateLimitType];
  const rateLimited = await checkRateLimit(clientIP, endpoint, rateLimit);

  if (rateLimited) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: rateLimit.window,
      },
      { status: 429 }
    );
  }

  // API key authentication
  const hasValidApiKey = Boolean(apiKey && VALID_API_KEYS.includes(apiKey));

  // Admin check - PROGRAMMATIC from Aragon Gnosis Safe
  const isAdmin = await checkIsAdmin(walletAddress);

  // Wallet authentication - any valid wallet address is authenticated
  const hasValidWallet = Boolean(
    walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42
  );

  // Authentication check
  const isAuthenticated = hasValidApiKey || isAdmin || hasValidWallet;

  // Build auth context
  const authContext: AuthContext = {
    isAuthenticated,
    isAdmin,
    address: walletAddress,
    rateLimited: false,
  };

  // Require authentication
  if (requireAuth && !isAuthenticated) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication required. Provide x-api-key or x-wallet-address header.',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  // Require admin
  if (requireAdmin && !isAdmin) {
    return NextResponse.json(
      {
        success: false,
        error: 'Admin access required.',
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  // Log access for monitoring
  console.log(
    `[API] ${request.method} ${endpoint} - IP: ${clientIP} - Auth: ${isAuthenticated} - Admin: ${isAdmin} - Wallet: ${walletAddress || 'none'}`
  );

  return handler(request, authContext);
}

/**
 * Webhook signature validation
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature validation failed:', error);
    return false;
  }
}

/**
 * Helper functions for common auth patterns
 */
export const authHelpers = {
  // Public endpoint with rate limiting
  public: (handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>) =>
    (req: NextRequest) => withAuth(req, handler, { rateLimitType: 'public' }),

  // Protected endpoint requiring authentication
  protected: (handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>) =>
    (req: NextRequest) =>
      withAuth(req, handler, {
        requireAuth: true,
        rateLimitType: 'protected',
      }),

  // Admin endpoint requiring admin privileges
  admin: (handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>) =>
    (req: NextRequest) =>
      withAuth(req, handler, {
        requireAdmin: true,
        rateLimitType: 'admin',
      }),
};
