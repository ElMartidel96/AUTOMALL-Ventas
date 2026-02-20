'use client';

/**
 * Dashboard Tab - Mini App
 *
 * Shows 6 key metrics that drive user behavior:
 * 1. Available Tasks (Opportunity)
 * 2. Tasks In Progress (Urgency)
 * 3. Pending CGC Rewards (Motivation)
 * 4. Active Referrals (Social proof)
 * 5. Streak Days (Gamification)
 * 6. Leaderboard Rank (Status)
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, { useEffect, useState } from 'react';
import {
  ListTodo,
  Clock,
  Coins,
  Users,
  Flame,
  Trophy,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMiniApp } from './MiniAppProvider';
import type { DashboardMetrics } from '@/lib/farcaster/types';

interface MetricCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  onClick?: () => void;
}

function MetricCard({ icon, value, label, color, onClick }: MetricCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        p-4 rounded-2xl border
        bg-white dark:bg-gray-800/50
        border-gray-200 dark:border-gray-700
        hover:border-${color}-300 dark:hover:border-${color}-700
        hover:shadow-lg hover:scale-[1.02]
        active:scale-95
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className={`text-${color}-500 dark:text-${color}-400 mb-2`}>
        {icon}
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
        {label}
      </span>
    </button>
  );
}

export function DashboardTab() {
  const t = useTranslations('miniapp.dashboard');
  const { verifiedWallet, isAuthenticated, setActiveTab, context } = useMiniApp();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard metrics
  useEffect(() => {
    async function fetchMetrics() {
      if (!verifiedWallet) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch from existing APIs (no duplication!)
        const [dashboardRes, referralRes, tasksRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch(`/api/referrals/stats?wallet=${verifiedWallet}`),
          fetch(`/api/tasks?status=available&limit=100`),
        ]);

        if (!dashboardRes.ok || !referralRes.ok || !tasksRes.ok) {
          throw new Error('Failed to fetch metrics');
        }

        const [dashboard, referral, tasks] = await Promise.all([
          dashboardRes.json(),
          referralRes.json(),
          tasksRes.json(),
        ]);

        // Aggregate metrics
        const myTasks = tasks.tasks?.filter(
          (task: { assignee?: string }) =>
            task.assignee?.toLowerCase() === verifiedWallet.toLowerCase()
        ) || [];

        setMetrics({
          availableTasks: tasks.tasks?.filter(
            (task: { status: string }) => task.status === 'available'
          ).length || 0,
          tasksInProgress: myTasks.filter(
            (task: { status: string }) =>
              task.status === 'claimed' || task.status === 'in_progress'
          ).length,
          pendingRewardsCGC: referral.pendingRewards || 0,
          activeReferrals: referral.activeReferrals || 0,
          streakDays: referral.streakDays || 0, // Add streak tracking in Phase 2
          leaderboardRank: referral.rank || 0,
        });
      } catch (err) {
        console.error('[DashboardTab] Error fetching metrics:', err);
        setError(t('error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, [verifiedWallet, t]);

  // User avatar and info
  const user = context.user;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Users className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('welcomeTitle')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {t('welcomeDesc')}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t('connectPrompt')}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* User Header */}
      {user && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200/50 dark:border-purple-700/30">
          {user.pfpUrl ? (
            <img
              src={user.pfpUrl}
              alt={user.displayName || user.username || 'User'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {(user.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {user.displayName || `@${user.username}`}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              FID: {user.fid}
            </p>
          </div>
        </div>
      )}

      {/* 6 Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          icon={<ListTodo className="w-6 h-6" />}
          value={metrics?.availableTasks || 0}
          label={t('metrics.availableTasks')}
          color="purple"
          onClick={() => setActiveTab('tasks')}
        />
        <MetricCard
          icon={<Clock className="w-6 h-6" />}
          value={metrics?.tasksInProgress || 0}
          label={t('metrics.inProgress')}
          color="yellow"
          onClick={() => setActiveTab('tasks')}
        />
        <MetricCard
          icon={<Coins className="w-6 h-6" />}
          value={metrics?.pendingRewardsCGC || 0}
          label={t('metrics.pendingCGC')}
          color="green"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          value={metrics?.activeReferrals || 0}
          label={t('metrics.referrals')}
          color="blue"
          onClick={() => setActiveTab('referrals')}
        />
        <MetricCard
          icon={<Flame className="w-6 h-6" />}
          value={metrics?.streakDays || 0}
          label={t('metrics.streak')}
          color="orange"
        />
        <MetricCard
          icon={<Trophy className="w-6 h-6" />}
          value={metrics?.leaderboardRank ? `#${metrics.leaderboardRank}` : '-'}
          label={t('metrics.rank')}
          color="yellow"
        />
      </div>

      {/* Primary CTA - Most impactful action */}
      {metrics && metrics.availableTasks > 0 && (
        <button
          onClick={() => setActiveTab('tasks')}
          className="
            w-full flex items-center justify-between
            p-4 rounded-2xl
            bg-gradient-to-r from-purple-600 to-blue-600
            hover:from-purple-700 hover:to-blue-700
            text-white font-semibold
            shadow-lg hover:shadow-xl
            active:scale-[0.98]
            transition-all duration-200
          "
        >
          <span className="flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            {t('cta.viewTasks')}
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Secondary CTA - If no tasks available */}
      {metrics && metrics.availableTasks === 0 && (
        <button
          onClick={() => setActiveTab('referrals')}
          className="
            w-full flex items-center justify-between
            p-4 rounded-2xl
            bg-gradient-to-r from-blue-500 to-cyan-500
            hover:from-blue-600 hover:to-cyan-600
            text-white font-semibold
            shadow-lg hover:shadow-xl
            active:scale-[0.98]
            transition-all duration-200
          "
        >
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('cta.inviteFriends')}
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Quick tip based on most impactful next action */}
      {metrics && metrics.tasksInProgress > 0 && (
        <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 {t('tips.completeTask')}
          </p>
        </div>
      )}
    </div>
  );
}

export default DashboardTab;
