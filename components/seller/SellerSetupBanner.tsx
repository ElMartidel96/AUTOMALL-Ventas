'use client';

/**
 * SellerSetupBanner — Progressive setup reminder
 *
 * Shown below the navbar for connected users who haven't completed
 * their seller profile. Banner severity adapts to completion level.
 * Non-critical banners can be dismissed with localStorage timer.
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AlertCircle, Phone, CheckCircle2, X } from 'lucide-react';
import { useAccount } from '@/lib/thirdweb';
import { useSellerProfile } from '@/hooks/useSellerProfile';

const DISMISS_KEY_PREFIX = 'seller_reminder_dismissed_';

type BannerLevel = 'noProfile' | 'noPhone' | 'incomplete' | null;

function getDismissKey(address: string): string {
  return `${DISMISS_KEY_PREFIX}${address.slice(0, 10)}`;
}

function isDismissed(address: string, level: BannerLevel): boolean {
  if (!level || level === 'noProfile' || level === 'noPhone') return false; // never dismissible
  try {
    const raw = localStorage.getItem(getDismissKey(address));
    if (!raw) return false;
    const { ts, lvl } = JSON.parse(raw);
    if (lvl !== level) return false;
    const elapsed = Date.now() - ts;
    // incomplete < 50%: 7 days, 50-80%: 30 days
    const maxAge = lvl === 'incomplete' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    return elapsed < maxAge;
  } catch {
    return false;
  }
}

function dismissBanner(address: string, level: BannerLevel) {
  try {
    localStorage.setItem(getDismissKey(address), JSON.stringify({ ts: Date.now(), lvl: level }));
  } catch { /* ignore */ }
}

export function SellerSetupBanner() {
  const { address, isConnected } = useAccount();
  const { seller, isLoading, isOnboarded, hasPhone, completionPercentage } = useSellerProfile();
  const t = useTranslations('sellerSetup');
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !isConnected || !address || isLoading) return null;

  // Determine banner level
  let level: BannerLevel = null;
  if (!seller) {
    level = 'noProfile';
  } else if (!hasPhone) {
    level = 'noPhone';
  } else if (completionPercentage < 80) {
    level = 'incomplete';
  }

  if (!level) return null;
  if (dismissed || isDismissed(address, level)) return null;

  const canDismiss = level === 'incomplete';

  // Style per level
  const styles: Record<NonNullable<BannerLevel>, { bg: string; border: string; icon: typeof AlertCircle; iconColor: string }> = {
    noProfile: {
      bg: 'bg-am-orange/10 dark:bg-am-orange/15',
      border: 'border-am-orange/30',
      icon: AlertCircle,
      iconColor: 'text-am-orange',
    },
    noPhone: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-300/40 dark:border-amber-500/30',
      icon: Phone,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    incomplete: {
      bg: 'bg-am-blue/5 dark:bg-am-blue/10',
      border: 'border-am-blue/20 dark:border-am-blue/30',
      icon: CheckCircle2,
      iconColor: 'text-am-blue dark:text-am-blue-light',
    },
  };

  const style = styles[level];
  const Icon = style.icon;
  const href = level === 'noProfile' ? '/onboarding' : '/profile';

  return (
    <div className={`${style.bg} border-b ${style.border} fixed top-[104px] left-0 right-0 z-[9999]`}>
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-5 h-5 flex-shrink-0 ${style.iconColor}`} />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {t(`banner.${level}.title`, level === 'incomplete' ? { percentage: completionPercentage } : undefined)}
            </span>
            <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 ml-2">
              {t(`banner.${level}.description`)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={href}
            className="text-sm font-bold text-white bg-gradient-to-r from-am-orange to-am-orange-light px-4 py-1.5 rounded-lg hover:shadow-md transition-all whitespace-nowrap"
          >
            {t(`banner.${level}.cta`)}
          </Link>
          {canDismiss && (
            <button
              onClick={() => {
                dismissBanner(address, level);
                setDismissed(true);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={t('banner.dismiss')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
