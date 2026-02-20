'use client';

/**
 * ProfileExpanded - Level 2 of ProfileCard system
 *
 * Main flow: L1 → L2 → L4 (L3 is only for shared links)
 * - Shows large Apple Watch squircle avatar positioned over thumbnail
 * - NO backdrop (page stays interactive)
 * - Click on avatar → go to Level 4 (Full Card)
 * - Mouse leave → close ONLY if not locked (hover mode)
 * - If locked (click mode) → stays open until click outside
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useProfileCard } from './ProfileCardProvider';
import { VideoAvatar } from '@/components/apex/VideoAvatar';
import { useNetwork } from '@/lib/thirdweb';

// Base Network Logo SVG
const BaseNetworkLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 111 111"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
    <path
      d="M55.3872 93.1875C76.2278 93.1875 93.1247 76.2906 93.1247 55.45C93.1247 34.6094 76.2278 17.7125 55.3872 17.7125C35.5765 17.7125 19.3158 33.0728 17.7122 52.4375H68.3247V58.4625H17.7122C19.3158 77.8272 35.5765 93.1875 55.3872 93.1875Z"
      fill="white"
    />
  </svg>
);

// Ethereum Network Logo SVG
const EthereumLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 256 417"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fill="#343434" d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
    <path fill="#8C8C8C" d="M127.962 0 0 212.32l127.962 75.639V154.158z"/>
    <path fill="#3C3C3B" d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6L256 236.587z"/>
    <path fill="#8C8C8C" d="M127.962 416.905v-104.72L0 236.585z"/>
    <path fill="#141414" d="m127.961 287.958 127.96-75.637-127.96-58.162z"/>
    <path fill="#393939" d="m.001 212.321 127.96 75.637V154.159z"/>
  </svg>
);

// Generic network indicator when network is unknown
const UnknownNetworkIndicator = ({ size = 20 }: { size?: number }) => (
  <div
    className="rounded-full bg-gray-500 flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    <span className="text-white text-xs font-bold">?</span>
  </div>
);

// Size of expanded avatar - matches the hover:scale-105 size (160 * 1.05 = 168)
const EXPANDED_SIZE = 168;

export function ProfileExpanded() {
  const {
    profile,
    currentLevel,
    thumbnailRef,
    closeLevel,
    goToLevel,
    isLocked,
  } = useProfileCard();
  const { chainId } = useNetwork();

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position ONCE when opening - FIXED to screen, not page
  // L2 visual corner must cover L1 completely (accounting for border-radius)
  //
  // GEOMETRY: L2 has rounded-[34px] which creates a curved corner.
  // The "corner gap" = borderRadius × (1 - 1/√2) ≈ 10px
  // We offset L2 by -4px to ensure its curved edge covers L1's visible border.
  const CORNER_OFFSET = 4;

  useEffect(() => {
    if (currentLevel !== 2 || !thumbnailRef.current) return;

    // Position L2 with offset so its rounded corner covers L1 completely
    const rect = thumbnailRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top - CORNER_OFFSET,
      left: rect.left - CORNER_OFFSET,
    });

    // Only update on resize (responsive), NOT on scroll
    const handleResize = () => {
      const newRect = thumbnailRef.current?.getBoundingClientRect();
      if (newRect) {
        setPosition({
          top: newRect.top - CORNER_OFFSET,
          left: newRect.left - CORNER_OFFSET,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentLevel, thumbnailRef]);

  // Handle click outside - close level
  useEffect(() => {
    if (currentLevel !== 2) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside the expanded avatar
      const expandedEl = document.getElementById('profile-expanded-avatar');
      const thumbnailEl = thumbnailRef.current;

      if (
        expandedEl &&
        !expandedEl.contains(target) &&
        thumbnailEl &&
        !thumbnailEl.contains(target)
      ) {
        closeLevel();
      }
    };

    // Delay to prevent immediate close from the opening click
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [currentLevel, closeLevel, thumbnailRef]);

  // Handle escape key - close level
  useEffect(() => {
    if (currentLevel !== 2) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLevel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [currentLevel, closeLevel]);

  // Handle mouse leave - only close if NOT locked (hover mode)
  // If locked (click mode), stay open until click outside
  const handleMouseLeave = useCallback(() => {
    if (!isLocked) {
      closeLevel();
    }
    // If locked, do nothing - will close on click outside
  }, [closeLevel, isLocked]);

  // Handle click on avatar - ALWAYS go to Level 4 (Full Card)
  // Simple and direct - no extra logic
  const handleClick = useCallback(() => {
    goToLevel(4);
  }, [goToLevel]);

  // Only render when at level 2
  if (!mounted || currentLevel !== 2 || !profile) return null;

  // Get network indicator based on chainId
  const getNetworkIndicator = () => {
    switch (chainId) {
      case 8453: // Base Mainnet
        return <BaseNetworkLogo size={24} />;
      case 1: // Ethereum Mainnet
        return <EthereumLogo size={24} />;
      case 84532: // Base Sepolia
        return <BaseNetworkLogo size={24} />;
      default:
        return <UnknownNetworkIndicator size={24} />;
    }
  };

  const expandedContent = (
    <div
      id="profile-expanded-avatar"
      className="fixed z-[99999] animate-expandIn origin-top-left cursor-pointer outline-none focus:outline-none"
      style={{
        top: position.top,
        left: position.left,
        pointerEvents: 'auto',
      }}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      aria-label="View full profile"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Large VideoAvatar - Apple Watch squircle */}
      {/* NO extra ring - VideoAvatar already has its own subtle border */}
      {/* NO hover/focus/active effects - always same appearance */}
      <div className="relative rounded-[34px] origin-top-left">
        <VideoAvatar
          imageSrc={profile.avatar_url || undefined}
          alt={profile.display_name || 'Profile'}
          width={168}
          height={168}
          disableHoverEffects
        />

        {/* Network Indicator - bottom right corner */}
        <div
          className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-slate-900 shadow-lg border-2 border-white dark:border-slate-800"
          title={chainId === 8453 ? 'Base' : chainId === 1 ? 'Ethereum' : 'Network'}
        >
          {getNetworkIndicator()}
        </div>
      </div>
    </div>
  );

  return createPortal(expandedContent, document.body);
}

export default ProfileExpanded;
