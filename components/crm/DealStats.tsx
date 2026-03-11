'use client';

import { useTranslations } from 'next-intl';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, ShoppingCart, Clock } from 'lucide-react';
import type { DealStats as DealStatsType } from '@/lib/crm/types';

interface Props {
  stats: DealStatsType;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function DealStats({ stats }: Props) {
  const t = useTranslations('deals');

  const cards = [
    {
      label: t('stats.totalDeals'),
      value: stats.total_deals,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      label: t('stats.activeDeals'),
      value: stats.active_deals,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    },
    {
      label: t('stats.totalRevenue'),
      value: formatCurrency(stats.total_revenue),
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    },
    {
      label: t('stats.totalCollected'),
      value: formatCurrency(stats.total_collected),
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('stats.outstanding'),
      value: formatCurrency(stats.total_outstanding),
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    },
    {
      label: t('stats.overduePayments'),
      value: stats.overdue_payments,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: stats.overdue_payments > 0
        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        : 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
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
