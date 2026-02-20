'use client';

/**
 * Referrals Tab - Mini App
 *
 * Shows referral link, network stats, and leaderboard.
 * Optimized for viral sharing via composeCast.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Copy,
  Share2,
  Users,
  Coins,
  Trophy,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  Percent,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMiniApp } from './MiniAppProvider';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: number;
  totalEarned: number;
  conversionRate: number;
  network: {
    level1: number;
    level2: number;
    level3: number;
  };
  rank: number;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  referrals: number;
  earned: number;
  isCurrentUser: boolean;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ReferralsTab() {
  const t = useTranslations('miniapp.referrals');
  const { verifiedWallet, shareReferral, isAuthenticated } = useMiniApp();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralUrl = stats?.referralCode
    ? `https://mbxarts.com/r/${stats.referralCode}`
    : '';

  // Fetch referral stats
  const fetchStats = useCallback(async () => {
    if (!verifiedWallet) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [statsRes, leaderboardRes] = await Promise.all([
        fetch(`/api/referrals/stats?wallet=${verifiedWallet}`),
        fetch('/api/referrals/leaderboard?limit=10'),
      ]);

      if (!statsRes.ok || !leaderboardRes.ok) {
        throw new Error('Failed to fetch referral data');
      }

      const [statsData, leaderboardData] = await Promise.all([
        statsRes.json(),
        leaderboardRes.json(),
      ]);

      setStats({
        referralCode: statsData.referralCode || '',
        totalReferrals: statsData.totalReferrals || 0,
        activeReferrals: statsData.activeReferrals || 0,
        pendingRewards: statsData.pendingRewards || 0,
        totalEarned: statsData.totalEarned || 0,
        conversionRate: statsData.conversionRate || 0,
        network: {
          level1: statsData.network?.level1 || 0,
          level2: statsData.network?.level2 || 0,
          level3: statsData.network?.level3 || 0,
        },
        rank: statsData.rank || 0,
      });

      // Mark current user in leaderboard
      const enrichedLeaderboard = (leaderboardData.entries || []).map(
        (entry: LeaderboardEntry, idx: number) => ({
          ...entry,
          rank: idx + 1,
          isCurrentUser:
            entry.address.toLowerCase() === verifiedWallet.toLowerCase(),
        })
      );

      setLeaderboard(enrichedLeaderboard);
    } catch (err) {
      console.error('[ReferralsTab] Error:', err);
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  }, [verifiedWallet, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Copy referral link
  const handleCopy = async () => {
    if (!referralUrl) return;

    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = referralUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share to Farcaster feed
  const handleShare = async () => {
    if (!stats?.referralCode) return;
    await shareReferral(stats.referralCode, referralUrl);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Users className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          {t('connectPrompt')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Referral Link Section */}
      <section className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200/50 dark:border-purple-700/30">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          {t('yourLink')}
        </h3>

        {/* Link display */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-xl text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
            {referralUrl || t('generating')}
          </div>
          <button
            onClick={handleCopy}
            disabled={!referralUrl}
            className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label={t('copy')}
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Share CTA - Primary action */}
        <button
          onClick={handleShare}
          disabled={!referralUrl}
          className="
            w-full flex items-center justify-center gap-2
            py-3 px-4 rounded-xl
            bg-gradient-to-r from-purple-600 to-blue-600
            hover:from-purple-700 hover:to-blue-700
            text-white font-semibold
            shadow-lg hover:shadow-xl
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          <Share2 className="w-5 h-5" />
          {t('shareToFeed')}
        </button>
      </section>

      {/* Network Stats */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          {t('yourNetwork')}
        </h3>

        {/* Level breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { level: 1, count: stats?.network.level1 || 0, rate: '10%' },
            { level: 2, count: stats?.network.level2 || 0, rate: '5%' },
            { level: 3, count: stats?.network.level3 || 0, rate: '2.5%' },
          ].map((tier) => (
            <div
              key={tier.level}
              className="p-3 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center"
            >
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {tier.count}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                L{tier.level} ({tier.rate})
              </p>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('pendingRewards')}
            </span>
          </div>
          <span className="font-bold text-green-600 dark:text-green-400">
            {stats?.pendingRewards || 0} CGC
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 mt-2">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('conversion')}
            </span>
          </div>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {((stats?.conversionRate || 0) * 100).toFixed(1)}%
          </span>
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          {t('leaderboard')}
        </h3>

        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.address}
              className={`
                flex items-center justify-between p-3 rounded-xl
                ${
                  entry.isCurrentUser
                    ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700'
                    : 'bg-gray-50 dark:bg-gray-800/30'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold
                    ${
                      entry.rank === 1
                        ? 'bg-yellow-400 text-yellow-900'
                        : entry.rank === 2
                          ? 'bg-gray-300 text-gray-700'
                          : entry.rank === 3
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  {entry.rank}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {entry.isCurrentUser ? t('you') : truncateAddress(entry.address)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {entry.referrals} refs
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {entry.earned} CGC
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ReferralsTab;
