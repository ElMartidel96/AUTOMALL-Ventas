'use client';

/**
 * 🔐 Social Verification Panel
 *
 * Allows users to verify their social accounts via OAuth
 * Supports Twitter/X, Discord, and Telegram
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Twitter,
  MessageCircle,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Shield,
  AlertCircle,
} from 'lucide-react';

type SocialPlatform = 'twitter' | 'discord' | 'telegram';

interface VerificationStatus {
  twitter: { verified: boolean; username: string | null; verifiedAt: string | null };
  discord: { verified: boolean; username: string | null; verifiedAt: string | null };
  telegram: { verified: boolean; username: string | null; verifiedAt: string | null };
}

interface SocialVerificationPanelProps {
  walletAddress: string;
  onVerificationComplete?: (platform: SocialPlatform, username: string) => void;
}

// Telegram Login Widget script
declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (
          options: { bot_id: string; request_access?: string },
          callback: (data: TelegramAuthData) => void
        ) => void;
      };
    };
  }
}

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function SocialVerificationPanel({
  walletAddress,
  onVerificationComplete,
}: SocialVerificationPanelProps) {
  const t = useTranslations('socialVerification');
  const tCommon = useTranslations('common');

  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingPlatform, setVerifyingPlatform] = useState<SocialPlatform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [telegramBotUsername, setTelegramBotUsername] = useState<string | null>(null);

  // Fetch verification status
  const fetchStatus = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`/api/auth/social?wallet=${walletAddress}`);
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle URL params for OAuth callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verification = params.get('verification');
    const platform = params.get('platform') as SocialPlatform | null;
    const message = params.get('message');
    const username = params.get('username');

    if (verification && platform) {
      if (verification === 'success' && username) {
        setError(null);
        onVerificationComplete?.(platform, username);
        // Refresh status
        fetchStatus();
      } else if (verification === 'error' && message) {
        setError(decodeURIComponent(message));
      }

      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('verification');
      url.searchParams.delete('platform');
      url.searchParams.delete('message');
      url.searchParams.delete('username');
      window.history.replaceState({}, '', url.toString());
    }
  }, [fetchStatus, onVerificationComplete]);

  // Initiate OAuth flow
  const initiateVerification = async (platform: SocialPlatform) => {
    setVerifyingPlatform(platform);
    setError(null);

    try {
      const response = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, walletAddress }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate verification');
      }

      if (data.type === 'redirect') {
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else if (data.type === 'widget' && platform === 'telegram') {
        // Store bot username for Telegram widget
        setTelegramBotUsername(data.botUsername);
        // Telegram uses a widget, trigger it
        handleTelegramLogin(data.botUsername);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setVerifyingPlatform(null);
    }
  };

  // Handle Telegram Login Widget
  const handleTelegramLogin = (botUsername: string) => {
    // Load Telegram widget script if not already loaded
    if (!document.getElementById('telegram-widget-script')) {
      const script = document.createElement('script');
      script.id = 'telegram-widget-script';
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        triggerTelegramAuth(botUsername);
      };
    } else {
      triggerTelegramAuth(botUsername);
    }
  };

  const triggerTelegramAuth = (botUsername: string) => {
    // Use Telegram Login Widget
    if (window.Telegram?.Login) {
      window.Telegram.Login.auth(
        { bot_id: botUsername, request_access: 'write' },
        async (data: TelegramAuthData) => {
          if (data) {
            try {
              const response = await fetch('/api/auth/social/callback/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, authData: data }),
              });

              const result = await response.json();

              if (result.success) {
                onVerificationComplete?.('telegram', result.data.username);
                fetchStatus();
              } else {
                setError(result.error || 'Telegram verification failed');
              }
            } catch (err) {
              setError('Failed to verify Telegram');
            }
          }
          setVerifyingPlatform(null);
        }
      );
    } else {
      // Fallback: open Telegram login in new window
      const width = 550;
      const height = 470;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;

      window.open(
        `https://oauth.telegram.org/auth?bot_id=${botUsername}&origin=${encodeURIComponent(window.location.origin)}&request_access=write`,
        'telegram_auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      setVerifyingPlatform(null);
    }
  };

  const platforms: {
    id: SocialPlatform;
    name: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }[] = [
    {
      id: 'twitter',
      name: 'Twitter / X',
      icon: Twitter,
      color: 'text-slate-900 dark:text-white',
      bgColor: 'bg-slate-100 dark:bg-slate-700',
      borderColor: 'border-slate-300 dark:border-slate-600',
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: MessageCircle,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: Send,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-900/20',
      borderColor: 'border-sky-200 dark:border-sky-800',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('title')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Platform cards */}
      <div className="space-y-3">
        {platforms.map((platform) => {
          const platformStatus = status?.[platform.id];
          const isVerified = platformStatus?.verified;
          const isVerifying = verifyingPlatform === platform.id;
          const Icon = platform.icon;

          return (
            <div
              key={platform.id}
              className={`p-4 rounded-xl border ${platform.borderColor} ${platform.bgColor} transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isVerified
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : platform.bgColor
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isVerified
                          ? 'text-green-600 dark:text-green-400'
                          : platform.color
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {platform.name}
                      </span>
                      {isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {isVerified && platformStatus?.username ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        @{platformStatus.username}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('notConnected')}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => initiateVerification(platform.id)}
                  disabled={isVerifying || isVerified}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    isVerified
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                      : isVerifying
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-wait'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('connecting')}
                    </>
                  ) : isVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {t('verified')}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      {t('connect')}
                    </>
                  )}
                </button>
              </div>

              {/* Verification info */}
              {isVerified && platformStatus?.verifiedAt && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 ml-15">
                  {t('verifiedOn')}{' '}
                  {new Date(platformStatus.verifiedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-400">
            <p className="font-medium mb-1">{t('whyVerify')}</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-500">
              <li>{t('benefit1')}</li>
              <li>{t('benefit2')}</li>
              <li>{t('benefit3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialVerificationPanel;
