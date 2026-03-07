'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Share2, Check } from 'lucide-react';

interface Props {
  vehicleId: string;
  vehicleTitle: string;
  className?: string;
}

export default function VehicleShareButton({ vehicleId, vehicleTitle, className = '' }: Props) {
  const t = useTranslations('catalog.share');
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/catalog/${vehicleId}`;
    const shareData = {
      title: t('shareTitle'),
      text: t('shareText', { title: vehicleTitle }),
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Last resort — can't copy
    }
  }, [vehicleId, vehicleTitle, t]);

  return (
    <button
      onClick={handleShare}
      className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all
        bg-white/60 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20
        text-gray-600 dark:text-gray-300 backdrop-blur-sm
        border border-gray-200/50 dark:border-white/10
        ${className}`}
      title={t('button')}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-am-green" />
          <span className="text-am-green">{t('copied')}</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('button')}</span>
        </>
      )}
    </button>
  );
}
