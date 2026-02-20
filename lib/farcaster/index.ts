/**
 * Farcaster Mini App Library
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

// Types
export type {
  FarcasterUser,
  MiniAppContext,
  VerifiedSession,
  MiniAppTab,
  TabConfig,
  DashboardMetrics,
  ComposeCastOptions,
  NotificationRequest,
} from './types';

// SDK Functions
export {
  getSDK,
  isInFarcasterClient,
  signalReady,
  getContext,
  composeCast,
  shareAchievement,
  shareReferralLink,
  requestAddToFavorites,
  closeApp,
  openUrl,
} from './sdk';

// Auth Functions
export {
  requestAuth,
  getSession,
  getVerifiedWallet,
  getVerifiedFid,
  isAuthenticated,
  clearSession,
  authFetch,
  getAuthState,
} from './auth';
