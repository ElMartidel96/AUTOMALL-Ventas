/**
 * 🎁 USER WALLETS HOOKS
 *
 * React hooks for fetching NFT wallets from cryptogift-wallets service.
 * Enables cross-platform integration between DAO and Wallets platforms.
 *
 * Made by mbxarts.com The Moon in a Box property
 *
 * Co-Author: Godez22
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { UserNFTWallet, UserNFTWalletsResponse } from '@/lib/integrations/wallets-service';

// =====================================================
// 📊 TYPES
// =====================================================

export interface UseUserWalletsResult {
  wallets: UserNFTWallet[];
  walletsFound: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  hasWallets: boolean;
}

// =====================================================
// 🔧 API FUNCTIONS
// =====================================================

async function fetchUserWallets(address: string): Promise<UserNFTWalletsResponse> {
  // CRITICAL: The Wallets API expects 'userAddress' parameter, not 'address'
  const res = await fetch(`/api/v1/wallets/user/nft-wallets?userAddress=${address}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch wallets' }));
    throw new Error(error.error || error.message || 'Failed to fetch wallets');
  }

  const data = await res.json();

  // Handle both direct response and wrapped response formats
  if (data.success !== undefined) {
    return data as UserNFTWalletsResponse;
  }

  // Wrap in expected format if needed
  return {
    success: true,
    userAddress: address,
    walletsFound: Array.isArray(data) ? data.length : 0,
    wallets: Array.isArray(data) ? data : [],
  };
}

// =====================================================
// 🎣 HOOKS
// =====================================================

/**
 * Hook to fetch all NFT wallets owned by a user address
 *
 * @param address - The wallet address to fetch NFT wallets for
 * @returns Object containing wallets array, loading state, and helpers
 *
 * @example
 * ```tsx
 * const { wallets, hasWallets, isLoading } = useUserWallets(address);
 *
 * if (hasWallets) {
 *   wallets.map(wallet => <WalletCard key={wallet.id} wallet={wallet} />)
 * }
 * ```
 */
export function useUserWallets(address?: string): UseUserWalletsResult {
  const query = useQuery({
    queryKey: ['userWallets', address],
    queryFn: () => (address ? fetchUserWallets(address) : Promise.reject('No address')),
    enabled: !!address,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  const wallets = query.data?.wallets ?? [];

  return {
    wallets,
    walletsFound: query.data?.walletsFound ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    hasWallets: wallets.length > 0,
  };
}

/**
 * Hook to fetch a single wallet's info (first wallet or specific index)
 * Useful for showing a preview/mini card
 *
 * @param address - The wallet address to fetch NFT wallets for
 * @param index - Which wallet to return (default: 0, the first one)
 * @returns Object containing single wallet info or null
 */
export function usePrimaryWallet(address?: string, index: number = 0) {
  const { wallets, isLoading, isError, error, hasWallets } = useUserWallets(address);

  const wallet = wallets[index] ?? null;

  return {
    wallet,
    isLoading,
    isError,
    error,
    hasWallet: !!wallet,
    totalWallets: wallets.length,
  };
}

/**
 * Hook that returns summary info for wallet display
 * Aggregates balances and provides formatted data
 *
 * @param address - The wallet address to fetch NFT wallets for
 */
export function useWalletsSummary(address?: string) {
  const { wallets, walletsFound, isLoading, isError, hasWallets } = useUserWallets(address);

  // Calculate total balance across all wallets
  const totalBalance = wallets.reduce((acc, wallet) => {
    const walletTotal = parseFloat(wallet.balance?.total || '0');
    return acc + (isNaN(walletTotal) ? 0 : walletTotal);
  }, 0);

  // Get active wallets count
  const activeWallets = wallets.filter(w => w.isActive).length;

  // Get primary wallet image for preview
  const primaryImage = wallets[0]?.image || null;

  return {
    totalWallets: walletsFound,
    activeWallets,
    totalBalance,
    totalBalanceFormatted: `$${totalBalance.toFixed(2)}`,
    primaryImage,
    isLoading,
    isError,
    hasWallets,
  };
}
