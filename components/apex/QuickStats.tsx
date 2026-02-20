'use client';

/**
 * QuickStats - Stats grid for ApexPanel
 *
 * Displays:
 * - Referrals count
 * - Pending rewards
 * - Active competitions (placeholder)
 * - Gifts sent/received
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Users,
  Gift,
  Trophy,
  Coins,
  ChevronRight,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import type { ReferralStats } from '@/hooks/useReferrals';

interface QuickStatsProps {
  referralStats?: ReferralStats | null;
  isLoading: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  href: string;
  color: string;
  isLoading?: boolean;
}

function StatCard({ icon, label, value, subValue, href, color, isLoading }: StatCardProps) {
  return (
    <Link
      href={href}
      className={`
        group relative
        flex flex-col
        p-3 rounded-xl
        bg-gray-50 dark:bg-slate-800/50
        hover:bg-gray-100 dark:hover:bg-slate-800
        border border-transparent
        hover:border-gray-200 dark:hover:border-slate-700
        transition-all duration-200
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 rounded-lg ${color}`}>
          {icon}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
        {label}
      </div>
      {isLoading ? (
        <div className="flex items-center gap-1">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          {subValue && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {subValue}
            </div>
          )}
        </>
      )}
    </Link>
  );
}

export function QuickStats({ referralStats, isLoading }: QuickStatsProps) {
  const t = useTranslations('apex');

  // Calculate referral network total
  const networkTotal = referralStats?.network?.total || 0;
  const pendingRewards = referralStats?.pendingRewards || 0;
  const totalEarned = referralStats?.totalEarned || 0;

  return (
    <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Quick Stats
        </h3>
        <TrendingUp className="w-4 h-4 text-green-500" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Referrals */}
        <StatCard
          icon={<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          label="Referrals"
          value={networkTotal}
          subValue={networkTotal > 0 ? `${referralStats?.network?.level1 || 0} direct` : undefined}
          href="/referrals"
          color="bg-blue-100 dark:bg-blue-900/30"
          isLoading={isLoading}
        />

        {/* Pending Rewards */}
        <StatCard
          icon={<Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          label="Pending"
          value={`${pendingRewards.toLocaleString()} CGC`}
          subValue={totalEarned > 0 ? `${totalEarned.toLocaleString()} earned` : undefined}
          href="/referrals?tab=rewards"
          color="bg-amber-100 dark:bg-amber-900/30"
          isLoading={isLoading}
        />

        {/* Competitions - Placeholder */}
        <StatCard
          icon={<Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          label="Competitions"
          value="Coming Soon"
          href="/competitions"
          color="bg-purple-100 dark:bg-purple-900/30"
        />

        {/* Gifts */}
        <StatCard
          icon={<Gift className="w-4 h-4 text-pink-600 dark:text-pink-400" />}
          label="Gifts"
          value="0 sent"
          subValue="0 received"
          href="/gifts"
          color="bg-pink-100 dark:bg-pink-900/30"
        />
      </div>
    </div>
  );
}

export default QuickStats;
