/**
 * 🪝 Thirdweb React Hooks
 *
 * Enterprise-grade Web3 hooks with auto-network switching,
 * balance tracking, and EAS verification support
 */

'use client'

import { useActiveAccount, useActiveWallet, useActiveWalletChain, useSwitchActiveWalletChain, useWalletBalance, useReadContract } from 'thirdweb/react'
import { base } from 'thirdweb/chains'
import { getContract } from 'thirdweb'
import { getClient } from './client'
import { balanceOf } from 'thirdweb/extensions/erc20'
import { useEffect } from 'react'

/**
 * CGC Token Contract Address (Base Mainnet)
 */
export const CGC_TOKEN_ADDRESS = '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175'

/**
 * Get active wallet account
 * @returns Account object with address, or undefined if not connected
 */
export function useAccount() {
  const account = useActiveAccount()

  return {
    address: account?.address,
    isConnected: !!account,
    isDisconnected: !account,
  }
}

/**
 * Get current chain and network status
 * @returns Chain object and chain ID
 */
export function useNetwork() {
  const chain = useActiveWalletChain()

  return {
    chain: chain || base,
    chainId: chain?.id,
  }
}

/**
 * Switch to a different blockchain network
 * @returns Function to switch chains
 */
export function useSwitchChain() {
  const switchChain = useSwitchActiveWalletChain()

  return {
    switchChain: async (chainId: number) => {
      const targetChain = chainId === 8453 ? base : base // Always Base for this DAO
      return switchChain(targetChain)
    },
  }
}

/**
 * Auto-switch to Base Mainnet if user is on wrong network
 */
export function useAutoSwitchToBase() {
  const { chainId } = useNetwork()
  const { switchChain } = useSwitchChain()
  const { isConnected } = useAccount()

  useEffect(() => {
    if (isConnected && chainId && chainId !== base.id) {
      // Silently attempt to switch to Base
      switchChain(base.id).catch((error) => {
        if (!error.message?.toLowerCase().includes('reject')) {
          console.warn('Auto-switch to Base failed:', error)
        }
      })
    }
  }, [isConnected, chainId, switchChain])
}

/**
 * Get ETH balance of connected wallet
 * @returns Balance object with value in Wei and formatted value
 */
export function useBalance() {
  const account = useActiveAccount()
  const client = getClient()

  // useWalletBalance doesn't support queryOptions - it handles undefined gracefully
  const { data: balance, isLoading } = useWalletBalance({
    client: client || undefined as never,
    chain: base,
    address: account?.address,
  })

  // SSR-safe: Return early if no client
  if (!client) {
    return {
      data: undefined,
      isLoading: false,
    }
  }

  return {
    data: balance
      ? {
          value: BigInt(balance.value),
          decimals: balance.decimals,
          symbol: balance.symbol,
          displayValue: balance.displayValue,
        }
      : undefined,
    isLoading,
  }
}

/**
 * Get CGC token balance of connected wallet
 * SSR-safe: Returns default values when client is not available
 * @returns CGC balance as bigint
 */
export function useCGCBalance() {
  const account = useActiveAccount()
  const client = getClient()

  // SSR-safe: Only create contract when client is available
  const contract = client
    ? getContract({
        client: client,
        chain: base,
        address: CGC_TOKEN_ADDRESS,
      })
    : null

  const { data: balance, isLoading } = useReadContract(balanceOf, {
    // @ts-expect-error - contract is null during SSR, but query is disabled
    contract: contract,
    address: account?.address || '0x0000000000000000000000000000000000000000',
    queryOptions: {
      enabled: !!client && !!account?.address && !!contract, // Only run when all deps available
    },
  })

  return {
    data: balance,
    isLoading: !client ? false : isLoading,
    formatted: balance ? (Number(balance) / 1e18).toFixed(2) : '0.00',
  }
}

/**
 * Get active wallet instance
 * @returns Wallet object
 */
export function useWallet() {
  const wallet = useActiveWallet()

  return wallet
}
