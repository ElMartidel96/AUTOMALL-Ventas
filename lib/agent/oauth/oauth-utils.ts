/**
 * OAuth 2.1 Utilities — Token generation, PKCE verification
 *
 * Uses opaque tokens (random strings + SHA-256 hash) instead of JWTs
 * for simplicity. Same pattern as existing API key system.
 */

import { createHash, randomBytes } from 'crypto'

// Token prefixes for identification
export const TOKEN_PREFIX = {
  ACCESS: 'oat_',   // OAuth Access Token
  REFRESH: 'ort_',  // OAuth Refresh Token
  CODE: 'oac_',     // OAuth Authorization Code
} as const

// Token lifetimes
export const TOKEN_LIFETIME = {
  ACCESS: 60 * 60,              // 1 hour (seconds)
  REFRESH: 30 * 24 * 60 * 60,  // 30 days (seconds)
  CODE: 10 * 60,                // 10 minutes (seconds)
} as const

/**
 * Generate a cryptographically random token with a prefix.
 */
export function generateToken(prefix: string): { raw: string; hash: string } {
  const raw = prefix + randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

/**
 * Hash a token for storage/lookup.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Verify PKCE code challenge (S256 only).
 * code_challenge = BASE64URL(SHA256(code_verifier))
 */
export function verifyPKCE(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return computed === codeChallenge
}

/**
 * Generate a random client_id for Dynamic Client Registration.
 */
export function generateClientId(): string {
  return randomBytes(16).toString('hex')
}

/**
 * Compute expiration date from now + seconds.
 */
export function expiresIn(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString()
}

/**
 * Check if a token prefix indicates an OAuth token (vs API key).
 */
export function isOAuthToken(token: string): boolean {
  return token.startsWith(TOKEN_PREFIX.ACCESS) || token.startsWith(TOKEN_PREFIX.REFRESH)
}

/**
 * Map MCP scopes to internal permission scopes.
 * e.g. "mcp:read mcp:write" → ['read', 'write']
 */
export function mcpScopesToInternal(mcpScope: string): string[] {
  const scopes: string[] = []
  if (mcpScope.includes('mcp:read')) scopes.push('read')
  if (mcpScope.includes('mcp:write')) scopes.push('write')
  if (mcpScope.includes('mcp:admin')) scopes.push('admin')
  if (scopes.length === 0) scopes.push('read')
  return scopes
}
