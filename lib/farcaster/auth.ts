/**
 * Farcaster Mini App Authentication - SECURE
 *
 * This module handles secure authentication for the Mini App.
 * CRITICAL: Never trust client-provided wallet addresses.
 *
 * Security Model:
 * 1. Client requests auth via Farcaster Quick Auth
 * 2. Server verifies the signature against Farcaster's APIs
 * 3. Server derives wallet from verified FID
 * 4. All subsequent requests use server-side session
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import type { VerifiedSession } from './types';

// Session storage key
const SESSION_KEY = 'cgc_farcaster_session';

/**
 * Request authentication from Farcaster
 * This opens the Quick Auth flow in Farcaster client
 */
export async function requestAuth(): Promise<{
  success: boolean;
  message?: string;
  nonce?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Client-side only' };
  }

  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');

    // Generate a nonce for this auth request
    const nonce = generateNonce();

    // Request signature from user
    const result = await sdk.actions.signIn({ nonce });

    if (!result?.signature || !result?.message) {
      return { success: false, message: 'Auth cancelled or failed' };
    }

    // Send to backend for verification
    const verifyResponse = await fetch('/api/miniapp/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: result.message,
        signature: result.signature,
        nonce,
      }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      return { success: false, message: error.message || 'Verification failed' };
    }

    const session = await verifyResponse.json();

    // Store session securely
    storeSession(session);

    return { success: true };
  } catch (error) {
    console.error('[Farcaster Auth] Error:', error);
    return { success: false, message: 'Auth error' };
  }
}

/**
 * Get current verified session
 * Returns null if no valid session exists
 */
export function getSession(): VerifiedSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session: VerifiedSession = JSON.parse(stored);

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Get verified wallet address from session
 * SECURE: This wallet was verified server-side
 */
export function getVerifiedWallet(): string | null {
  const session = getSession();
  return session?.wallet ?? null;
}

/**
 * Get verified FID from session
 */
export function getVerifiedFid(): number | null {
  const session = getSession();
  return session?.fid ?? null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Store session in localStorage
 */
function storeSession(session: VerifiedSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('[Farcaster Auth] Failed to store session:', error);
  }
}

/**
 * Clear current session
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Generate a secure nonce for auth requests
 */
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Make an authenticated API request
 * Automatically includes session credentials
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const headers = new Headers(options.headers);
  headers.set('X-Farcaster-FID', session.fid.toString());
  headers.set('X-Farcaster-Signature', session.signature);

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Hook-friendly wrapper for checking auth status
 * Returns current auth state without side effects
 */
export function getAuthState(): {
  isAuthenticated: boolean;
  fid: number | null;
  wallet: string | null;
} {
  const session = getSession();

  return {
    isAuthenticated: session !== null,
    fid: session?.fid ?? null,
    wallet: session?.wallet ?? null,
  };
}
