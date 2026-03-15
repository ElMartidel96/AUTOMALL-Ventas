'use client';

/**
 * useAuthData — Captures OAuth metadata from Thirdweb inAppWallet
 *
 * After a user connects via social login (Google, Apple, Facebook, etc.),
 * this hook extracts their email and phone from the auth session and
 * automatically saves it to the users and profile tables.
 *
 * Uses Thirdweb v5's getProfiles() which returns all linked auth profiles
 * with details like email and phone number.
 *
 * Also exports getAuthDataCache() for imperative access (e.g. during user creation).
 */

import { useEffect, useState, useRef } from 'react';
import { useAccount } from '@/lib/thirdweb';
import { getClient } from '@/lib/thirdweb/client';

export interface AuthData {
  email: string | null;
  phone: string | null;
  authProvider: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

// Module-level cache so other hooks can access captured data imperatively
let _authDataCache: AuthData = { email: null, phone: null, authProvider: null, displayName: null, avatarUrl: null };

/** Get cached auth data captured from the last OAuth login */
export function getAuthDataCache(): AuthData {
  return _authDataCache;
}

/**
 * Extracts email and phone from Thirdweb auth session.
 * Automatically patches the users and profile tables with captured data.
 */
export function useAuthData(): AuthData {
  const { address, isConnected } = useAccount();
  const capturedForRef = useRef<string | null>(null);
  const [authData, setAuthData] = useState<AuthData>(_authDataCache);

  useEffect(() => {
    if (!isConnected || !address) {
      capturedForRef.current = null;
      _authDataCache = { email: null, phone: null, authProvider: null, displayName: null, avatarUrl: null };
      setAuthData(_authDataCache);
      return;
    }

    // Only capture once per address per session
    if (capturedForRef.current === address) return;

    const client = getClient();
    if (!client) return;

    let cancelled = false;

    async function captureAuthData() {
      try {
        // Dynamic import to avoid SSR issues — this is a client-only API
        const { getProfiles } = await import('thirdweb/wallets/in-app');

        const profiles = await getProfiles({ client: client! });

        if (cancelled || !profiles || profiles.length === 0) return;

        let email: string | null = null;
        let phone: string | null = null;
        let authProvider: string | null = null;
        let displayName: string | null = null;
        let avatarUrl: string | null = null;

        for (const profile of profiles) {
          // Capture the auth provider type (google, apple, facebook, etc.)
          if (!authProvider && profile.type !== 'wallet') {
            authProvider = profile.type;
          }
          // Capture email from any linked profile
          if (!email && profile.details.email) {
            email = profile.details.email;
          }
          // Capture phone from any linked profile
          if (!phone && profile.details.phone) {
            phone = profile.details.phone;
          }

          // Runtime-safe: OAuth providers (Google, Facebook) return extra fields
          // not declared in Thirdweb's TypeScript types (name, picture, etc.)
          const d = profile.details as Record<string, unknown>;
          if (!displayName && typeof d.name === 'string' && d.name) {
            displayName = d.name;
          }
          if (!displayName && typeof d.displayName === 'string' && d.displayName) {
            displayName = d.displayName;
          }
          if (!avatarUrl && typeof d.picture === 'string' && d.picture) {
            avatarUrl = d.picture;
          }
          if (!avatarUrl && typeof d.avatar === 'string' && d.avatar) {
            avatarUrl = d.avatar;
          }
          if (!avatarUrl && typeof d.avatarUrl === 'string' && d.avatarUrl) {
            avatarUrl = d.avatarUrl;
          }
        }

        if (cancelled) return;

        const captured: AuthData = { email, phone, authProvider, displayName, avatarUrl };
        _authDataCache = captured;
        capturedForRef.current = address!;
        setAuthData(captured);

        // Auto-save to users table if we captured useful data.
        // CRITICAL: Do NOT overwrite avatar_url or display_name if the user already
        // has a custom one (uploaded via profile page). Only set them if currently empty
        // or still the same OAuth URL. This prevents "Google photo resets my custom avatar" bug.
        if (email || phone || displayName || avatarUrl) {
          try {
            // Check what the user currently has in DB
            const currentRes = await fetch(`/api/users?wallet=${encodeURIComponent(address!)}`);
            const currentUser = currentRes.ok ? (await currentRes.json()).data : null;

            const updates: Record<string, string> = {};
            if (email) updates.email = email;
            if (phone) updates.phone = phone;

            // Only set display_name if user has no name yet
            if (displayName && !currentUser?.display_name) {
              updates.display_name = displayName;
            }

            // Only set avatar_url if user has no avatar OR current avatar is from OAuth
            // (Google, Facebook, Apple CDNs). If user uploaded a custom one, preserve it.
            const currentAvatar = currentUser?.avatar_url || '';
            const isOAuthAvatar = !currentAvatar
              || currentAvatar.includes('googleusercontent.com')
              || currentAvatar.includes('ggpht.com')
              || currentAvatar.includes('graph.facebook.com')
              || currentAvatar.includes('platform-lookaside.fbsbx.com')
              || currentAvatar.includes('appleid.apple.com');

            if (avatarUrl && isOAuthAvatar) {
              updates.avatar_url = avatarUrl;
            }

            if (Object.keys(updates).length > 0) {
              fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: address, ...updates }),
              }).catch(() => {});
            }
          } catch {
            // If check fails, still save email/phone but skip avatar/name to be safe
            const safeUpdates: Record<string, string> = {};
            if (email) safeUpdates.email = email;
            if (phone) safeUpdates.phone = phone;
            if (Object.keys(safeUpdates).length > 0) {
              fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: address, ...safeUpdates }),
              }).catch(() => {});
            }
          }
        }
      } catch {
        // getProfiles fails if user is not authenticated via inAppWallet — expected for crypto wallets
      }
    }

    captureAuthData();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  return authData;
}
