'use client';

/**
 * EngagementMetrics — Mini engagement display for a publication
 *
 * Shows likes, comments, shares, reactions with icons.
 * Glass morphism, dark/light mode, responsive.
 */

import { useTranslations } from 'next-intl';
import { ThumbsUp, MessageCircle, Share2, Heart, RefreshCw } from 'lucide-react';

interface Props {
  likes: number;
  comments: number;
  shares: number;
  reactions: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  compact?: boolean;
}

export function EngagementMetrics({
  likes,
  comments,
  shares,
  reactions,
  onRefresh,
  isRefreshing,
  compact = false,
}: Props) {
  const t = useTranslations('meta');

  const total = likes + comments + shares;

  if (total === 0 && compact) return null;

  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
      <MetricBadge
        icon={<ThumbsUp className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        value={likes}
        label={t('engagement.likes')}
        compact={compact}
        color="text-blue-500"
      />
      <MetricBadge
        icon={<MessageCircle className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        value={comments}
        label={t('engagement.comments')}
        compact={compact}
        color="text-green-500"
      />
      <MetricBadge
        icon={<Share2 className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        value={shares}
        label={t('engagement.shares')}
        compact={compact}
        color="text-purple-500"
      />
      {!compact && (
        <MetricBadge
          icon={<Heart className="w-3.5 h-3.5" />}
          value={reactions}
          label={t('engagement.reactions')}
          compact={false}
          color="text-red-500"
        />
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title={t('engagement.refresh')}
        >
          <RefreshCw className={`w-3 h-3 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}

function MetricBadge({
  icon,
  value,
  label,
  compact,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  compact: boolean;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1" title={label}>
      <span className={color}>{icon}</span>
      <span className={`font-medium text-gray-700 dark:text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
        {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
      </span>
    </div>
  );
}

/**
 * EngagementSummaryCard — Overview card with totals
 */
export function EngagementSummaryCard({
  totalLikes,
  totalComments,
  totalShares,
  totalReactions,
  totalPosts,
  onSync,
  isSyncing,
}: {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReactions: number;
  totalPosts: number;
  onSync?: () => void;
  isSyncing?: boolean;
}) {
  const t = useTranslations('meta');

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">{t('engagement.title')}</h3>
        </div>
        {onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs text-[#1877F2] hover:text-[#1665D8] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {t('engagement.refresh')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryStat icon={<ThumbsUp className="w-4 h-4" />} label={t('engagement.likes')} value={totalLikes} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" />
        <SummaryStat icon={<MessageCircle className="w-4 h-4" />} label={t('engagement.comments')} value={totalComments} color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" />
        <SummaryStat icon={<Share2 className="w-4 h-4" />} label={t('engagement.shares')} value={totalShares} color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" />
        <SummaryStat icon={<Heart className="w-4 h-4" />} label={t('engagement.reactions')} value={totalReactions} color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" />
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {t('engagement.fromPosts', { count: totalPosts })}
      </p>
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-xl ${color}`}>
      {icon}
      <span className="text-lg font-bold mt-1">{value > 9999 ? `${(value / 1000).toFixed(1)}k` : value}</span>
      <span className="text-xs opacity-75">{label}</span>
    </div>
  );
}
