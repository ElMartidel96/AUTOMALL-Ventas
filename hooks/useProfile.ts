/**
 * 👤 PROFILE HOOKS
 *
 * React hooks for user profile management in CryptoGift DAO.
 * Provides easy-to-use interfaces for profile CRUD and recovery.
 *
 * @version 1.0.0
 */

'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UserProfile,
  PublicProfile,
  ProfileUpdateRequest,
  ProfileSettings,
  ProfileTier,
} from '@/lib/supabase/types';

// =====================================================
// 📊 TYPES
// =====================================================

export interface ProfileWithTier extends Omit<UserProfile, 'password_hash' | 'email_verification_token' | 'password_reset_token'> {
  tier: ProfileTier;
  tier_color: string;
}

export interface RecoverySetupResult {
  success: boolean;
  verificationSent: boolean;
  message: string;
}

export interface UsernameCheckResult {
  available: boolean;
  username: string;
  reason: string | null;
}

// =====================================================
// 🔧 API FUNCTIONS
// =====================================================

async function fetchProfile(wallet: string): Promise<ProfileWithTier> {
  const res = await fetch(`/api/profile?wallet=${wallet}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch profile');
  }
  const data = await res.json();
  return data.data;
}

async function fetchPublicProfile(wallet: string): Promise<PublicProfile> {
  const res = await fetch(`/api/profile?wallet=${wallet}&public=true`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Profile not found');
  }
  const data = await res.json();
  return data.data;
}

async function createOrGetProfile(wallet: string): Promise<ProfileWithTier> {
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create profile');
  }
  const data = await res.json();
  return data.data;
}

async function updateProfileApi(
  wallet: string,
  updates: ProfileUpdateRequest
): Promise<ProfileWithTier> {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, ...updates }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update profile');
  }
  const data = await res.json();
  return data.data;
}

async function setupRecoveryApi(
  wallet: string,
  email: string,
  password: string
): Promise<RecoverySetupResult> {
  const res = await fetch('/api/profile/recovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to setup recovery');
  }
  const data = await res.json();
  return data.data;
}

async function loginWithCredentialsApi(
  email: string,
  password: string
): Promise<{ wallet: string; profile: ProfileWithTier }> {
  const res = await fetch('/api/profile/recovery', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Invalid credentials');
  }
  const data = await res.json();
  return data.data;
}

async function verifyEmailApi(token: string): Promise<{ success: boolean; wallet: string }> {
  const res = await fetch('/api/profile/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to verify email');
  }
  const data = await res.json();
  return data.data;
}

async function requestPasswordResetApi(email: string): Promise<{ message: string }> {
  const res = await fetch('/api/profile/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return data.data;
}

async function resetPasswordApi(
  token: string,
  password: string
): Promise<{ success: boolean; wallet: string }> {
  const res = await fetch('/api/profile/reset-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to reset password');
  }
  const data = await res.json();
  return data.data;
}

async function checkUsernameApi(
  username: string,
  wallet?: string
): Promise<UsernameCheckResult> {
  const params = new URLSearchParams({ username });
  if (wallet) params.set('wallet', wallet);

  const res = await fetch(`/api/profile/username?${params}`);
  if (!res.ok) {
    throw new Error('Failed to check username');
  }
  const data = await res.json();
  return data.data;
}

// =====================================================
// 🎣 HOOKS
// =====================================================

/**
 * Hook to get/create profile for connected wallet
 */
export function useProfile(wallet?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile', wallet],
    queryFn: () => (wallet ? createOrGetProfile(wallet) : Promise.reject('No wallet')),
    enabled: !!wallet,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: (updates: ProfileUpdateRequest) =>
      wallet ? updateProfileApi(wallet, updates) : Promise.reject('No wallet'),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', wallet], data);
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateProfile: updateMutation.mutate,
    updateProfileAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

/**
 * Hook to get public profile (for viewing others)
 */
export function usePublicProfile(wallet?: string) {
  const query = useQuery({
    queryKey: ['publicProfile', wallet],
    queryFn: () => (wallet ? fetchPublicProfile(wallet) : Promise.reject('No wallet')),
    enabled: !!wallet,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for profile settings management
 */
export function useProfileSettings(wallet?: string) {
  const { profile, updateProfile, isUpdating } = useProfile(wallet);

  const settings: ProfileSettings | null = profile
    ? {
        is_public: profile.is_public,
        show_email: profile.show_email,
        show_balance: profile.show_balance,
        notifications_enabled: profile.notifications_enabled,
      }
    : null;

  const updateSettings = useCallback(
    (newSettings: Partial<ProfileSettings>) => {
      updateProfile({ settings: newSettings });
    },
    [updateProfile]
  );

  return {
    settings,
    updateSettings,
    isUpdating,
  };
}

/**
 * Hook for recovery setup
 */
export function useRecoverySetup(wallet?: string) {
  const queryClient = useQueryClient();

  const setupMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      wallet ? setupRecoveryApi(wallet, email, password) : Promise.reject('No wallet'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', wallet] });
    },
  });

  return {
    setupRecovery: setupMutation.mutate,
    setupRecoveryAsync: setupMutation.mutateAsync,
    isSettingUp: setupMutation.isPending,
    result: setupMutation.data,
    error: setupMutation.error,
  };
}

/**
 * Hook for email verification
 */
export function useEmailVerification() {
  const verifyMutation = useMutation({
    mutationFn: (token: string) => verifyEmailApi(token),
  });

  return {
    verifyEmail: verifyMutation.mutate,
    verifyEmailAsync: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
    result: verifyMutation.data,
    error: verifyMutation.error,
  };
}

/**
 * Hook for password reset flow
 */
export function usePasswordReset() {
  const requestMutation = useMutation({
    mutationFn: (email: string) => requestPasswordResetApi(email),
  });

  const resetMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPasswordApi(token, password),
  });

  return {
    requestReset: requestMutation.mutate,
    requestResetAsync: requestMutation.mutateAsync,
    isRequesting: requestMutation.isPending,
    requestResult: requestMutation.data,
    requestError: requestMutation.error,

    resetPassword: resetMutation.mutate,
    resetPasswordAsync: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,
    resetResult: resetMutation.data,
    resetError: resetMutation.error,
  };
}

/**
 * Hook for credential-based login (recovery)
 */
export function useCredentialLogin() {
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginWithCredentialsApi(email, password),
  });

  return {
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    result: loginMutation.data,
    error: loginMutation.error,
  };
}

/**
 * Hook for username availability check
 */
export function useUsernameCheck(wallet?: string) {
  const [username, setUsername] = useState('');
  const [debouncedUsername, setDebouncedUsername] = useState('');

  // Debounce username input
  const checkUsername = useCallback((value: string) => {
    setUsername(value);
    const timer = setTimeout(() => {
      setDebouncedUsername(value);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const query = useQuery({
    queryKey: ['usernameCheck', debouncedUsername, wallet],
    queryFn: () => checkUsernameApi(debouncedUsername, wallet),
    enabled: debouncedUsername.length >= 3,
    staleTime: 10 * 1000, // 10 seconds
  });

  return {
    username,
    checkUsername,
    result: query.data,
    isChecking: query.isFetching,
    isAvailable: query.data?.available,
  };
}

/**
 * Combined hook for full profile management
 */
export function useProfileManager(wallet?: string) {
  const profile = useProfile(wallet);
  const settings = useProfileSettings(wallet);
  const recovery = useRecoverySetup(wallet);
  const usernameCheck = useUsernameCheck(wallet);

  const hasRecoverySetup = !!(profile.profile?.email && profile.profile?.email_verified);

  return {
    // Profile data
    profile: profile.profile,
    isLoading: profile.isLoading,
    isError: profile.isError,
    error: profile.error,
    refetch: profile.refetch,

    // Profile updates
    updateProfile: profile.updateProfile,
    isUpdating: profile.isUpdating,

    // Settings
    settings: settings.settings,
    updateSettings: settings.updateSettings,

    // Recovery
    hasRecoverySetup,
    setupRecovery: recovery.setupRecovery,
    isSettingUpRecovery: recovery.isSettingUp,
    recoveryResult: recovery.result,
    recoveryError: recovery.error,

    // Username check
    checkUsername: usernameCheck.checkUsername,
    usernameResult: usernameCheck.result,
    isCheckingUsername: usernameCheck.isChecking,
  };
}
