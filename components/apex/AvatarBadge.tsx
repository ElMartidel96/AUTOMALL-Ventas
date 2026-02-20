'use client';

/**
 * AvatarBadge - Notification badge for ApexAvatar
 *
 * Features:
 * - Pulsing animation for new notifications
 * - Responsive sizing based on parent avatar
 * - Max count display (99+)
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useMemo } from 'react';

interface AvatarBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
}

const SIZE_CONFIG = {
  sm: {
    container: 'w-4 h-4',
    text: 'text-[8px]',
    offset: '-top-1 -right-1',
  },
  md: {
    container: 'w-5 h-5',
    text: 'text-[10px]',
    offset: '-top-1 -right-1',
  },
  lg: {
    container: 'w-6 h-6',
    text: 'text-xs',
    offset: '-top-1.5 -right-1.5',
  },
};

export function AvatarBadge({
  count,
  size = 'md',
  className = '',
  pulse = true,
}: AvatarBadgeProps) {
  const config = SIZE_CONFIG[size];

  // Format display count (max 99+)
  const displayCount = useMemo(() => {
    if (count <= 0) return '';
    if (count > 99) return '99+';
    return count.toString();
  }, [count]);

  if (count <= 0) return null;

  return (
    <div
      className={`
        ${config.container}
        ${config.offset}
        ${className}
        flex items-center justify-center
        bg-red-500 dark:bg-red-600
        rounded-full
        border-2 border-white dark:border-slate-900
        shadow-lg
        ${pulse ? 'badge-pulse' : ''}
      `}
      role="status"
      aria-label={`${count} notifications`}
    >
      <span
        className={`
          ${config.text}
          font-bold
          text-white
          leading-none
        `}
      >
        {displayCount}
      </span>
    </div>
  );
}

export default AvatarBadge;
