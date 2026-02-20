'use client';

/**
 * ApexPanel - Expandable panel for ApexAvatar
 *
 * Shows quick access to:
 * - CGC Balance
 * - Active bets (competitions)
 * - Referral stats
 * - Pending commissions
 * - Quick actions
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAccount, useCGCBalance } from '@/lib/thirdweb';
import { useReferralStats } from '@/hooks/useReferrals';
import { ApexAvatar } from './ApexAvatar';
import { QuickStats } from './QuickStats';
import { QuickActions } from './QuickActions';
import {
  X,
  Wallet,
  Users,
  Gift,
  Trophy,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ApexPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function ApexPanel({ isOpen, onClose, anchorRef }: ApexPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { address, isConnected } = useAccount();
  const { formatted: cgcBalance } = useCGCBalance();
  const { stats: referralStats, isLoading: referralLoading } = useReferralStats(address);

  const t = useTranslations('apex');
  const tCommon = useTranslations('common');

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !isConnected) return null;

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const panelContent = (
    <>
      {/* Backdrop - higher z-index to cover video carousel */}
      <div
        className={`
          fixed inset-0 z-[60]
          bg-black/40 dark:bg-black/60
          backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Panel - highest z-index */}
      <div
        ref={panelRef}
        className={`
          fixed z-[70]
          w-[340px] max-w-[calc(100vw-32px)]
          max-h-[calc(100vh-120px)]
          overflow-y-auto
          bg-white dark:bg-slate-900
          rounded-2xl
          shadow-2xl
          border border-gray-200/50 dark:border-slate-700/50
          transition-all duration-300 ease-out
          ${isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }
        `}
        style={{
          top: '88px',
          right: '16px',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="apeX Profile Panel"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ApexAvatar
                size="md"
                showBadge={false}
                enableFloat={false}
              />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {displayAddress}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Base Mainnet
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Balance Section */}
        <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                CGC Balance
              </span>
              <Wallet className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {cgcBalance || '0.00'}
              <span className="text-lg font-normal text-gray-500 ml-1">CGC</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats
          referralStats={referralStats}
          isLoading={referralLoading}
        />

        {/* Quick Actions */}
        <QuickActions onClose={onClose} />

        {/* Footer - Coming Soon */}
        <div className="p-4 border-t border-gray-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>apeX AI Agent coming soon</span>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(panelContent, document.body);
}

export default ApexPanel;
