/**
 * 🤝 REFERRAL TRACKER PROVIDER - V2.0 (Zero Friction Edition)
 *
 * Automatic referral tracking for CryptoGift DAO.
 * Now with ROBUST STATE PERSISTENCE - user progress is NEVER lost!
 *
 * Features:
 * - ✅ Detects ?ref= parameter on page load
 * - ✅ Tracks click via API
 * - ✅ Stores progress in localStorage (survives refresh, browser close)
 * - ✅ Automatically resumes from last step after any interruption
 * - ✅ Registers conversion when wallet connects
 * - ✅ Idempotent operations (safe to retry)
 * - ✅ Error recovery with exponential backoff
 *
 * @version 2.0.0 - Zero Friction Edition
 */

'use client';

import { useEffect, useRef, useCallback, useState, Suspense } from 'react';
import { useAccount } from '@/lib/thirdweb';
import { useSearchParams } from 'next/navigation';
import {
  loadProgress,
  saveProgress,
  clearProgress,
  initializeProgress,
  updateClickTracked,
  updateWalletConnected,
  updateConversionRegistered,
  markCompleted,
  recordError,
  shouldRetry,
  getNextStep,
  isComplete,
  type ReferralProgress,
} from '@/lib/referrals/referral-persistence';

// Cookie utilities (for API compatibility)
const REFERRAL_CODE_COOKIE = 'cgdao_ref_code';
const REFERRAL_TRACKED_COOKIE = 'cgdao_ref_tracked';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

// Referral code validation
function isValidReferralCode(code: string): boolean {
  // CG-XXXXXX format or custom alphanumeric 4-20 chars
  return /^CG-[A-F0-9]{6}$/i.test(code) || /^[A-Za-z0-9]{4,20}$/.test(code);
}

interface ReferralTrackerProps {
  children: React.ReactNode;
}

/**
 * Internal tracker component that uses searchParams
 */
