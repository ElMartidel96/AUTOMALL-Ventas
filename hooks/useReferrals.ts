/**
 * 🤝 REFERRAL HOOKS
 *
 * React hooks for the CryptoGift DAO referral system.
 * Provides easy-to-use interfaces for referral management.
 *
 * @version 1.0.0
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// =====================================================
// 📊 TYPES
// =====================================================

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: number;
  totalEarned: number;
  network: {
    level1: number;
    level2: number;
    level3: number;
    total: number;
  };
  commissionRates: {
    level1: number;
    level2: number;
    level3: number;
  };
  milestones: {
    reached: Array<{ count: number; bonus: number; reached: boolean }>;
    next: { count: number; bonus: number; reached: boolean } | null;
    progress: number;
  };
  engagement: {
    clickCount: number;
    conversionRate: number;
  };
  rank: number;
}

export interface ReferralNetworkMember {
  id: string;
  address: string;
  addressShort: string;
  level: number;
  status: 'pending' | 'active' | 'inactive' | 'banned';
  tasksCompleted: number;
  cgcEarned: number;
  referrerEarnings: number;
  joinedAt: string;
  lastActivity: string | null;
  username?: string;
  displayName?: string;
  avatar?: string;
}

export interface ReferralReward {
  id: string;
  type: string;
  typeLabel: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  referredAddress: string;
  referredAddressShort: string;
  taskId?: string;
  milestoneReached?: number;
  txHash?: string;
  paidAt?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  addressShort: string;
  code: string;
  totalReferrals: number;
  totalEarnings: number;
  network: {
    level1: number;
    level2: number;
    level3: number;
    total: number;
  };
  tier: {
    name: string;
    color: string;
    icon: string;
    minReferrals: number;
  };
}

export interface ClickAnalytics {
  totalClicks: number;
  uniqueVisitors: number;
  conversions: number;
  conversionRate: number;
  bySource: Record<string, number>;
  byDevice: Record<string, number>;
  byCountry: Record<string, number>;
  dailyTrend: Array<{ date: string; clicks: number; conversions: number }>;
}

// =====================================================
// 🔧 API FUNCTIONS
// =====================================================

async function fetchReferralCode(wallet: string) {
  const res = await fetch(`/api/referrals/code?wallet=${wallet}`);
  if (!res.ok) throw new Error('Failed to fetch referral code');
  return res.json();
}

async function fetchReferralStats(wallet: string, includeAnalytics = false) {
  const url = `/api/referrals/stats?wallet=${wallet}${includeAnalytics ? '&analytics=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch referral stats');
  return res.json();
}

async function fetchReferralNetwork(
  wallet: string,
  options: { level?: number; status?: string; limit?: number; offset?: number } = {}
) {
  const params = new URLSearchParams({ wallet });
  if (options.level) params.set('level', options.level.toString());
  if (options.status) params.set('status', options.status);
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());

  const res = await fetch(`/api/referrals/network?${params}`);
  if (!res.ok) throw new Error('Failed to fetch referral network');
  return res.json();
}

async function fetchRewardHistory(
  wallet: string,
  options: { status?: string; type?: string; limit?: number; offset?: number } = {}
) {
  const params = new URLSearchParams({ wallet });
  if (options.status) params.set('status', options.status);
  if (options.type) params.set('type', options.type);
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());

  const res = await fetch(`/api/referrals/rewards?${params}`);
  if (!res.ok) throw new Error('Failed to fetch reward history');
  return res.json();
}

async function fetchLeaderboard(
  options: { sortBy?: 'earnings' | 'referrals'; limit?: number; offset?: number; wallet?: string } = {}
) {
  const params = new URLSearchParams();
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());
  if (options.wallet) params.set('wallet', options.wallet);

  const res = await fetch(`/api/referrals/leaderboard?${params}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

async function setCustomReferralCode(wallet: string, customCode: string) {
  const res = await fetch('/api/referrals/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, customCode }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to set custom code');
  }
  return res.json();
}

async function trackReferralClick(code: string, metadata?: Record<string, string>) {
  const res = await fetch('/api/referrals/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, ...metadata }),
  });
  if (!res.ok) throw new Error('Failed to track click');
  return res.json();
}

async function registerReferralConversion(wallet: string, code?: string) {
  const res = await fetch('/api/referrals/track', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, code }),
  });
  if (!res.ok) throw new Error('Failed to register conversion');
  return res.json();
}

async function activateReferral(wallet: string) {
  const res = await fetch('/api/referrals/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to activate referral');
  }
  return res.json();
}

async function checkActivationStatus(wallet: string) {
  const res = await fetch(`/api/referrals/activate?wallet=${wallet}`);
  if (!res.ok) throw new Error('Failed to check activation status');
  return res.json();
}

// =====================================================
// 🎣 HOOKS
// =====================================================

/**
 * Hook to get/create referral code for a wallet
 */
