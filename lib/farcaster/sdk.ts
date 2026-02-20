/**
 * Farcaster Mini App SDK Wrapper
 *
 * Provides a clean interface for interacting with the Farcaster Mini App SDK.
 * Handles SDK initialization, ready state, and common actions.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import type { FarcasterUser, MiniAppContext, ComposeCastOptions } from './types';

// SDK will be dynamically imported to avoid SSR issues
let sdkInstance: typeof import('@farcaster/miniapp-sdk').sdk | null = null;

/**
 * Initialize and get the Farcaster SDK instance
 * Must only be called on client side
 */
export async function getSDK() {
  if (typeof window === 'undefined') {
    throw new Error('Farcaster SDK can only be used on client side');
  }

  if (!sdkInstance) {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    sdkInstance = sdk;
  }

  return sdkInstance;
}

/**
 * Check if running inside a Farcaster client (Warpcast, Base App, etc.)
 */
export function isInFarcasterClient(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Farcaster-specific indicators
  const userAgent = navigator.userAgent.toLowerCase();
  const isFarcasterUA = userAgent.includes('warpcast') || userAgent.includes('farcaster');

  // Also check for frame context
  const hasFrameContext = typeof window !== 'undefined' && 'ethereum' in window;

  return isFarcasterUA || hasFrameContext;
}

/**
 * Signal that the Mini App is ready to be displayed
 * CRITICAL: Must be called after app loads, or users see infinite loading
 */
export async function signalReady(): Promise<void> {
  try {
    const sdk = await getSDK();
    sdk.actions.ready();
    console.log('[Farcaster SDK] Ready signal sent');
  } catch (error) {
    console.error('[Farcaster SDK] Failed to signal ready:', error);
    // Don't throw - app should still work even if SDK fails
  }
}

/**
 * Get the current user context from Farcaster
 * WARNING: This data is UNTRUSTED. Use server-side verification for auth.
 */
export async function getContext(): Promise<MiniAppContext> {
  const defaultContext: MiniAppContext = {
    user: null,
    isReady: false,
    isInFarcasterClient: false,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  };

  if (!isInFarcasterClient()) {
    return defaultContext;
  }

  try {
    const sdk = await getSDK();
    const context = await sdk.context;

    // Map SDK user context to our FarcasterUser type
    // Note: custody is not directly available in SDK, use verifiedAddresses instead
    const sdkUser = context.user as {
      fid: number;
      username?: string;
      displayName?: string;
      pfpUrl?: string;
      verifiedAddresses?: { ethAddresses?: string[]; solAddresses?: string[] };
    } | null;

    return {
      user: sdkUser
        ? {
            fid: sdkUser.fid,
            username: sdkUser.username,
            displayName: sdkUser.displayName,
            pfpUrl: sdkUser.pfpUrl,
            // Custody address derived from first verified ETH address
            custody: sdkUser.verifiedAddresses?.ethAddresses?.[0],
            verifiedAddresses: sdkUser.verifiedAddresses,
          }
        : null,
      isReady: true,
      isInFarcasterClient: true,
      safeAreaInsets: context.client?.safeAreaInsets || defaultContext.safeAreaInsets,
    };
  } catch (error) {
    console.error('[Farcaster SDK] Failed to get context:', error);
    return defaultContext;
  }
}

/**
 * Open compose window to create a cast (Farcaster post)
 * Used for viral sharing of achievements
 */
export async function composeCast(options: ComposeCastOptions): Promise<boolean> {
  if (!isInFarcasterClient()) {
    console.warn('[Farcaster SDK] composeCast called outside Farcaster client');
    return false;
  }

  try {
    const sdk = await getSDK();

    // Build compose options with proper SDK types
    const composeOptions: Parameters<typeof sdk.actions.composeCast>[0] = {
      text: options.text,
    };

    // embeds must be a tuple of 0-2 URLs
    if (options.embeds && options.embeds.length > 0) {
      composeOptions.embeds = options.embeds.slice(0, 2) as [] | [string] | [string, string];
    }

    // parent requires type: "cast" format
    if (options.parentCastId) {
      composeOptions.parent = {
        type: 'cast' as const,
        hash: options.parentCastId.hash,
      };
    }

    await sdk.actions.composeCast(composeOptions);
    return true;
  } catch (error) {
    console.error('[Farcaster SDK] Failed to compose cast:', error);
    return false;
  }
}

/**
 * Share achievement to Farcaster feed
 * Pre-formatted for task completion viral loop
 */
export async function shareAchievement(
  taskName: string,
  rewardCGC: number,
  miniAppUrl: string
): Promise<boolean> {
  const text = `🎯 Just completed "${taskName}" and earned ${rewardCGC} CGC!\n\nJoin @cryptogiftdao and start earning:`

  return composeCast({
    text,
    embeds: [miniAppUrl],
  });
}

/**
 * Share referral link to Farcaster feed
 */
export async function shareReferralLink(
  referralCode: string,
  referralUrl: string
): Promise<boolean> {
  const text = `🚀 Join me in CryptoGift DAO!\n\nComplete tasks, earn CGC tokens, and be part of the future of decentralized governance.\n\nUse my referral code: ${referralCode}`;

  return composeCast({
    text,
    embeds: [referralUrl],
  });
}

/**
 * Request to add Mini App to user's favorites (for notifications in Phase 2)
 */
export async function requestAddToFavorites(): Promise<boolean> {
  if (!isInFarcasterClient()) return false;

  try {
    const sdk = await getSDK();
    await sdk.actions.addFrame();
    // If we reach here without error, the app was added successfully
    return true;
  } catch (error) {
    console.error('[Farcaster SDK] Failed to add to favorites:', error);
    return false;
  }
}

/**
 * Close the Mini App modal
 */
export async function closeApp(): Promise<void> {
  if (!isInFarcasterClient()) return;

  try {
    const sdk = await getSDK();
    sdk.actions.close();
  } catch (error) {
    console.error('[Farcaster SDK] Failed to close app:', error);
  }
}

/**
 * Open external URL in browser
 */
export async function openUrl(url: string): Promise<void> {
  if (!isInFarcasterClient()) {
    window.open(url, '_blank');
    return;
  }

  try {
    const sdk = await getSDK();
    sdk.actions.openUrl(url);
  } catch (error) {
    console.error('[Farcaster SDK] Failed to open URL:', error);
    window.open(url, '_blank');
  }
}
