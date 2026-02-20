/**
 * 🔗 API Integration Configuration
 *
 * Centralized configuration for cross-service communication between
 * DAO (mbxarts.com) and Wallets (gifts.mbxarts.com) services.
 *
 * SECURITY:
 * - API keys stored in environment variables only
 * - Internal calls use signed requests
 * - All endpoints require authentication
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

// =============================================================================
// SERVICE URLS
// =============================================================================

export const SERVICES = {
  DAO: {
    name: 'CryptoGift DAO',
    url: process.env.NEXT_PUBLIC_DAO_API_URL || 'https://mbxarts.com',
    internalUrl: process.env.DAO_INTERNAL_URL || 'https://mbxarts.com',
  },
  WALLETS: {
    name: 'CryptoGift Wallets',
    url: process.env.NEXT_PUBLIC_WALLETS_API_URL || 'https://gifts.mbxarts.com',
    internalUrl: process.env.WALLETS_INTERNAL_URL || 'https://gifts.mbxarts.com',
  },
} as const;

// =============================================================================
// API VERSIONING
// =============================================================================

export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// =============================================================================
// RATE LIMITING
// =============================================================================

export const RATE_LIMITS = {
  // Per wallet address
  perWallet: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Per API key (for external integrations)
  perApiKey: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
  },
  // Global per endpoint
  global: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10000,
  },
} as const;

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

export const CORS_CONFIG = {
  allowedOrigins: [
    'https://mbxarts.com',
    'https://www.mbxarts.com',
    'https://gifts.mbxarts.com',
    'https://app.mbxarts.com',
    // Development
    ...(process.env.NODE_ENV === 'development' ? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ] : []),
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'X-Wallet-Address',
    'X-Signature',
    'X-Timestamp',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
} as const;

// =============================================================================
// AUTHENTICATION
// =============================================================================

export const AUTH_CONFIG = {
  // JWT configuration
  jwt: {
    expiresIn: '1h',
    refreshExpiresIn: '7d',
    algorithm: 'HS256' as const,
  },
  // Wallet signature message template
  signatureMessage: (nonce: string, timestamp: number) =>
    `Sign this message to authenticate with MBXarts.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`,
  // Signature validity window (5 minutes)
  signatureValidityMs: 5 * 60 * 1000,
} as const;

// =============================================================================
// TIMEOUT CONFIGURATION
// =============================================================================

export const TIMEOUTS = {
  // Default request timeout
  default: 10000, // 10 seconds
  // Longer timeout for complex operations (proxy to Wallets)
  long: 60000, // 60 seconds - increased for NFT wallet queries
  // Timeout for internal service calls
  internal: 5000, // 5 seconds
} as const;

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if origin is allowed for CORS
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return CORS_CONFIG.allowedOrigins.includes(origin);
}

/**
 * Get service URL based on environment
 */
export function getServiceUrl(service: keyof typeof SERVICES, internal = false): string {
  const config = SERVICES[service];
  return internal ? config.internalUrl : config.url;
}

/**
 * Build API endpoint URL
 */
export function buildApiUrl(
  service: keyof typeof SERVICES,
  path: string,
  internal = false
): string {
  const baseUrl = getServiceUrl(service, internal);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${API_BASE_PATH}${cleanPath}`;
}

/**
 * Generate unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
