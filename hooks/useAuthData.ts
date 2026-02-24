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
}

// Module-level cache so other hooks can access captured data imperatively
let _authDataCache: AuthData = { email: null, phone: null, authProvider: null };

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
      _authDataCache = { email: null, phone: null, authProvider: null };
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
        }

        if (cancelled) return;

        const captured: AuthData = { email, phone, authProvider };
        _authDataCache = captured;
        capturedForRef.current = address!;
        setAuthData(captured);

        // Auto-save to users table if we captured useful data
        if (email || phone) {
          const updates: Record<string, string> = {};
          if (email) updates.email = email;
          if (phone) updates.phone = phone;

          // Save to users table (may fail if user record doesn't exist yet — that's ok)
          fetch('/api/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet: address, ...updates }),
          }).catch(() => {});

          // Save to profile table (may fail if profile doesn't exist yet — that's ok)
          if (email) {
            fetch('/api/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallet: address, email }),
            }).catch(() => {});
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
