/**
 * ✅ My Tasks Panel - Personal Task Overview
 *
 * Shows user's task status and links to the tasks page:
 * - Active/claimed tasks
 * - Completed tasks
 * - Available tasks to claim
 * - Direct links to /tasks page
 *
 * @version 1.0.0
 * @updated December 2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from '@/lib/thirdweb';
import { useDashboardStats } from '@/lib/web3/hooks';
import { HolderGate, usePermissions } from '@/components/auth/RoleGate';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Target,
  ChevronRight,
  Loader2,
  Trophy,
  Star,
  Zap,
  Award,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface TaskStats {
  available: number;
  active: number;
  completed: number;
  submitted: number;
  total: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MyTasksPanel() {
  const t = useTranslations('dashboard');
  const tTasks = useTranslations('tasks');
  const { address, isConnected } = useAccount();
  const { permissions } = usePermissions();
  const {
    activeTasks,
    questsCompleted,
  } = useDashboardStats();

  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch task stats from API
  useEffect(() => {
    async function fetchTaskStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        if (data.success) {
          setTaskStats({
            available: data.data.tasksAvailable || 0,
            active: data.data.tasksActive || 0,
            completed: data.data.tasksCompleted || 0,
            submitted: data.data.tasksSubmitted || 0,
            total: data.data.tasksTotal || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching task stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTaskStats();
  }, []);

  // Not connected state
  if (!isConnected || !address) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 glass-bubble">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-glass">
              {t('panels.tasks.title')}
            </h3>
            <p className="text-glass-secondary text-sm">
              {t('panels.tasks.description')}
            </p>
          </div>
        </div>

        <div className="text-center py-8 text-glass-secondary">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('panels.tasks.connectToView')}</p>
        </div>

        {/* Browse Tasks CTA - Available to everyone */}
        <Link
          href="/tasks"
          className="glass-button w-full flex items-center justify-center gap-2 mt-4"
        >
          <span>{t('panels.tasks.browseTasks')}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 glass-bubble">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-glass">
              {t('panels.tasks.title')}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  const stats = taskStats || {
    available: 0,
    active: activeTasks || 0,
    completed: questsCompleted || 0,
    submitted: 0,
    total: 0,
  };

  return (
    <div className="glass-panel p-6 spring-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 glass-bubble">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-glass">
              {t('panels.tasks.title')}
            </h3>
            <p className="text-glass-secondary text-sm">
              {t('panels.tasks.yourTaskOverview')}
            </p>
          </div>
        </div>

        {/* Quick link to tasks */}
        <Link
          href="/tasks"
          className="text-blue-500 hover:text-blue-400 text-sm flex items-center gap-1"
        >
          {t('panels.tasks.viewAll')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Available Tasks */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-500" />
            <span className="text-glass-secondary text-sm">
              {t('panels.tasks.available')}
            </span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            {stats.available}
          </p>
          <p className="text-xs text-glass-secondary">
            {t('panels.tasks.readyToClaim')}
          </p>
        </div>

        {/* Active Tasks */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-glass-secondary text-sm">
              {t('panels.tasks.active')}
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-500">
            {stats.active}
          </p>
          <p className="text-xs text-glass-secondary">
            {t('panels.tasks.inProgress')}
          </p>
        </div>

        {/* Submitted Tasks */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <span className="text-glass-secondary text-sm">
              {t('panels.tasks.submitted')}
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-500">
            {stats.submitted}
          </p>
          <p className="text-xs text-glass-secondary">
            {t('panels.tasks.awaitingReview')}
          </p>
        </div>

        {/* Completed Tasks */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <span className="text-glass-secondary text-sm">
              {t('panels.tasks.completed')}
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">
            {stats.completed}
          </p>
          <p className="text-xs text-glass-secondary">
            {t('panels.tasks.rewardsEarned')}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Browse Available Tasks - Primary CTA */}
        <Link
          href="/tasks"
          className="glass-button w-full flex items-center justify-between group pulse-glow"
        >
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            {t('panels.tasks.browseTasks')}
            {stats.available > 0 && (
              <span className="bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded-full">
                {stats.available} {t('panels.tasks.new')}
              </span>
            )}
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* View My Active Tasks */}
        {stats.active > 0 && (
          <Link
            href="/tasks?filter=active"
            className="glass-button w-full flex items-center justify-between group"
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('panels.tasks.viewActiveTasks')}
              <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded-full">
                {stats.active}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* View Completed Tasks */}
        {stats.completed > 0 && (
          <Link
            href="/tasks?filter=completed"
            className="glass-button w-full flex items-center justify-between group"
          >
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              {t('panels.tasks.viewHistory')}
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Achievement Banner - For holders */}
      <HolderGate>
        {stats.completed >= 5 && (
          <div className="mt-6 p-4 glass-card border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-full">
                <Award className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-emerald-500 text-sm font-medium">
                  {t('panels.tasks.achievementUnlocked')}
                </p>
                <p className="text-glass-secondary text-xs">
                  {t('panels.tasks.completedMilestone', { count: stats.completed })}
                </p>
              </div>
            </div>
          </div>
        )}
      </HolderGate>

      {/* Proposer Benefits */}
      {permissions?.roleInfo.canCreateProposals && (
        <div className="mt-4 p-3 glass-card border border-purple-500/20">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-500" />
            <span className="text-purple-400 text-xs">
              {t('panels.tasks.proposerBenefit')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTasksPanel;
