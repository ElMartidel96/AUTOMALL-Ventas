'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CopyPanelProps {
  label: string;
  value: string;
  fullUrl: string;
  icon: React.ReactNode;
  navigable?: boolean;
  disabled?: boolean;
}

export function CopyPanel({ label, value, fullUrl, icon, navigable = false, disabled = false }: CopyPanelProps) {
  const t = useTranslations('profile');
  const [copied, setCopied] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const handleCopy = useCallback(async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — fail silently
    }
  }, [fullUrl, disabled]);

  const handlePanelClick = useCallback(() => {
    if (disabled) return;
    handleCopy();
  }, [disabled, handleCopy]);

  // Long-press detection for navigable links
  const handlePointerDown = useCallback(() => {
    if (!navigable) return;
    isLongPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
    }, 300);
  }, [navigable]);

  const handlePointerUp = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Quick tap → copy instead of navigate
      if (!isLongPressRef.current) {
        e.preventDefault();
      }
      // Long press → let the default <a> behavior navigate
    },
    []
  );

  return (
    <div
      onClick={handlePanelClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`glass-crystal-enhanced rounded-2xl p-4 transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : `cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
              copied ? 'ring-2 ring-am-green' : ''
            }`
      }`}
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-am-orange">{icon}</span>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Value + copy icon */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          {navigable && !disabled ? (
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className="text-am-blue dark:text-am-blue-light font-semibold text-sm truncate block hover:underline"
            >
              {value}
            </a>
          ) : (
            <p className={`font-semibold text-sm truncate ${
              disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
            }`}>
              {value}
            </p>
          )}
        </div>

        {/* Icon */}
        {copied ? (
          <CheckCircle className="w-5 h-5 text-am-green flex-shrink-0 animate-pulse" />
        ) : navigable && !disabled ? (
          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Hint */}
      <p className={`text-xs mt-1.5 ${copied ? 'text-am-green font-medium' : 'text-gray-400'}`}>
        {copied ? t('copied') : disabled ? '' : t('tapToCopy')}
      </p>
    </div>
  );
}
