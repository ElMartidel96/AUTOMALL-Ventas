/**
 * Safe JSON serialization/deserialization utilities for handling BigInt and other non-JSON types
 * 
 * This utility ensures consistent handling of BigInt across:
 * - Redis cache operations
 * - WebSocket broadcasts
 * - SSE streaming responses
 * - API responses
 */

/**
 * Custom replacer for JSON.stringify that handles BigInt
 * Converts BigInt to string with a special marker for round-trip safety
 */
export function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    // Use a special format that can be safely parsed back
    return `__bigint__${value.toString()}`;
  }
  return value;
}

/**
 * Custom reviver for JSON.parse that restores BigInt values
 * Detects and converts specially marked strings back to BigInt
 */
export function bigIntReviver(_key: string, value: any): any {
  if (typeof value === 'string' && value.startsWith('__bigint__')) {
    return BigInt(value.slice(10)); // Remove the __bigint__ prefix
  }
  return value;
}

/**
 * Safe JSON stringify that handles BigInt and other non-JSON types
 * @param data - The data to stringify
 * @param space - Optional formatting space
 * @returns JSON string with BigInt values safely encoded
 */
export function safeStringify(data: any, space?: string | number): string {
  try {
    return JSON.stringify(data, bigIntReplacer, space);
  } catch (error) {
    console.error('[safeStringify] Serialization error:', error);
    // Fallback: attempt with basic conversion
    return JSON.stringify(
      data,
      (_key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        if (typeof value === 'undefined') {
          return null;
        }
        if (typeof value === 'symbol') {
          return value.toString();
        }
        if (typeof value === 'function') {
          return '[Function]';
        }
        return value;
      },
      space
    );
  }
}

/**
 * Safe JSON parse that restores BigInt values
 * @param text - The JSON string to parse
 * @returns Parsed object with BigInt values restored
 */
export function safeParse<T = any>(text: string): T {
  try {
    return JSON.parse(text, bigIntReviver);
  } catch (error) {
    console.error('[safeParse] Parsing error:', error);
    // Try basic parse without reviver as fallback
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON: ${error}`);
    }
  }
}

/**
 * Round-trip verification for SafeJSON operations
 * Ensures data integrity by verifying stringify->parse cycle
 */
export function verifyRoundTrip<T>(data: T): { success: boolean; error?: string } {
  try {
    const serialized = safeStringify(data);
    const parsed = safeParse<T>(serialized);
    
    // Deep comparison for primitive verification
    const originalStr = safeStringify(data);
    const roundTripStr = safeStringify(parsed);
    
    if (originalStr !== roundTripStr) {
      return { 
        success: false, 
        error: `Round-trip mismatch: ${originalStr.length} vs ${roundTripStr.length} chars` 
      };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: `Round-trip failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Safe serialization for SSE streams with validation
 * Includes round-trip verification for production reliability
 */
export function sseSerialize(data: any, eventType: string = 'data'): string {
  const verification = verifyRoundTrip(data);
  if (!verification.success) {
    console.error(`[sseSerialize] Round-trip verification failed for ${eventType}:`, verification.error);
    // Continue with basic serialization but log the issue
  }
  
  const jsonData = safeStringify(data);
  return `event: ${eventType}\ndata: ${jsonData}\n\n`;
}

/**
 * Type guard to check if a value might contain BigInt
 * Useful for determining when to use safe serialization
 */
export function mightContainBigInt(value: any): boolean {
  if (typeof value === 'bigint') return true;
  if (typeof value !== 'object' || value === null) return false;
  
  // Recursively check objects and arrays
  if (Array.isArray(value)) {
    return value.some(mightContainBigInt);
  }
  
  return Object.values(value).some(mightContainBigInt);
}

/**
 * Utility to convert BigInt to string for display purposes
 * @param value - BigInt or string value
 * @param decimals - Number of decimals for formatting (default 18 for ETH)
 * @returns Formatted string representation
 */
export function formatBigInt(value: bigint | string, decimals = 18): string {
  const bn = typeof value === 'string' ? BigInt(value) : value;
  const divisor = BigInt(10 ** decimals);
  const quotient = bn / divisor;
  const remainder = bn % divisor;
  
  // Format with proper decimal places
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, ''); // Remove trailing zeros
  
  return trimmed ? `${quotient}.${trimmed}` : quotient.toString();
}

// Export a ready-to-use instance for Redis/API operations
export const SafeJSON = {
  stringify: safeStringify,
  parse: safeParse,
  formatBigInt,
  mightContainBigInt,
  verifyRoundTrip,
  sseSerialize,
} as const;