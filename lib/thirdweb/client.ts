/**
 * 🔧 Thirdweb Client Configuration
 *
 * Enterprise-grade Thirdweb v5 client for CryptoGift Wallets DAO
 * Supports 150+ wallet providers with professional UX
 *
 * SSR-safe implementation with singleton pattern
 * @see https://portal.thirdweb.com/connect/quickstart
 */

import { createThirdwebClient } from 'thirdweb'

let _client: ReturnType<typeof createThirdwebClient> | null = null

/**
 * Get or create Thirdweb client instance (Singleton pattern)
 * @returns Thirdweb client instance or null if not available
 */
export function getClient() {
  if (_client) return _client

  const clientId = process.env.NEXT_PUBLIC_TW_CLIENT_ID

  if (!clientId) {
    console.error('❌ CRITICAL: NEXT_PUBLIC_TW_CLIENT_ID not found in environment')
    if (typeof window === 'undefined') {
      // During build time, return null gracefully
      return null
    }
    console.error('ThirdWeb client ID not found. Please set NEXT_PUBLIC_TW_CLIENT_ID')
    return null
  }

  console.log('✅ THIRDWEB CLIENT: Initializing with clientId:', clientId.slice(0, 8) + '...')

  _client = createThirdwebClient({
    clientId: clientId,
  })

  console.log('✅ THIRDWEB CLIENT: Successfully created')

  return _client
}

/**
 * SAFE CLIENT EXPORT: Create client dynamically to handle SSR
 */
export const client = typeof window !== 'undefined' ? getClient() : null

/**
 * Export a getter function for components that need to ensure client is available
 */
export const getClientSafe = () => {
  if (typeof window === 'undefined') return null
  return getClient()
}

/**
 * Alias for backwards compatibility
 */
export const thirdwebClient = client
