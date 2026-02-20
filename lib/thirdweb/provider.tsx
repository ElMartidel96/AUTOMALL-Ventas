/**
 * 🌐 Hybrid Web3 Provider (Thirdweb v5 + Wagmi v2)
 *
 * Enterprise-grade Web3 provider combining:
 * - Thirdweb v5 for wallet connections and UI components
 * - Wagmi v2 for contract read/write operations
 * - React Query for efficient data caching
 */

'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThirdwebProvider } from 'thirdweb/react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'

// Wagmi configuration for Base Mainnet
const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
  },
  // SSR-safe configuration
  ssr: true,
})

// Create a client with optimized settings for blockchain data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable retries for blockchain queries that might be expensive
      retry: false,
      // Cache blockchain data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Refetch on window focus for real-time updates
      refetchOnWindowFocus: true,
      // Keep data fresh for better UX
      refetchInterval: false,
    },
  },
})

interface Web3ProviderProps {
  children: React.ReactNode
}

/**
 * Web3 Provider Component
 *
 * Wraps the application with:
 * 1. WagmiProvider - For contract read/write hooks (useReadContract, useWriteContract)
 * 2. ThirdwebProvider - For wallet connections and Web3 features
 * 3. QueryClientProvider - For efficient data fetching and caching
 *
 * @param children - React children to wrap
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThirdwebProvider>{children}</ThirdwebProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
