'use client';

/**
 * 🎯 Social Engagement Modal
 *
 * Shows after successful OAuth verification to encourage users to follow/join
 * and earn 100 CGC bonus
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';
import { SOCIAL_ENGAGEMENT_CONFIG, SocialEngagementPlatform } from '@/lib/supabase/types';

// Custom SVG Icons
const TwitterXIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

interface SocialEngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: SocialEngagementPlatform;
  walletAddress: string;
  username?: string;
}

type ModalStep = 'initial' | 'redirecting' | 'confirm' | 'claiming' | 'success' | 'already_claimed';

export function SocialEngagementModal({
  isOpen,
  onClose,
  platform,
  walletAddress,
  username,
}: SocialEngagementModalProps) {
  const t = useTranslations('socialEngagement');
  const [step, setStep] = useState<ModalStep>('initial');
  const [error, setError] = useState<string | null>(null);

  const config = SOCIAL_ENGAGEMENT_CONFIG[platform];
  const isTwitter = platform === 'twitter';
  const Icon = isTwitter ? TwitterXIcon : DiscordIcon;
  const platformName = isTwitter ? 'Twitter/X' : 'Discord';
  const actionVerb = isTwitter ? t('follow') : t('join');

  useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setError(null);
    }
  }, [isOpen]);

  const handleOpenLink = async () => {
    setStep('redirecting');

    // Record click
    try {
      await fetch('/api/social/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          platform,
          action: 'click',
        }),
      });
    } catch {
      // Ignore click tracking errors
    }

    // Open in new tab
    const url = isTwitter
      ? SOCIAL_ENGAGEMENT_CONFIG.twitter.followUrl
      : SOCIAL_ENGAGEMENT_CONFIG.discord.joinUrl;
    window.open(url, '_blank', 'noopener,noreferrer');

    // After short delay, show confirm step
    setTimeout(() => {
      setStep('confirm');
    }, 1500);
  };

  const handleClaimReward = async () => {
    setStep('claiming');
    setError(null);

    try {
      const response = await fetch('/api/social/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          platform,
          action: 'claim',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
      } else if (data.alreadyClaimed) {
        setStep('already_claimed');
      } else {
        setError(data.error || t('claimError'));
        setStep('confirm');
      }
    } catch {
      setError(t('networkError'));
      setStep('confirm');
    }
  };

  const handleClose = () => {
    setStep('initial');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-6 pb-8">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-300" />
                </button>

                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isTwitter ? 'bg-sky-500/20' : 'bg-indigo-500/20'}`}>
                    <Icon className={`w-8 h-8 ${isTwitter ? 'text-sky-400' : 'text-indigo-400'}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {t('title', { platform: platformName })}
                    </h2>
                    {username && (
                      <p className="text-slate-300 text-sm">
                        {t('connectedAs', { username: `@${username}` })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Initial Step */}
                {step === 'initial' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Reward Badge */}
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full">
                        <Gift className="w-5 h-5 text-amber-400" />
                        <span className="text-lg font-bold text-amber-400">
                          +{config.rewardAmount} CGC
                        </span>
                      </div>
                    </div>

                    <p className="text-center text-slate-300">
                      {t('earnReward', { action: actionVerb, platform: platformName, amount: config.rewardAmount })}
                    </p>

                    <button
                      onClick={handleOpenLink}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] ${
                        isTwitter
                          ? 'bg-sky-500 hover:bg-sky-600'
                          : 'bg-indigo-500 hover:bg-indigo-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {isTwitter ? t('followButton') : t('joinButton')}
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <p className="text-center text-xs text-slate-500">
                      {t('termsNote')}
                    </p>
                  </motion.div>
                )}

                {/* Redirecting Step */}
                {step === 'redirecting' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 space-y-4"
                  >
                    <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                    <p className="text-slate-300">{t('opening', { platform: platformName })}</p>
                  </motion.div>
                )}

                {/* Confirm Step */}
                {step === 'confirm' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <p className="text-lg text-white mb-2">
                        {isTwitter ? t('didYouFollow') : t('didYouJoin')}
                      </p>
                      <p className="text-sm text-slate-400">
                        {t('confirmToEarn', { amount: config.rewardAmount })}
                      </p>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleOpenLink}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-colors"
                      >
                        {t('tryAgain')}
                      </button>
                      <button
                        onClick={handleClaimReward}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
                      >
                        {t('claimReward')}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Claiming Step */}
                {step === 'claiming' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 space-y-4"
                  >
                    <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                    <p className="text-slate-300">{t('claimingReward')}</p>
                  </motion.div>
                )}

                {/* Success Step */}
                {step === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-6"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {t('congratulations')}
                      </h3>
                      <p className="text-slate-300">
                        {t('rewardEarned', { amount: config.rewardAmount })}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/20 border border-amber-500/30 rounded-full">
                      <Gift className="w-6 h-6 text-amber-400" />
                      <span className="text-2xl font-bold text-amber-400">
                        +{config.rewardAmount} CGC
                      </span>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                    >
                      {t('done')}
                    </button>
                  </motion.div>
                )}

                {/* Already Claimed Step */}
                {step === 'already_claimed' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6 space-y-6"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700">
                      <CheckCircle className="w-10 h-10 text-slate-400" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {t('alreadyClaimed')}
                      </h3>
                      <p className="text-slate-400">
                        {t('alreadyClaimedMessage', { platform: platformName })}
                      </p>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                    >
                      {t('done')}
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SocialEngagementModal;
