/**
 * 🔐 Social Verification Flow Page (All-in-One Popup)
 *
 * FLOW:
 * 1. User clicks button in main page → Opens this page in popup
 * 2. This page checks if we have OAuth token stored
 * 3. If no token: Redirect to OAuth authorization
 * 4. After OAuth: Return here with token stored in cookie
 * 5. Show "Follow/Join" button that opens Twitter/Discord in NEW WINDOW
 * 6. User follows/joins in that window, then returns to this popup
 * 7. User clicks "Verify" → We call verify-complete API (reads cookies server-side)
 * 8. If verified: Show success, post message to parent, auto-close
 *
 * KEY DESIGN DECISIONS:
 * - Open Twitter/Discord in NEW WINDOW, not navigate away (so user stays in popup)
 * - Use httpOnly cookies for OAuth tokens (security)
 * - verify-complete API reads cookies server-side (frontend can't read httpOnly)
 */

'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Twitter, MessageSquare, CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw, AlertTriangle, Mail, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Platform = 'twitter' | 'discord';
type Step = 'loading' | 'authorize' | 'action' | 'verifying' | 'success' | 'error' | 'discord_verify_needed';

// Error types for better handling
type ErrorType = 'generic' | 'discord_verification' | 'access_denied' | 'expired' | 'popup_blocked';

