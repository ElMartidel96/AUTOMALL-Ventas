'use client';

import { useTranslations } from 'next-intl';
import { Users, TrendingUp, UserPlus, Target } from 'lucide-react';
import type { CRMStats as CRMStatsType } from '@/hooks/useCRM';

interface Props {
  stats: CRMStatsType;
}

export function CRMStats({ stats }: Props) {
  const t = useTranslations('crm');

  const cards = [
    {
      label: t('stats.totalLeads'),
      value: stats.total,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      label: t('stats.newThisWeek'),
      value: stats.newThisWeek,
      icon: <UserPlus className="w-5 h-5" />,
      color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    },
    {
      label: t('stats.conversionRate'),
      value: `${stats.conversionRate}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
    {
      label: t('stats.hotLeads'),
      value: stats.byInterest.hot || 0,
      icon: <Target className="w-5 h-5" />,
      color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className={`glass-crystal-enhanced rounded-xl p-4 ${card.color}`}>
          <div className="flex items-center gap-2 mb-2">
            {card.icon}
          </div>
          <p className="text-2xl font-bold">{card.value}</p>
          <p className="text-xs opacity-75 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
