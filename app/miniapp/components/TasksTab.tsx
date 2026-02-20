'use client';

/**
 * Tasks Tab - Mini App
 *
 * Shows available tasks, tasks in progress, and completed tasks.
 * Optimized for mobile with quick claim/submit actions.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  Coins,
  CheckCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
  Share2,
  Timer,
  Tag,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMiniApp } from './MiniAppProvider';

interface Task {
  id: string;
  title: string;
  description: string;
  reward_cgc: number;
  status: 'available' | 'claimed' | 'in_progress' | 'completed' | 'validated';
  domain: string;
  estimated_hours: number;
  deadline?: string;
  assignee?: string;
  claimed_at?: string;
}

function formatTimeRemaining(deadlineStr: string): string {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}

function TaskCard({
  task,
  isMine,
  onClaim,
  onShare,
  isLoading,
}: {
  task: Task;
  isMine: boolean;
  onClaim: (taskId: string) => void;
  onShare: (task: Task) => void;
  isLoading: boolean;
}) {
  const t = useTranslations('miniapp.tasks');

  const statusColors = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    claimed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    validated: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  const showTimeRemaining =
    isMine &&
    task.deadline &&
    (task.status === 'claimed' || task.status === 'in_progress');

  return (
    <div
      className={`
        p-4 rounded-2xl border
        ${isMine ? 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}
        transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {task.title}
          </h3>
          {showTimeRemaining && (
            <div className="flex items-center gap-1 mt-1 text-yellow-600 dark:text-yellow-400">
              <Timer className="w-3 h-3" />
              <span className="text-xs font-medium">
                {formatTimeRemaining(task.deadline!)}
              </span>
            </div>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
          {t(`status.${task.status}`)}
        </span>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-3 mb-3 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Coins className="w-4 h-4 text-green-500" />
          <span className="font-medium text-green-600 dark:text-green-400">
            {task.reward_cgc} CGC
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {task.estimated_hours}h
        </span>
        <span className="flex items-center gap-1">
          <Tag className="w-4 h-4" />
          {task.domain}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {task.status === 'available' && !isMine && (
          <button
            onClick={() => onClaim(task.id)}
            disabled={isLoading}
            className="
              flex-1 flex items-center justify-center gap-2
              py-2.5 px-4 rounded-xl
              bg-gradient-to-r from-purple-600 to-blue-600
              hover:from-purple-700 hover:to-blue-700
              text-white font-medium text-sm
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {t('actions.claim')}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        {isMine && (task.status === 'claimed' || task.status === 'in_progress') && (
          <button
            onClick={() => {
              // Open full task page for submission
              window.location.href = `/tasks/${task.id}`;
            }}
            className="
              flex-1 flex items-center justify-center gap-2
              py-2.5 px-4 rounded-xl
              bg-gradient-to-r from-green-500 to-emerald-500
              hover:from-green-600 hover:to-emerald-600
              text-white font-medium text-sm
              transition-all duration-200
            "
          >
            {t('actions.submit')}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {task.status === 'completed' || task.status === 'validated' && (
          <button
            onClick={() => onShare(task)}
            className="
              flex-1 flex items-center justify-center gap-2
              py-2.5 px-4 rounded-xl
              bg-gray-100 dark:bg-gray-700
              hover:bg-gray-200 dark:hover:bg-gray-600
              text-gray-700 dark:text-gray-200 font-medium text-sm
              transition-all duration-200
            "
          >
            <Share2 className="w-4 h-4" />
            {t('actions.share')}
          </button>
        )}
      </div>
    </div>
  );
}

export function TasksTab() {
  const t = useTranslations('miniapp.tasks');
  const { verifiedWallet, isAuthenticated, shareTaskCompletion } = useMiniApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/tasks?limit=50');
      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('[TasksTab] Error:', err);
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Claim task handler
  const handleClaim = async (taskId: string) => {
    if (!verifiedWallet) return;

    try {
      setClaimingId(taskId);

      const response = await fetch('/api/tasks/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          wallet: verifiedWallet,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to claim task');
      }

      // Refresh tasks
      await fetchTasks();
    } catch (err) {
      console.error('[TasksTab] Claim error:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim task');
    } finally {
      setClaimingId(null);
    }
  };

  // Share completed task
  const handleShare = async (task: Task) => {
    await shareTaskCompletion(task.title, task.reward_cgc);
  };

  // Categorize tasks
  const myTasks = tasks.filter(
    (task) =>
      verifiedWallet &&
      task.assignee?.toLowerCase() === verifiedWallet.toLowerCase()
  );

  const availableTasks = tasks.filter((task) => task.status === 'available');

  const completedTasks = myTasks.filter(
    (task) => task.status === 'completed' || task.status === 'validated'
  );

  const inProgressTasks = myTasks.filter(
    (task) => task.status === 'claimed' || task.status === 'in_progress'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchTasks}
          className="mt-4 px-4 py-2 text-sm text-purple-600 hover:text-purple-700"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* In Progress Tasks - Top priority */}
      {inProgressTasks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('sections.inProgress')} ({inProgressTasks.length})
          </h2>
          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isMine={true}
                onClaim={handleClaim}
                onShare={handleShare}
                isLoading={claimingId === task.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Available Tasks */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {t('sections.available')} ({availableTasks.length})
        </h2>
        {availableTasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
            <p>{t('empty.available')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableTasks.slice(0, 5).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isMine={false}
                onClaim={handleClaim}
                onShare={handleShare}
                isLoading={claimingId === task.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recently Completed */}
      {completedTasks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {t('sections.completed')}
          </h2>
          <div className="space-y-2">
            {completedTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {task.title}
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  +{task.reward_cgc} CGC
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default TasksTab;
