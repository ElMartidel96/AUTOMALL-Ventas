'use client';

/**
 * WalletMiniCard - Wallet preview for ProfileExpanded (L2 sticky)
 *
 * Shows a compact preview of user's NFT wallets from cryptogift-wallets.
 * Positioned next to the expanded avatar without interfering with profile behavior.
 *
 * Features:
 * - Wallet count badge
 * - Primary wallet thumbnail
 * - Total balance summary
 * - Link to /my-wallets on cryptogift-wallets
 *
 * Made by mbxarts.com The Moon in a Box property
 *
 * Co-Author: Godez22
 */

import { useEffect, useState, useCallback, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useProfileCard } from './ProfileCardProvider';
import { useWalletsSummary } from '@/hooks/useUserWallets';
import { Wallet, ExternalLink, ChevronRight } from 'lucide-react';

// Wallets service URL
const WALLETS_APP_URL = process.env.NEXT_PUBLIC_WALLETS_APP_URL || 'https://gifts.mbxarts.com';

// Size and positioning constants
const CARD_WIDTH = 200;
const CARD_HEIGHT = 80;
const OFFSET_FROM_AVATAR = 16; // Gap between avatar and card
const AVATAR_SIZE = 168; // Must match ProfileExpanded EXPANDED_SIZE

export function WalletMiniCard() {
  const { profile, currentLevel, thumbnailRef } = useProfileCard();

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Fetch wallet summary for the connected user
  const {
    totalWallets,
    activeWallets,
    totalBalanceFormatted,
    primaryImage,
    isLoading,
    hasWallets,
  } = useWalletsSummary(profile?.wallet_address);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position relative to ProfileExpanded avatar
  // Position to the right of the avatar
  useEffect(() => {
    if (currentLevel !== 2 || !thumbnailRef.current) return;

    const rect = thumbnailRef.current.getBoundingClientRect();
    // Position to the right of the avatar with offset
    setPosition({
      top: rect.top + (AVATAR_SIZE - CARD_HEIGHT) / 2, // Center vertically
      left: rect.left + AVATAR_SIZE + OFFSET_FROM_AVATAR,
    });

    const handleResize = () => {
      const newRect = thumbnailRef.current?.getBoundingClientRect();
      if (newRect) {
        setPosition({
          top: newRect.top + (AVATAR_SIZE - CARD_HEIGHT) / 2,
          left: newRect.left + AVATAR_SIZE + OFFSET_FROM_AVATAR,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentLevel, thumbnailRef]);

  // Handle click - open wallets page
  const handleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation(); // Prevent triggering ProfileExpanded click
    window.open(`${WALLETS_APP_URL}/my-wallets`, '_blank', 'noopener,noreferrer');
  }, []);

  // Don't render if not at level 2 or no wallets
  if (!mounted || currentLevel !== 2 || !profile || (!hasWallets && !isLoading)) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return createPortal(
      <div
        className="fixed z-[99998] animate-fadeIn"
        style={{
          top: position.top,
          left: position.left,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        }}
      >
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-slate-200/50 dark:border-slate-700/50 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // No wallets state - don't show anything
  if (!hasWallets) {
    return null;
  }

  const cardContent = (
    <div
      className="fixed z-[99998] animate-slideInRight cursor-pointer"
      style={{
        top: position.top,
        left: position.left,
        width: CARD_WIDTH,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-label="View my wallets"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as MouseEvent);
        }
      }}
    >
      <div
        className={`
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3
          shadow-lg border border-slate-200/50 dark:border-slate-700/50
          transition-all duration-200 ease-out
          ${isHovered ? 'shadow-xl scale-[1.02] border-blue-400/50 dark:border-blue-500/50' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          {/* Wallet Thumbnail */}
          <div className="relative flex-shrink-0">
            {primaryImage ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md">
                <Image
                  src={primaryImage}
                  alt="NFT Wallet"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            )}

            {/* Wallet count badge */}
            {totalWallets > 1 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                {totalWallets > 9 ? '9+' : totalWallets}
              </div>
            )}
          </div>

          {/* Wallet Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                My Wallets
              </span>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isHovered ? 'translate-x-0.5' : ''
                }`}
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {totalWallets} wallet{totalWallets !== 1 ? 's' : ''}
              </span>
              {totalBalanceFormatted && totalBalanceFormatted !== '$0.00' && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {totalBalanceFormatted}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* External link indicator */}
          <ExternalLink
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(cardContent, document.body);
}

export default WalletMiniCard;
