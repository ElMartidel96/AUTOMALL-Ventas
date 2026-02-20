/**
 * Farcaster Mini App Types
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

/**
 * Farcaster User Context from Mini App SDK
 * WARNING: These values CAN BE SPOOFED in client context.
 * For security-critical operations, use server-side verification.
 */
export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string; // Custody wallet address
  verifiedAddresses?: {
    ethAddresses?: string[];
    solAddresses?: string[];
  };
}

/**
 * Mini App Context - Client side (UNTRUSTED)
 */
export interface MiniAppContext {
  user: FarcasterUser | null;
  isReady: boolean;
  isInFarcasterClient: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Verified Session - Server side (TRUSTED)
 * Created after server-side verification of Farcaster signature
 */
export interface VerifiedSession {
  fid: number;
  wallet: string; // Verified wallet address
  verifiedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  signature: string; // Original signature for audit
}

/**
 * Mini App Tab Configuration
 */
export type MiniAppTab = 'dashboard' | 'tasks' | 'referrals';

export interface TabConfig {
  id: MiniAppTab;
  labelKey: string; // i18n key
  icon: string; // Lucide icon name
}

/**
 * Dashboard Metrics - Shown on Tab 1
 * These 6 metrics drive user behavior
 */
export interface DashboardMetrics {
  // Opportunity metrics
  availableTasks: number;
  tasksInProgress: number;
  pendingRewardsCGC: number;

  // Social/gamification metrics
  activeReferrals: number;
  streakDays: number;
  leaderboardRank: number;
}

/**
 * Compose Cast Options
 * For viral sharing functionality
 */
export interface ComposeCastOptions {
  text: string;
  embeds?: string[]; // URLs to embed
  parentCastId?: {
    fid: number;
    hash: string;
  };
}

/**
 * Notification Request (for Fase 2)
 */
export interface NotificationRequest {
  type: 'task_available' | 'task_expiring' | 'reward_earned' | 'referral_joined';
  title: string;
  body: string;
  targetUrl?: string;
}
