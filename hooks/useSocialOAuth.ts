/**
 * 🔐 Social OAuth Hook
 *
 * Provides easy-to-use OAuth popup flow for Twitter and Discord verification
 * Automatically checks if user completed the required action (follow/join)
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

export type SocialPlatform = 'twitter' | 'discord';

export interface OAuthResult {
  success: boolean;
  platform: SocialPlatform;
  verified: boolean;
  userId?: string;
  username?: string;
  error?: string;
}

export interface UseSocialOAuthOptions {
  walletAddress?: string; // Optional - not needed for social verification
  sessionId?: string; // Alternative identifier for state tracking
  onVerified?: (platform: SocialPlatform, data: { username: string; userId?: string }) => void;
  onError?: (error: string) => void;
  // 🆕 Initial values for restoring from localStorage persistence
  initialTwitterVerified?: boolean;
  initialTwitterUsername?: string | null;
  initialDiscordVerified?: boolean;
  initialDiscordUsername?: string | null;
}

export function useSocialOAuth(options: UseSocialOAuthOptions) {
  const {
    walletAddress,
    sessionId,
    onVerified,
    onError,
    initialTwitterVerified = false,
    initialTwitterUsername = null,
    initialDiscordVerified = false,
    initialDiscordUsername = null,
  } = options;

  // Generate a stable unique identifier for state tracking (wallet not required)
  // This identifier is used for OAuth state management, not blockchain operations
  const stateIdentifier = useMemo(() => {
    return walletAddress || sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, [walletAddress, sessionId]);

  // 🆕 Initialize with persisted values (from localStorage) to survive page refresh
  const [twitterVerified, setTwitterVerified] = useState(initialTwitterVerified);
  const [discordVerified, setDiscordVerified] = useState(initialDiscordVerified);
  const [twitterUsername, setTwitterUsername] = useState<string | null>(initialTwitterUsername);
  const [discordUsername, setDiscordUsername] = useState<string | null>(initialDiscordUsername);
  const [isLoading, setIsLoading] = useState<SocialPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);

  const popupRef = useRef<Window | null>(null);

  // 🔄 SYNC: Update state when initial values change (loaded from localStorage after first render)
  // This is crucial because useState ignores initial value after first render
  useEffect(() => {
    if (initialTwitterVerified && !twitterVerified) {
      console.log('[useSocialOAuth] 🔄 Syncing Twitter verified from persistence');
      setTwitterVerified(true);
    }
  }, [initialTwitterVerified, twitterVerified]);

  useEffect(() => {
    if (initialDiscordVerified && !discordVerified) {
      console.log('[useSocialOAuth] 🔄 Syncing Discord verified from persistence');
      setDiscordVerified(true);
    }
  }, [initialDiscordVerified, discordVerified]);

  useEffect(() => {
    if (initialTwitterUsername && !twitterUsername) {
      setTwitterUsername(initialTwitterUsername);
    }
  }, [initialTwitterUsername, twitterUsername]);

  useEffect(() => {
    if (initialDiscordUsername && !discordUsername) {
      setDiscordUsername(initialDiscordUsername);
    }
  }, [initialDiscordUsername, discordUsername]);

  // Listen for OAuth callback messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin if needed
      if (event.data?.type !== 'SOCIAL_OAUTH_CALLBACK') return;

      const result: OAuthResult = event.data;
      setIsLoading(null);

      if (result.success && result.verified) {
        if (result.platform === 'twitter') {
          setTwitterVerified(true);
          setTwitterUsername(result.username || null);
          // 🆕 Pass both username and userId for persistence
          onVerified?.('twitter', { username: result.username || '', userId: result.userId });
        } else if (result.platform === 'discord') {
          setDiscordVerified(true);
          setDiscordUsername(result.username || null);
          // 🆕 Pass both username and userId for persistence
          onVerified?.('discord', { username: result.username || '', userId: result.userId });
        }
        setError(null);
      } else if (result.success && !result.verified) {
        // User authenticated but didn't complete the action
        setError(result.error || `Please ${result.platform === 'twitter' ? 'follow @cryptogiftdao' : 'join our Discord'} first`);
        onError?.(result.error || 'Action not completed');
      } else {
        setError(result.error || 'Verification failed');
        onError?.(result.error || 'Verification failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onVerified, onError]);

  // Open OAuth popup for a platform
  const startVerification = useCallback(async (platform: SocialPlatform) => {
    console.log(`[SocialOAuth] Starting ${platform} verification, identifier: ${stateIdentifier}`);

    setIsLoading(platform);
    setError(null);

    try {
      console.log(`[SocialOAuth] Calling /api/social/oauth-init for ${platform}`);

      // Get OAuth URL from API - wallet is optional, use stateIdentifier for tracking
      const response = await fetch('/api/social/oauth-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, walletAddress: stateIdentifier }),
      });

      const data = await response.json();
      console.log(`[SocialOAuth] API response:`, data);

      if (!response.ok || !data.authUrl) {
        throw new Error(data.error || 'Failed to get OAuth URL');
      }

      // Close any existing popup
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }

      // Calculate popup position (center of screen)
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      console.log(`[SocialOAuth] Opening popup for ${platform}`);

      // Open popup
      popupRef.current = window.open(
        data.authUrl,
        `${platform}OAuth`,
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      // Check if popup was blocked
      if (!popupRef.current || popupRef.current.closed) {
        const errorMsg = 'Popup bloqueado. Por favor permite popups para este sitio.';
        console.error('[SocialOAuth] Popup blocked!');
        setError(errorMsg);
        setIsLoading(null);
        onError?.(errorMsg);
        return;
      }

      // Monitor popup closure
      const checkClosed = setInterval(() => {
        if (popupRef.current?.closed) {
          clearInterval(checkClosed);
          // If still loading when popup closes, user cancelled
          setIsLoading((current) => {
            if (current === platform) {
              setError('Verificación cancelada');
              return null;
            }
            return current;
          });
        }
      }, 500);
    } catch (err) {
      console.error('[SocialOAuth] Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error al iniciar verificación';
      setError(errorMsg);
      setIsLoading(null);
      onError?.(errorMsg);
    }
  }, [stateIdentifier, onError]);

  // Convenience methods
  const verifyTwitter = useCallback(() => startVerification('twitter'), [startVerification]);
  const verifyDiscord = useCallback(() => startVerification('discord'), [startVerification]);

  // Reset state
  const reset = useCallback(() => {
    setTwitterVerified(false);
    setDiscordVerified(false);
    setTwitterUsername(null);
    setDiscordUsername(null);
    setError(null);
    setIsLoading(null);
  }, []);

  return {
    // State
    twitterVerified,
    discordVerified,
    twitterUsername,
    discordUsername,
    isLoading,
    error,

    // Actions
    startVerification,
    verifyTwitter,
    verifyDiscord,
    reset,

    // Computed
    isTwitterLoading: isLoading === 'twitter',
    isDiscordLoading: isLoading === 'discord',
  };
}
