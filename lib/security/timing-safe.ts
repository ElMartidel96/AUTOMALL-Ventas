/**
 * Timing-safe comparison utilities
 * Prevents timing attacks on sensitive string comparisons
 */

import { createHash, timingSafeEqual } from 'crypto';

/**
 * Performs timing-safe string comparison using Node.js crypto.timingSafeEqual
 * This prevents timing attacks by ensuring comparison takes constant time
 * regardless of string content or differences
 * 
 * @param a First string to compare
 * @param b Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeStringCompare(a: string, b: string): boolean {
  // Handle null/undefined cases safely
  if (!a || !b) {
    return a === b;
  }
  
  // Convert strings to buffers for comparison
  // Use fixed-length hash to normalize input lengths
  const hashA = createHash('sha256').update(a, 'utf8').digest();
  const hashB = createHash('sha256').update(b, 'utf8').digest();
  
  // Perform timing-safe comparison on normalized hashes
  try {
    return timingSafeEqual(hashA, hashB);
  } catch (error) {
    // If anything fails, return false (fail closed)
    return false;
  }
}

/**
 * Validates Bearer token in timing-safe manner
 * Handles the common "Bearer TOKEN" format
 * 
 * @param authHeader Authorization header value (e.g., "Bearer token123")
 * @param expectedToken Expected token value
 * @returns true if token is valid, false otherwise
 */
export function validateBearerToken(authHeader: string | null, expectedToken: string): boolean {
  if (!authHeader || !expectedToken) {
    return false;
  }
  
  // Parse Bearer token format
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    return false;
  }
  
  const providedToken = bearerMatch[1];
  return timingSafeStringCompare(providedToken, expectedToken);
}

/**
 * Creates a timing-safe validator function for a specific token
 * Useful for creating reusable validators
 * 
 * @param expectedToken The token to validate against
 * @returns Function that validates auth headers
 */
export function createBearerTokenValidator(expectedToken: string): (authHeader: string | null) => boolean {
  return (authHeader: string | null) => validateBearerToken(authHeader, expectedToken);
}

/**
 * Timing-safe comparison for API keys or other secrets
 * Direct comparison without Bearer format
 * 
 * @param provided Provided secret/key
 * @param expected Expected secret/key
 * @returns true if secrets match, false otherwise
 */
export function validateSecret(provided: string | null, expected: string): boolean {
  if (!provided || !expected) {
    return false;
  }
  
  return timingSafeStringCompare(provided, expected);
}