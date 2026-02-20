'use client';

/**
 * ProfileFullCard - Level 4 of ProfileCard system (Full Modal)
 *
 * Main destination of the profile flow:
 * - Owner flow: L1 → L2 → L4
 * - Receiver flow (shared link): L3 → L4
 *
 * Complete profile view with:
 * - Header with gradient
 * - Large avatar (120px)
 * - Name, tier badge
 * - Stats grid (Reputation, Respect, Tasks, Contributions)
 * - About section
 * - Social Networks with SocialSlot pattern + ShareButton
 * - Send Message button
 * - Copy wallet address
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { useProfileCard } from './ProfileCardProvider';
import { VideoAvatar } from '@/components/apex/VideoAvatar';
import {
  X,
  Copy,
  Check,
  Trophy,
  Star,
  Zap,
  MessageCircle,
  TrendingUp,
  Target,
  ExternalLink,
} from 'lucide-react';
import { ShareButton } from './ShareButton';

// =====================================================
// SOCIAL SLOT COMPONENT
// =====================================================

const SocialIcons = {
  twitter: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: '#000000',
    darkColor: '#ffffff',
    name: 'X',
    urlBuilder: (handle: string) => `https://x.com/${handle}`,
  },
  telegram: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#26A5E4',
    darkColor: '#26A5E4',
    name: 'Telegram',
    urlBuilder: (handle: string) => `https://t.me/${handle}`,
  },
  discord: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
      </svg>
    ),
    color: '#5865F2',
    darkColor: '#5865F2',
    name: 'Discord',
    urlBuilder: () => 'https://discord.gg/XzmKkrvhHc', // Community Discord
  },
  website: {
    icon: <ExternalLink className="w-5 h-5" />,
    color: '#6366F1',
    darkColor: '#818CF8',
    name: 'Website',
    urlBuilder: (url: string) => url,
  },
};

type SocialKey = keyof typeof SocialIcons;

interface SocialSlotProps {
  network: SocialKey;
  handle?: string | null;
  t: ReturnType<typeof useTranslations>;
}

function SocialSlot({ network, handle, t }: SocialSlotProps) {
  const social = SocialIcons[network];
  const isLinked = !!handle;
  const url = isLinked ? social.urlBuilder(handle!) : undefined;

  const slot = (
    <div
      className={`
        relative w-10 h-10 rounded-lg
        border-2 transition-all duration-300
        flex items-center justify-center
        ${isLinked
          ? 'border-transparent bg-opacity-20 shadow-lg'
          : 'border-gray-300 dark:border-gray-600 bg-transparent opacity-40'
        }
      `}
      style={isLinked ? {
        backgroundColor: `${social.color}15`,
        boxShadow: `0 0 20px ${social.color}40, inset 0 0 10px ${social.color}20`,
        borderColor: social.color,
      } : {}}
    >
      <div
        className={`transition-colors duration-300 ${isLinked ? '' : 'text-gray-400 dark:text-gray-500'}`}
        style={isLinked ? { color: social.color } : {}}
      >
        {social.icon}
      </div>
      {isLinked && (
        <div
          className="absolute inset-0 rounded-lg opacity-30 blur-sm -z-10"
          style={{ backgroundColor: social.color }}
        />
      )}
    </div>
  );

  if (isLinked && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform"
        title={social.name}
      >
        {slot}
      </a>
    );
  }

  return <div title={`${social.name} ${t('notLinked')}`}>{slot}</div>;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function ProfileFullCard() {
  const { profile, currentLevel, closeLevel, isOwnProfile, thumbnailRef, isStandalone } = useProfileCard();
  const t = useTranslations('profile');

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key - only in non-standalone mode
  // In standalone mode, user must click close button
  useEffect(() => {
    if (isStandalone) return;
    if (currentLevel !== 4) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLevel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isStandalone, currentLevel, closeLevel]);

  // Handle click outside - only in non-standalone mode
  // In standalone mode, card stays open until user clicks close button
  useEffect(() => {
    if (isStandalone) return;
    if (currentLevel !== 4) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const modalEl = document.getElementById('profile-full-card');
      const thumbnailEl = thumbnailRef.current;

      if (
        modalEl &&
        !modalEl.contains(target) &&
        thumbnailEl &&
        !thumbnailEl.contains(target)
      ) {
        closeLevel();
      }
    };

    // Delay to prevent immediate close from the opening click
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isStandalone, currentLevel, closeLevel, thumbnailRef]);

  // NOTE: No backdrop, no body scroll lock - page stays interactive

  if (!mounted || currentLevel !== 4 || !profile) return null;

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(profile.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortWallet = `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`;

  // Message URL (Twitter DM or Discord)
  const messageUrl = profile.twitter_handle
    ? `https://x.com/messages/compose?recipient_id=${profile.twitter_handle}`
    : 'https://discord.gg/XzmKkrvhHc';

  const modalContent = (
    // No backdrop - page stays fully interactive
    <div
      id="profile-full-card"
      className="fixed z-[99999] top-20 right-0 w-[420px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 animate-expandIn origin-top-right"
    >

        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-purple-600/10 via-indigo-600/10 to-cyan-600/10 dark:from-purple-600/20 dark:via-indigo-600/20 dark:to-cyan-600/20 p-6 pb-4">
          {/* Close Button */}
          <button
            onClick={closeLevel}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Avatar */}
          <div className="relative mx-auto mb-4" style={{ width: 120, height: 120 }}>
            <VideoAvatar
              imageSrc={profile.avatar_url || undefined}
              alt={profile.display_name || 'Profile'}
              size="xl"
              enableSound
              className="!w-[120px] !h-[120px]"
            />
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white">
            {profile.display_name || profile.username || shortWallet}
          </h3>

          {/* Username if different from display name */}
          {profile.username && profile.display_name && profile.username !== profile.display_name && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-2">
              @{profile.username}
            </p>
          )}

          {/* Tier Badge */}
          <div className="flex justify-center mt-2">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
              style={{
                backgroundColor: `${profile.tier_color}20`,
                borderColor: `${profile.tier_color}30`,
              }}
            >
              <Trophy className="w-4 h-4" style={{ color: profile.tier_color }} />
              <span className="text-sm font-bold" style={{ color: profile.tier_color }}>
                {profile.tier}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-200/50 dark:border-slate-700/50">
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <Star className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {profile.reputation_score}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {t('stats.reputation')}
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-purple-500/10">
            <Zap className="w-4 h-4 mx-auto mb-1 text-purple-500" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {profile.total_referrals}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {t('stats.referrals')}
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <Target className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {profile.total_tasks_completed}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {t('stats.tasks')}
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-cyan-500/10">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {profile.total_cgc_earned}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {t('stats.earned')}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* About */}
          {profile.bio && (
            <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {t('about')}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Social Networks */}
          <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t('networks')}
            </h4>
            <div className="flex flex-wrap justify-center gap-3">
              <SocialSlot network="twitter" handle={profile.twitter_handle} t={t} />
              <SocialSlot network="telegram" handle={profile.telegram_handle} t={t} />
              <SocialSlot network="discord" handle={profile.discord_handle} t={t} />
              <SocialSlot network="website" handle={profile.website_url} t={t} />
              {/* Share Profile Button - Copy link + QR + NFC */}
              <ShareButton walletAddress={profile.wallet_address} />
            </div>
          </div>

          {/* Send Message Button (only for other profiles) */}
          {!isOwnProfile && (
            <a
              href={messageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium transition-all hover:shadow-lg hover:shadow-purple-500/25"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t('sendMessage')}</span>
            </a>
          )}

          {/* Wallet - Copyable */}
          <button
            onClick={handleCopyWallet}
            className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors group/wallet"
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('wallet')}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                {shortWallet}
              </span>
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400 group-hover/wallet:text-gray-600 dark:group-hover/wallet:text-gray-300" />
              )}
            </div>
          </button>

          <button
            onClick={closeLevel}
            className="w-full rounded-full border border-gray-200/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-800/80 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200/50 dark:border-slate-700/50 text-center">
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          apeX Profile System • CryptoGift DAO
        </p>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ProfileFullCard;