function ReferralTrackerInner() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();

  // Use state instead of refs for persistence awareness
  const [progress, setProgress] = useState<ReferralProgress | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for preventing duplicate operations in same render cycle
  const isProcessing = useRef(false);
  const previousAddress = useRef<string | undefined>(undefined);

  // Initialize: Load saved progress on mount
  useEffect(() => {
    const savedProgress = loadProgress();
    if (savedProgress) {
      console.log('[ReferralTracker] Resuming progress from:', savedProgress.step);
      setProgress(savedProgress);

      // Also ensure cookies are in sync
      if (savedProgress.referralCode) {
        setCookie(REFERRAL_CODE_COOKIE, savedProgress.referralCode, COOKIE_MAX_AGE);
        setCookie(REFERRAL_TRACKED_COOKIE, 'true', COOKIE_MAX_AGE);
      }
    }
    setIsInitialized(true);
  }, []);

  // Track referral click when page loads with ?ref= parameter
  const trackReferralClick = useCallback(async (code: string) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      // Initialize progress before API call
      let currentProgress = initializeProgress(code, {
        utmSource: searchParams.get('utm_source') || undefined,
        utmMedium: searchParams.get('utm_medium') || undefined,
        utmCampaign: searchParams.get('utm_campaign') || undefined,
        landingPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
      });
      setProgress(currentProgress);

      // Set cookies for API compatibility
      setCookie(REFERRAL_CODE_COOKIE, code, COOKIE_MAX_AGE);
      setCookie(REFERRAL_TRACKED_COOKIE, 'true', COOKIE_MAX_AGE);

      const response = await fetch('/api/referrals/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          source: searchParams.get('utm_source') || 'direct',
          medium: searchParams.get('utm_medium') || null,
          campaign: searchParams.get('utm_campaign') || null,
          referer: typeof document !== 'undefined' ? document.referrer : null,
          landingPage: typeof window !== 'undefined' ? window.location.pathname : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        currentProgress = updateClickTracked(currentProgress, {
          tracked: true,
          ipHash: data.data?.ipHash,
        });
        setProgress(currentProgress);
        console.log('[ReferralTracker] Click tracked and saved for code:', code);
      } else {
        // Record error but don't fail - progress is still saved
        currentProgress = recordError(currentProgress, 'track_click', 'API returned error');
        setProgress(currentProgress);
        console.warn('[ReferralTracker] API error, progress saved for retry');
      }
    } catch (error) {
      console.error('[ReferralTracker] Failed to track click:', error);
      // Progress is still saved in localStorage, can retry later
    } finally {
      isProcessing.current = false;
    }
  }, [searchParams]);

  // Register conversion when wallet connects
  const registerConversion = useCallback(async (walletAddress: string, currentProgress: ReferralProgress) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      // Update progress with wallet address
      let updatedProgress = updateWalletConnected(currentProgress, walletAddress);
      setProgress(updatedProgress);

      // Check if we should retry (exponential backoff)
      if (!shouldRetry(updatedProgress, 'register_conversion')) {
        console.log('[ReferralTracker] Waiting for backoff before retry');
        isProcessing.current = false;
        return;
      }

      // IDEMPOTENCY CHECK: First verify if user is already registered
      try {
        const statusResponse = await fetch(`/api/referrals/status?wallet=${walletAddress}`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.data?.isReferred) {
            console.log('[ReferralTracker] User already has referrer, skipping registration');
            // Clear progress since user is already registered
            clearProgress();
            setProgress(null);
            deleteCookie(REFERRAL_CODE_COOKIE);
            deleteCookie(REFERRAL_TRACKED_COOKIE);
            isProcessing.current = false;
            return;
          }
        }
      } catch (statusError) {
        // If status check fails, continue with registration (backend will handle duplicates)
        console.warn('[ReferralTracker] Status check failed, continuing with registration');
      }

      const response = await fetch('/api/referrals/track', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          code: updatedProgress.referralCode,
          source: updatedProgress.utmSource || 'direct',
          campaign: updatedProgress.utmCampaign || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const registered = data.data?.registered === true;
        const bonusDistributed = data.data?.bonus?.distributed === true;

        updatedProgress = updateConversionRegistered(updatedProgress, {
          registered,
          referrer: data.data?.referrer,
          level: data.data?.level,
          bonusDistributed,
          totalAmount: data.data?.bonus?.totalAmount,
        });
        setProgress(updatedProgress);

        if (registered) {
          console.log('[ReferralTracker] Conversion registered! Referrer:', data.data?.referrer);

          // Mark as completed
          if (bonusDistributed) {
            updatedProgress = markCompleted(updatedProgress);
            setProgress(updatedProgress);
            console.log('[ReferralTracker] Bonus distributed, flow complete!');
          }

          // Clear cookies after successful registration
          deleteCookie(REFERRAL_CODE_COOKIE);
          deleteCookie(REFERRAL_TRACKED_COOKIE);
        } else {
          console.log('[ReferralTracker]', data.data?.message || 'Already registered or invalid code');
          // Clear progress if user is already registered
          clearProgress();
          setProgress(null);
        }
      } else {
        // Record error for retry
        updatedProgress = recordError(updatedProgress, 'register_conversion', data.error || 'API error');
        setProgress(updatedProgress);
        console.error('[ReferralTracker] Registration error, will retry');
      }
    } catch (error) {
      console.error('[ReferralTracker] Failed to register conversion:', error);
      // Progress is saved, can retry on next page load
      if (progress) {
        const errorProgress = recordError(progress, 'register_conversion', String(error));
        setProgress(errorProgress);
      }
    } finally {
      isProcessing.current = false;
    }
  }, [progress]);

  // Effect 1: Handle URL parameter on initial load
  useEffect(() => {
    if (!isInitialized) return;

    const refCode = searchParams.get('ref');

    // Case 1: URL has referral code
    if (refCode && isValidReferralCode(refCode)) {
      // Check if we already have progress for this code
      if (progress?.referralCode === refCode) {
        console.log('[ReferralTracker] Progress exists for this code, continuing...');
        return;
      }

      // Check if we have progress for a different code - keep the original
      if (progress && progress.referralCode !== refCode && !isComplete(progress)) {
        console.log('[ReferralTracker] User has existing progress for different code, keeping original');
        return;
      }

      // Start new tracking
      console.log('[ReferralTracker] New referral code detected:', refCode);
      trackReferralClick(refCode);
      return;
    }

    // Case 2: No URL parameter but we have saved progress
    if (progress && !isComplete(progress)) {
      console.log('[ReferralTracker] Restored saved progress for code:', progress.referralCode);
      // Ensure cookies are in sync
      setCookie(REFERRAL_CODE_COOKIE, progress.referralCode, COOKIE_MAX_AGE);
      setCookie(REFERRAL_TRACKED_COOKIE, 'true', COOKIE_MAX_AGE);
    }
  }, [isInitialized, searchParams, progress, trackReferralClick]);

  // Effect 2: Register conversion when wallet connects
  useEffect(() => {
    if (!isInitialized || !address || !isConnected) return;

    // Check if this is a new wallet connection
    if (previousAddress.current === address) {
      return;
    }
    previousAddress.current = address;

    // Check if we have progress to convert
    if (!progress) {
      // Try to load from storage one more time
      const savedProgress = loadProgress();
      if (savedProgress && !isComplete(savedProgress)) {
        setProgress(savedProgress);
        console.log('[ReferralTracker] Loaded progress for conversion');
        registerConversion(address, savedProgress);
      }
      return;
    }

    // Skip if already completed
    if (isComplete(progress)) {
      console.log('[ReferralTracker] Referral flow already completed');
      return;
    }

    // Skip if wallet already registered for this progress
    if (progress.walletAddress === address && progress.step === 'conversion_registered') {
      console.log('[ReferralTracker] Already registered this wallet');
      return;
    }

    // Register the conversion
    const nextStep = getNextStep(progress);
    if (nextStep === 'connect_wallet' || nextStep === 'register_conversion') {
      console.log('[ReferralTracker] Wallet connected, registering conversion...');
      registerConversion(address, progress);
    }
  }, [isInitialized, address, isConnected, progress, registerConversion]);

  // Effect 3: Retry failed operations on interval
  useEffect(() => {
    if (!progress || isComplete(progress) || !progress.lastError) return;

    const retryInterval = setInterval(() => {
      if (isProcessing.current) return;

      const nextStep = getNextStep(progress);
      if (nextStep === 'register_conversion' && address && shouldRetry(progress, 'register_conversion')) {
        console.log('[ReferralTracker] Retrying conversion registration...');
        registerConversion(address, progress);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(retryInterval);
  }, [progress, address, registerConversion]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Main ReferralTracker component with Suspense boundary
 * Safe to use in app layout
 */
export function ReferralTracker({ children }: ReferralTrackerProps) {
  return (
    <>
      <Suspense fallback={null}>
        <ReferralTrackerInner />
      </Suspense>
      {children}
    </>
  );
}

/**
 * Hook to manually check referral status
 * Use this if you need to know if user came from a referral link
 */
export function useReferralInfo() {
  const [progress, setProgress] = useState<ReferralProgress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const getReferralCode = useCallback(() => {
    return progress?.referralCode || getCookie(REFERRAL_CODE_COOKIE);
  }, [progress]);

  const wasReferred = useCallback(() => {
    return !!progress?.referralCode || !!getCookie(REFERRAL_CODE_COOKIE);
  }, [progress]);

  const getProgress = useCallback(() => {
    return progress;
  }, [progress]);

  const clearReferralData = useCallback(() => {
    clearProgress();
    deleteCookie(REFERRAL_CODE_COOKIE);
    deleteCookie(REFERRAL_TRACKED_COOKIE);
    setProgress(null);
  }, []);

  const isReferralComplete = useCallback(() => {
    return isComplete(progress);
  }, [progress]);

  return {
    getReferralCode,
    wasReferred,
    getProgress,
    clearReferralData,
    isReferralComplete,
    progress,
  };
}