export function useReferralCode(wallet?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['referralCode', wallet],
    queryFn: () => fetchReferralCode(wallet!),
    enabled: !!wallet,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const setCustomCodeMutation = useMutation({
    mutationFn: (customCode: string) => setCustomReferralCode(wallet!, customCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralCode', wallet] });
      queryClient.invalidateQueries({ queryKey: ['referralStats', wallet] });
    },
  });

  return {
    code: query.data?.data?.code,
    canonicalCode: query.data?.data?.canonicalCode,
    customCode: query.data?.data?.customCode,
    isActive: query.data?.data?.isActive,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    setCustomCode: setCustomCodeMutation.mutate,
    isSettingCustomCode: setCustomCodeMutation.isPending,
    setCustomCodeError: setCustomCodeMutation.error,
  };
}

/**
 * Hook to get comprehensive referral statistics
 */
export function useReferralStats(wallet?: string, options?: { includeAnalytics?: boolean }) {
  const query = useQuery({
    queryKey: ['referralStats', wallet, options?.includeAnalytics],
    queryFn: () => fetchReferralStats(wallet!, options?.includeAnalytics),
    enabled: !!wallet,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const data = query.data?.data as (ReferralStats & { analytics?: ClickAnalytics }) | undefined;

  return {
    stats: data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get referral network members
 */
export function useReferralNetwork(
  wallet?: string,
  options?: { level?: number; status?: string; limit?: number }
) {
  const [page, setPage] = useState(0);
  const limit = options?.limit || 20;

  const query = useQuery({
    queryKey: ['referralNetwork', wallet, options?.level, options?.status, page, limit],
    queryFn: () =>
      fetchReferralNetwork(wallet!, {
        level: options?.level,
        status: options?.status,
        limit,
        offset: page * limit,
      }),
    enabled: !!wallet,
    staleTime: 60 * 1000, // 1 minute
  });

  const data = query.data?.data;

  return {
    referrals: (data?.referrals || []) as ReferralNetworkMember[],
    stats: data?.stats,
    pagination: data?.pagination,
    page,
    setPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get reward history
 */
export function useRewardHistory(
  wallet?: string,
  options?: { status?: string; type?: string; limit?: number }
) {
  const [page, setPage] = useState(0);
  const limit = options?.limit || 20;

  const query = useQuery({
    queryKey: ['rewardHistory', wallet, options?.status, options?.type, page, limit],
    queryFn: () =>
      fetchRewardHistory(wallet!, {
        status: options?.status,
        type: options?.type,
        limit,
        offset: page * limit,
      }),
    enabled: !!wallet,
    staleTime: 30 * 1000,
  });

  const data = query.data?.data;

  return {
    rewards: (data?.rewards || []) as ReferralReward[],
    summary: data?.summary,
    pagination: data?.pagination,
    page,
    setPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get global leaderboard
 */
export function useReferralLeaderboard(options?: {
  sortBy?: 'earnings' | 'referrals';
  limit?: number;
  wallet?: string;
}) {
  const [page, setPage] = useState(0);
  const limit = options?.limit || 50;

  const query = useQuery({
    queryKey: ['referralLeaderboard', options?.sortBy, page, limit, options?.wallet],
    queryFn: () =>
      fetchLeaderboard({
        sortBy: options?.sortBy,
        limit,
        offset: page * limit,
        wallet: options?.wallet,
      }),
    staleTime: 60 * 1000, // 1 minute
  });

  const data = query.data?.data;

  return {
    leaderboard: (data?.leaderboard || []) as LeaderboardEntry[],
    stats: data?.stats,
    userPosition: data?.userPosition,
    pagination: data?.pagination,
    page,
    setPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to track referral click (for landing page)
 */
export function useTrackReferralClick() {
  const mutation = useMutation({
    mutationFn: ({ code, metadata }: { code: string; metadata?: Record<string, string> }) =>
      trackReferralClick(code, metadata),
  });

  return {
    trackClick: mutation.mutate,
    isTracking: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to register referral conversion (on wallet connect)
 */
export function useRegisterReferralConversion() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ wallet, code }: { wallet: string; code?: string }) =>
      registerReferralConversion(wallet, code),
    onSuccess: (_, { wallet }) => {
      queryClient.invalidateQueries({ queryKey: ['referralStats'] });
      queryClient.invalidateQueries({ queryKey: ['referralLeaderboard'] });
    },
  });

  return {
    registerConversion: mutation.mutate,
    isRegistering: mutation.isPending,
    result: mutation.data?.data,
    error: mutation.error,
  };
}

/**
 * Hook to activate a referral when they receive CGC tokens
 */
export function useActivateReferral() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (wallet: string) => activateReferral(wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralStats'] });
      queryClient.invalidateQueries({ queryKey: ['referralNetwork'] });
      queryClient.invalidateQueries({ queryKey: ['referralLeaderboard'] });
    },
  });

  return {
    activate: mutation.mutate,
    activateAsync: mutation.mutateAsync,
    isActivating: mutation.isPending,
    result: mutation.data?.data,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}

/**
 * Hook to check activation status of a referral
 */
export function useActivationStatus(wallet?: string) {
  const query = useQuery({
    queryKey: ['activationStatus', wallet],
    queryFn: () => checkActivationStatus(wallet!),
    enabled: !!wallet,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    hasReferrer: query.data?.data?.hasReferrer,
    isActive: query.data?.data?.isActive,
    status: query.data?.data?.status,
    activatedAt: query.data?.data?.activatedAt,
    joinedAt: query.data?.data?.joinedAt,
    cgcBalance: query.data?.data?.cgcBalance,
    hasCGC: query.data?.data?.hasCGC,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to generate referral link with UTM parameters
 */
export function useReferralLink(code?: string) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cryptogift-dao.com';

  const generateLink = useCallback(
    (options?: { source?: string; medium?: string; campaign?: string }) => {
      if (!code) return '';

      const url = new URL(baseUrl);
      url.searchParams.set('ref', code);

      if (options?.source) url.searchParams.set('utm_source', options.source);
      if (options?.medium) url.searchParams.set('utm_medium', options.medium);
      if (options?.campaign) url.searchParams.set('utm_campaign', options.campaign);

      return url.toString();
    },
    [code, baseUrl]
  );

  const links = useMemo(() => {
    if (!code) return null;

    return {
      default: generateLink(),
      twitter: generateLink({ source: 'twitter', medium: 'social', campaign: 'referral' }),
      telegram: generateLink({ source: 'telegram', medium: 'social', campaign: 'referral' }),
      discord: generateLink({ source: 'discord', medium: 'social', campaign: 'referral' }),
      email: generateLink({ source: 'email', medium: 'email', campaign: 'referral' }),
    };
  }, [code, generateLink]);

  const shareOnTwitter = useCallback(() => {
    if (!links?.twitter) return;
    const text = `Join CryptoGift DAO and earn CGC tokens! Use my referral link:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(links.twitter)}`,
      '_blank'
    );
  }, [links]);

  const shareOnTelegram = useCallback(() => {
    if (!links?.telegram) return;
    const text = `Join CryptoGift DAO and earn CGC tokens!`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(links.telegram)}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  }, [links]);

  type LinkVariant = 'default' | 'twitter' | 'telegram' | 'discord' | 'email';

  const copyToClipboard = useCallback(
    async (variant: LinkVariant = 'default') => {
      if (!links?.[variant]) return false;
      try {
        await navigator.clipboard.writeText(links[variant]);
        return true;
      } catch {
        return false;
      }
    },
    [links]
  );

  return {
    code,
    links,
    generateLink,
    shareOnTwitter,
    shareOnTelegram,
    copyToClipboard,
  };
}

/**
 * Combined hook for full referral dashboard data
 */
export function useReferralDashboard(wallet?: string) {
  const code = useReferralCode(wallet);
  const stats = useReferralStats(wallet, { includeAnalytics: true });
  const network = useReferralNetwork(wallet, { limit: 10 });
  const rewards = useRewardHistory(wallet, { limit: 10 });
  const links = useReferralLink(code.code);

  const isLoading =
    code.isLoading || stats.isLoading || network.isLoading || rewards.isLoading;

  const refetchAll = useCallback(() => {
    code.refetch();
    stats.refetch();
    network.refetch();
    rewards.refetch();
  }, [code, stats, network, rewards]);

  return {
    code,
    stats,
    network,
    rewards,
    links,
    isLoading,
    refetchAll,
  };
}
