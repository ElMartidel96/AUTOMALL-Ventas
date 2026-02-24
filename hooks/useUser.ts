'use client';

/**
 * Hook to detect and manage the current user's role in the `users` table.
 * Used for role selection, conditional navigation, and feature gating.
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from '@/lib/thirdweb';
import type { User, UserRole } from '@/lib/types/user';
import { isDealerRole } from '@/lib/types/user';
import { getAuthDataCache } from '@/hooks/useAuthData';

interface UseUserResult {
  user: User | null;
  isLoading: boolean;
  /** Connected but no record in users table yet */
  isNewUser: boolean;
  role: UserRole | null;
  isBuyer: boolean;
  isSeller: boolean;
  isBirddog: boolean;
  /** seller OR birddog */
  isDealer: boolean;
  /** Create a new user record with the chosen role */
  createUser: (role: UserRole) => Promise<{ user: User; needs_onboarding: boolean }>;
  /** Update the user's role */
  updateRole: (newRole: UserRole) => Promise<{ needs_onboarding: boolean }>;
  refetch: () => void;
}

export function useUser(): UseUserResult {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-role', address],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(`/api/users?wallet=${encodeURIComponent(address)}`);
      if (res.status === 404) return null;
      const json = await res.json();
      if (!json.success) return null;
      return json.data as User;
    },
    enabled: isConnected && !!address,
    staleTime: 5 * 60_000,
  });

  const user = data ?? null;
  const role = user?.role ?? null;
  const isNewUser = isConnected && !!address && !isLoading && !user;

  const createUser = useCallback(async (chosenRole: UserRole) => {
    if (!address) throw new Error('Not connected');

    // Include OAuth-captured data (email, phone) from social login
    const authData = getAuthDataCache();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: address,
        role: chosenRole,
        ...(authData.email ? { email: authData.email } : {}),
        ...(authData.phone ? { phone: authData.phone } : {}),
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create user');

    // Invalidate cache so the hook picks up the new user
    queryClient.invalidateQueries({ queryKey: ['user-role', address] });

    return {
      user: json.data as User,
      needs_onboarding: json.needs_onboarding as boolean,
    };
  }, [address, queryClient]);

  const updateRole = useCallback(async (newRole: UserRole) => {
    if (!address) throw new Error('Not connected');

    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: address, role: newRole }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update role');

    queryClient.invalidateQueries({ queryKey: ['user-role', address] });

    return { needs_onboarding: json.needs_onboarding as boolean };
  }, [address, queryClient]);

  return {
    user,
    isLoading,
    isNewUser,
    role,
    isBuyer: role === 'buyer',
    isSeller: role === 'seller',
    isBirddog: role === 'birddog',
    isDealer: role !== null && isDealerRole(role),
    createUser,
    updateRole,
    refetch,
  };
}