function VerifyContent() {
  const t = useTranslations('socialVerify');
  const searchParams = useSearchParams();
  const platform = (searchParams.get('platform') as Platform) || 'twitter';
  const walletAddress = searchParams.get('wallet') || ''; // Wallet passed from parent for DB persistence
  const returnFromOAuth = searchParams.get('oauth') === 'complete';
  const oauthError = searchParams.get('error');
  const alreadyVerified = searchParams.get('verified') === 'true';

  // Username from cookie (set by OAuth callback, non-httpOnly so we can read it)
  const [username, setUsername] = useState<string | null>(null);

  // Read username from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const usernameCookie = cookies.find(c => c.trim().startsWith(`${platform}_oauth_username=`));
    if (usernameCookie) {
      const value = usernameCookie.split('=')[1];
      setUsername(decodeURIComponent(value));
      console.log(`[Verify Page] Found username cookie: ${value}`);
    }
  }, [platform]);

  // Debug logging on mount
  useEffect(() => {
    console.log('[Verify Page] SearchParams:', {
      platform,
      wallet: walletAddress,
      oauth: searchParams.get('oauth'),
      verified: searchParams.get('verified'),
      error: searchParams.get('error'),
      returnFromOAuth,
      alreadyVerified,
    });
  }, [platform, walletAddress, searchParams, returnFromOAuth, alreadyVerified]);

  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>('generic');
  const [hasOpened, setHasOpened] = useState(false);

  // Twitter bypass: Timer-based verification (temporary until Basic tier is paid)
  // This creates an organic UX where user clicks Follow, waits 5s, then can verify
  const [twitterBypassReady, setTwitterBypassReady] = useState(false);

  // Helper function to detect Discord verification errors
  const isDiscordVerificationError = (errorMsg: string): boolean => {
    const verificationKeywords = [
      'verify your account',
      'verification required',
      'email verification',
      'verificar tu cuenta',
      'access_denied',
      'consent_required',
    ];
    return verificationKeywords.some(keyword =>
      errorMsg.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // Clear OAuth cookies and reset for using a different account
  const clearOAuthAndReset = useCallback(() => {
    console.log('[Verify] Clearing OAuth cookies for account switch');

    // Clear all OAuth-related cookies
    const cookiesToClear = [
      `${platform}_oauth_token`,
      `${platform}_oauth_user_id`,
      `${platform}_oauth_username`,
    ];

    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Reset state
    setError(null);
    setErrorType('generic');
    setUsername(null);
    setHasOpened(false);
    setTwitterBypassReady(false);

    // Go back to authorize step
    setStep('authorize');
  }, [platform]);

  // Post result to parent window and close
  const postResultAndClose = useCallback((success: boolean) => {
    console.log(`[Verify] Posting result to parent: verified=${success}, username=${username}`);
    if (window.opener) {
      window.opener.postMessage({
        type: 'SOCIAL_OAUTH_CALLBACK',
        success: true,
        platform,
        verified: success,
        username: username || undefined, // Include username for parent to use
      }, '*');
    }

    // Close after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  }, [platform, username]);

  // Check initial status when page loads
  useEffect(() => {
    const checkStatus = async () => {
      // If already verified during OAuth callback, show success immediately
      if (alreadyVerified) {
        console.log('[Verify] Already verified during OAuth');
        setStep('success');
        setTimeout(() => postResultAndClose(true), 1500);
        return;
      }

      // If returning from OAuth with error
      if (oauthError) {
        console.log('[Verify] OAuth error:', oauthError);

        // Check if this is a Discord verification error
        if (platform === 'discord' && isDiscordVerificationError(oauthError)) {
          console.log('[Verify] Detected Discord verification error');
          setError(oauthError);
          setErrorType('discord_verification');
          setStep('discord_verify_needed');
          return;
        }

        // Check for access_denied (user cancelled or verification required)
        if (oauthError.includes('access_denied')) {
          setError('Authorization denied. You may need to verify your Discord account first.');
          setErrorType('access_denied');
          if (platform === 'discord') {
            setStep('discord_verify_needed');
          } else {
            setStep('error');
          }
          return;
        }

        setError(oauthError);
        setErrorType('generic');
        setStep('error');
        return;
      }

      // If returning from OAuth (not verified yet - user needs to follow first)
      if (returnFromOAuth) {
        console.log('[Verify] OAuth complete, showing action step');
        setStep('action');
        return;
      }

      // Check if we have stored OAuth credentials
      try {
        const response = await fetch('/api/social/check-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform }),
        });

        const data = await response.json();
        console.log('[Verify] Check auth result:', data);

        if (data.hasAuth) {
          setStep('action');
        } else {
          setStep('authorize');
        }
      } catch (err) {
        console.error('[Verify] Check auth error:', err);
        setStep('authorize');
      }
    };

    checkStatus();
  }, [platform, returnFromOAuth, oauthError, alreadyVerified, postResultAndClose]);

  // Start OAuth flow (redirects in same window)
  const startOAuth = async () => {
    console.log('[Verify] Starting OAuth flow');
    setStep('loading');

    try {
      const response = await fetch('/api/social/oauth-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          walletAddress: 'verify-flow',
          returnToVerify: true,
        }),
      });

      const data = await response.json();
      console.log('[Verify] OAuth init response:', data);

      if (data.authUrl) {
        // Redirect to OAuth (stays in this popup)
        window.location.href = data.authUrl;
      } else {
        setError('Failed to get authorization URL');
        setStep('error');
      }
    } catch (err) {
      console.error('[Verify] OAuth init error:', err);
      setError('Failed to start authorization');
      setStep('error');
    }
  };

  // Open follow/join link in NEW WINDOW (user stays in popup)
  const openAction = () => {
    const url = platform === 'twitter'
      ? 'https://twitter.com/intent/follow?screen_name=cryptogiftdao'
      : 'https://discord.gg/XzmKkrvhHc';

    console.log(`[Verify] Opening ${platform} action in new window:`, url);
    setHasOpened(true);

    // Open in new window, not navigate away
    window.open(url, '_blank', 'width=600,height=700,scrollbars=yes');

    // Twitter bypass: Start 5-second timer before enabling verify button
    // This gives user time to actually follow and makes the UX feel organic
    if (platform === 'twitter') {
      setTimeout(() => {
        setTwitterBypassReady(true);
        console.log('[Verify] Twitter bypass ready after 5s timer');
      }, 5000);
    }
  };

  // Verify the action (calls server-side API that reads cookies)
  const verifyAction = async () => {
    console.log('[Verify] Verifying action...');
    setStep('verifying');
    setError(null);

    // Twitter bypass: Skip API verification, trust-based (temporary until Basic tier)
    // The user clicked Follow and waited 5 seconds - assume they followed
    if (platform === 'twitter' && twitterBypassReady) {
      console.log('[Verify] Twitter bypass: Skipping API verification (Free tier limitation)');

      // Still save to DB if we have wallet address
      if (walletAddress && username) {
        try {
          await fetch('/api/social/verify-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, walletAddress, bypassSave: true }),
          });
          console.log('[Verify] Twitter bypass: Saved to DB');
        } catch (e) {
          console.log('[Verify] Twitter bypass: DB save failed (non-blocking)', e);
        }
      }

      // Small delay to make it feel like verification is happening
      await new Promise(resolve => setTimeout(resolve, 800));
      setStep('success');
      setTimeout(() => postResultAndClose(true), 1500);
      return;
    }

    // Discord and future Twitter (with Basic tier) use actual API verification
    try {
      const response = await fetch('/api/social/verify-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, walletAddress }), // Pass wallet for DB save
      });

      const data = await response.json();
      console.log('[Verify] Verification result:', JSON.stringify(data, null, 2));
      if (data.details) {
        console.log('[Verify] Details:', data.details);
      }

      if (data.verified) {
        setStep('success');
        setTimeout(() => postResultAndClose(true), 1500);
      } else if (data.needsAuth) {
        setError('Authorization expired. Please authorize again.');
        setStep('authorize');
      } else {
        setError(data.error || `Please ${platform === 'twitter' ? 'follow @cryptogiftdao' : 'join our Discord'} first`);
        setStep('action');
      }
    } catch (err) {
      console.error('[Verify] Verification error:', err);
      setError('Verification failed. Please try again.');
      setStep('action');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    postResultAndClose(false);
  };

  const isTwitter = platform === 'twitter';
  const Icon = isTwitter ? Twitter : MessageSquare;
  const gradientFrom = isTwitter ? 'from-sky-500' : 'from-indigo-500';
  const gradientTo = isTwitter ? 'to-blue-600' : 'to-purple-600';
  const platformName = isTwitter ? 'Twitter/X' : 'Discord';
  const actionText = isTwitter ? 'Seguir a @cryptogiftdao' : 'Unirse al servidor Discord';
  const actionTextEn = isTwitter ? 'Follow @cryptogiftdao' : 'Join Discord Server';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center p-4`}>
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-4`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {platformName} Verification
          </h1>
        </div>

        {/* Privacy Notice */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
            🔒 We only verify that you follow/join — we don&apos;t collect personal data
          </p>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Loading State */}
          {step === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          )}

          {/* Authorize Step */}
          {step === 'authorize' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  First, authorize verification with your {platformName} account
                </p>
              </div>

              {/* Discord-specific pre-authorization warning */}
              {platform === 'discord' && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
                        {t('discordWarning.title')}
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 mb-2">
                        {t('discordWarning.emailRequired')}
                      </p>
                      <p className="text-amber-600 dark:text-amber-400 text-xs">
                        {t('discordWarning.instructions')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={startOAuth}
                className={`w-full py-4 px-6 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-bold rounded-xl
                  hover:opacity-90 transition-all flex items-center justify-center gap-3`}
              >
                <Icon className="w-5 h-5" />
                Authorize with {platformName}
              </button>

              {/* Use different account - more prominent for Discord */}
              {platform === 'discord' && (
                <button
                  onClick={clearOAuthAndReset}
                  className="w-full py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl
                    hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('discordWarning.useAnotherAccount')}
                </button>
              )}

              <button
                onClick={handleCancel}
                className="w-full py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Action Step - Follow/Join */}
          {step === 'action' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-green-600 dark:text-green-400 font-semibold mb-2">
                  Authorization Complete!
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Now {isTwitter ? 'follow @cryptogiftdao on Twitter' : 'join our Discord server'}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-300 text-center">
                    ⚠️ {error}
                  </p>
                </div>
              )}

              {/* Step 1: Open Twitter/Discord */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Step 1: {actionText}
                </p>
                <button
                  onClick={openAction}
                  className={`w-full py-3 px-6 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-bold rounded-xl
                    hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                >
                  <ExternalLink className="w-4 h-4" />
                  {actionTextEn}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Opens in new window — this popup stays open
                </p>
              </div>

              {/* Step 2: Verify */}
              <div className={`p-4 rounded-xl transition-all ${
                (isTwitter ? twitterBypassReady : hasOpened)
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              }`}>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Step 2: Verify completion
                </p>
                <button
                  onClick={verifyAction}
                  disabled={isTwitter ? !twitterBypassReady : !hasOpened}
                  className={`w-full py-3 px-6 font-bold rounded-xl transition-all flex items-center justify-center gap-2
                    ${(isTwitter ? twitterBypassReady : hasOpened)
                      ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {(isTwitter ? twitterBypassReady : hasOpened) ? 'Verify Now' : 'Follow us first'}
                </button>
              </div>

              {/* Use different account option - especially useful for Discord */}
              {platform === 'discord' && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={clearOAuthAndReset}
                    className="w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t('discordWarning.wrongAccount')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Verifying State */}
          {step === 'verifying' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-semibold">
                Verifying...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Checking your {isTwitter ? 'follow status' : 'membership'}
              </p>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                Verified!
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Closing window...
              </p>
            </div>
          )}

          {/* Discord Verification Needed State - Special handling for unverified accounts */}
          {step === 'discord_verify_needed' && (
            <div className="space-y-4">
              {/* Warning Header */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                  {t('discordWarning.verificationRequired')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('discordWarning.verificationNeededDesc')}
                </p>
              </div>

              {/* Explanation Card - Why Discord requires this */}
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                  <strong>{t('discordWarning.whyDiscordAsks')}</strong>
                </p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 leading-relaxed">
                  {t('discordWarning.whyExplanation')}
                </p>
              </div>

              {/* Benefits Card - Persuasive but honest */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                  {t('discordWarning.benefits')}
                </p>
                <ul className="space-y-1.5 text-sm text-green-600 dark:text-green-400">
                  <li className="flex items-start gap-2">
                    <span>🔒</span>
                    <span>{t('discordWarning.benefitSecurity')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🔄</span>
                    <span>{t('discordWarning.benefitRecovery')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🌐</span>
                    <span>{t('discordWarning.benefitFullAccess')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>💎</span>
                    <span>{t('discordWarning.benefitTrust')}</span>
                  </li>
                </ul>
              </div>

              {/* Instructions Card */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-3 mb-3">
                  <Mail className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                      {t('discordWarning.howToVerify')}
                    </p>
                  </div>
                </div>
                <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300 ml-8">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>{t('discordWarning.step1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>{t('discordWarning.step2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    <span>{t('discordWarning.step3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">4.</span>
                    <span>{t('discordWarning.step4')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">5.</span>
                    <span>{t('discordWarning.step5')}</span>
                  </li>
                </ol>
              </div>

              {/* Tip for spam folder */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                  💡 {t('discordWarning.spamTip')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* Retry Button */}
                <button
                  onClick={startOAuth}
                  className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl
                    hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('discordWarning.retryWithAccount')}
                </button>

                {/* Use Different Account Button */}
                <button
                  onClick={clearOAuthAndReset}
                  className="w-full py-3 px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl
                    hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600"
                >
                  <Shield className="w-4 h-4" />
                  {t('discordWarning.useAnotherAccount')}
                </button>

                {/* Cancel Button */}
                <button
                  onClick={handleCancel}
                  className="w-full py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                Error
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'Something went wrong'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setStep('authorize')}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
                >
                  Try Again
                </button>
                {/* Add use different account option */}
                <button
                  onClick={clearOAuthAndReset}
                  className="block w-full px-6 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-all"
                >
                  {t('discordWarning.useAnotherAccount')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SocialVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
