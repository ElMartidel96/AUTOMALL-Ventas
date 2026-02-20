'use client';

import type { VehicleStatus } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  sold: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  archived: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

interface Props {
  status: VehicleStatus;
  size?: 'sm' | 'md';
}

export function VehicleStatusBadge({ status, size = 'sm' }: Props) {
  const t = useTranslations('inventory.status');
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${style} ${sizeClass}`}>
      {t(status)}
    </span>
  );
}
