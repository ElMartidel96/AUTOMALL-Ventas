/**
 * 🔒 REFERRAL PERSISTENCE SERVICE
 *
 * Provides robust state persistence for the referral flow.
 * Ensures user progress is NEVER lost due to page refresh, browser close,
 * navigation, or any other interruption.
 *
 * Storage Strategy:
 * - localStorage: Primary persistence (survives browser close, 30-day expiry)
 * - sessionStorage: Backup for same-session recovery
 * - Cookies: Compatibility layer for API communication
 *
 * @version 2.0.0 - Zero Friction Edition
 */

// Storage keys
const STORAGE_KEY = 'cgdao_referral_progress';
const STORAGE_VERSION = 2;

// Types
export interface ReferralProgress {
  version: number;

  // Core referral data
  referralCode: string;
  referrerWallet?: string;

  // Progress tracking
  step: 'click_tracked' | 'wallet_connected' | 'conversion_registered' | 'bonus_distributed' | 'completed';

  // UTM tracking
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage?: string;

  // Timestamps
  startedAt: number;
  lastUpdatedAt: number;
  clickTrackedAt?: number;
  walletConnectedAt?: number;
  conversionRegisteredAt?: number;
  completedAt?: number;

  // Wallet info (when connected)
  walletAddress?: string;

  // API response data (for recovery)
  clickTrackingResponse?: {
    tracked: boolean;
    ipHash?: string;
  };
  conversionResponse?: {
    registered: boolean;
    referrer?: string;
    level?: number;
    bonusDistributed?: boolean;
    totalAmount?: number;
  };

  // Error tracking (for retry logic)
  lastError?: {
    step: string;
    message: string;
    timestamp: number;
    retryCount: number;
  };
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Get expiry time (30 days from now)
 */
function getExpiryTime(): number {
  return Date.now() + (30 * 24 * 60 * 60 * 1000);
}

/**
 * Check if progress has expired
 */
function isExpired(progress: ReferralProgress): boolean {
  const expiryTime = progress.startedAt + (30 * 24 * 60 * 60 * 1000);
  return Date.now() > expiryTime;
}

/**
 * Save progress to localStorage and sessionStorage
 */
export function saveProgress(progress: ReferralProgress): boolean {
  if (!isBrowser()) return false;

  try {
    const data = JSON.stringify({
      ...progress,
      version: STORAGE_VERSION,
      lastUpdatedAt: Date.now(),
    });

    // Primary storage
    localStorage.setItem(STORAGE_KEY, data);

    // Backup storage
    sessionStorage.setItem(STORAGE_KEY, data);

    console.log('[ReferralPersistence] Progress saved:', progress.step);
    return true;
  } catch (error) {
    console.error('[ReferralPersistence] Failed to save progress:', error);
    return false;
  }
}

/**
 * Load progress from storage
 * Tries localStorage first, falls back to sessionStorage
 */
export function loadProgress(): ReferralProgress | null {
  if (!isBrowser()) return null;

  try {
    // Try localStorage first
    let data = localStorage.getItem(STORAGE_KEY);

    // Fallback to sessionStorage
    if (!data) {
      data = sessionStorage.getItem(STORAGE_KEY);
    }

    if (!data) return null;

    const progress = JSON.parse(data) as ReferralProgress;

    // Check version compatibility
    if (progress.version !== STORAGE_VERSION) {
      console.log('[ReferralPersistence] Old version detected, clearing');
      clearProgress();
      return null;
    }

    // Check expiry
    if (isExpired(progress)) {
      console.log('[ReferralPersistence] Progress expired, clearing');
      clearProgress();
      return null;
    }

    console.log('[ReferralPersistence] Progress loaded:', progress.step);
    return progress;
  } catch (error) {
    console.error('[ReferralPersistence] Failed to load progress:', error);
    return null;
  }
}

/**
 * Clear all referral progress
 */
export function clearProgress(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('[ReferralPersistence] Progress cleared');
  } catch (error) {
    console.error('[ReferralPersistence] Failed to clear progress:', error);
  }
}

/**
 * Initialize new referral progress when user clicks a referral link
 */
export function initializeProgress(
  referralCode: string,
  options?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    landingPage?: string;
  }
): ReferralProgress {
  const now = Date.now();

  const progress: ReferralProgress = {
    version: STORAGE_VERSION,
    referralCode,
    step: 'click_tracked',
    utmSource: options?.utmSource,
    utmMedium: options?.utmMedium,
    utmCampaign: options?.utmCampaign,
    landingPage: options?.landingPage,
    startedAt: now,
    lastUpdatedAt: now,
    clickTrackedAt: now,
  };

  saveProgress(progress);
  return progress;
}

/**
 * Update progress when click is tracked via API
 */
export function updateClickTracked(
  progress: ReferralProgress,
  response: { tracked: boolean; ipHash?: string }
): ReferralProgress {
  const updated: ReferralProgress = {
    ...progress,
    step: 'click_tracked',
    clickTrackedAt: Date.now(),
    clickTrackingResponse: response,
    lastUpdatedAt: Date.now(),
  };

  saveProgress(updated);
  return updated;
}

/**
 * Update progress when wallet is connected
 */
export function updateWalletConnected(
  progress: ReferralProgress,
  walletAddress: string
): ReferralProgress {
  const updated: ReferralProgress = {
    ...progress,
    step: 'wallet_connected',
    walletAddress,
    walletConnectedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };

  saveProgress(updated);
  return updated;
}

/**
 * Update progress when conversion is registered
 */
export function updateConversionRegistered(
  progress: ReferralProgress,
  response: {
    registered: boolean;
    referrer?: string;
    level?: number;
    bonusDistributed?: boolean;
    totalAmount?: number;
  }
): ReferralProgress {
  const updated: ReferralProgress = {
    ...progress,
    step: response.registered ? 'conversion_registered' : progress.step,
    conversionRegisteredAt: response.registered ? Date.now() : undefined,
    conversionResponse: response,
    referrerWallet: response.referrer,
    lastUpdatedAt: Date.now(),
  };

  saveProgress(updated);
  return updated;
}

/**
 * Mark progress as completed (bonus distributed)
 */
export function markCompleted(progress: ReferralProgress): ReferralProgress {
  const updated: ReferralProgress = {
    ...progress,
    step: 'completed',
    completedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };

  saveProgress(updated);

  // Schedule cleanup after 1 hour (user can still see completion status)
  if (isBrowser()) {
    setTimeout(() => {
      const current = loadProgress();
      if (current?.step === 'completed') {
        clearProgress();
      }
    }, 60 * 60 * 1000);
  }

  return updated;
}

/**
 * Record an error for retry logic
 */
export function recordError(
  progress: ReferralProgress,
  step: string,
  message: string
): ReferralProgress {
  const currentRetryCount = progress.lastError?.step === step
    ? (progress.lastError.retryCount || 0) + 1
    : 1;

  const updated: ReferralProgress = {
    ...progress,
    lastError: {
      step,
      message,
      timestamp: Date.now(),
      retryCount: currentRetryCount,
    },
    lastUpdatedAt: Date.now(),
  };

  saveProgress(updated);
  return updated;
}

/**
 * Check if we should retry an operation
 * Max 3 retries with exponential backoff
 */
export function shouldRetry(progress: ReferralProgress, step: string): boolean {
  if (!progress.lastError || progress.lastError.step !== step) {
    return true;
  }

  if (progress.lastError.retryCount >= 3) {
    return false;
  }

  // Exponential backoff: 5s, 15s, 45s
  const backoffMs = Math.pow(3, progress.lastError.retryCount) * 5000;
  const timeSinceError = Date.now() - progress.lastError.timestamp;

  return timeSinceError >= backoffMs;
}

/**
 * Get the next step that needs to be completed
 */
export function getNextStep(progress: ReferralProgress): string | null {
  switch (progress.step) {
    case 'click_tracked':
      return progress.walletAddress ? 'register_conversion' : 'connect_wallet';
    case 'wallet_connected':
      return 'register_conversion';
    case 'conversion_registered':
      return progress.conversionResponse?.bonusDistributed ? null : 'verify_bonus';
    case 'bonus_distributed':
    case 'completed':
      return null;
    default:
      return 'track_click';
  }
}

/**
 * Check if the referral process is complete
 */
export function isComplete(progress: ReferralProgress | null): boolean {
  if (!progress) return false;
  return progress.step === 'completed' || progress.step === 'bonus_distributed';
}

/**
 * Check if user has an active referral in progress
 */
export function hasActiveReferral(): boolean {
  const progress = loadProgress();
  return progress !== null && !isComplete(progress);
}

/**
 * Get referral code from active progress
 */
export function getActiveReferralCode(): string | null {
  const progress = loadProgress();
  return progress?.referralCode || null;
}

/**
 * Export progress data for debugging
 */
export function debugProgress(): ReferralProgress | null {
  return loadProgress();
}
