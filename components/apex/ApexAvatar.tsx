'use client';

/**
 * ApexAvatar - Video profile avatar with Apple Watch shape
 *
 * Features:
 * - Squircle shape (Apple Watch style - 22% border-radius)
 * - Floating animation (gentle oscillation)
 * - Notification badge
 * - Sticky positioning on scroll
 * - Auto-loads user profile avatar when connected
 * - Tap to expand panel (Phase 2)
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from '@/lib/thirdweb';
import { useProfile } from '@/hooks/useProfile';
import { AvatarBadge } from './AvatarBadge';
import { Bell } from 'lucide-react';

interface ApexAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  badgeCount?: number;
  onClick?: () => void;
  className?: string;
  enableFloat?: boolean;
  enableSticky?: boolean;
  videoSrc?: string;
  imageSrc?: string;
  /** When true, automatically fetches and shows the user's profile avatar */
  useUserProfile?: boolean;
}

const SIZE_MAP = {
  sm: { container: 48, badge: 16, icon: 12 },
  md: { container: 64, badge: 20, icon: 14 },
  lg: { container: 80, badge: 24, icon: 16 },
};

export function ApexAvatar({
  size = 'md',
  showBadge = true,
  badgeCount = 0,
  onClick,
  className = '',
  enableFloat = true,
  enableSticky = false,
  videoSrc,
  imageSrc = '/apeX22.PNG',
  useUserProfile = false,
}: ApexAvatarProps) {
  const { address, isConnected } = useAccount();
  const [isHovered, setIsHovered] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialTopRef = useRef<number | null>(null);

  // Fetch user profile for avatar when useUserProfile is enabled
  const { profile } = useProfile(useUserProfile && isConnected ? address : undefined);

  // Determine final image source: user profile avatar > prop imageSrc > default
  const finalImageSrc = (useUserProfile && profile?.avatar_url) || imageSrc;

  const dimensions = SIZE_MAP[size];

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sticky scroll handler
  useEffect(() => {
    if (!enableSticky || !containerRef.current) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      // Store initial position on first render
      if (initialTopRef.current === null) {
        initialTopRef.current = containerRef.current.getBoundingClientRect().top + window.scrollY;
      }

      const scrollY = window.scrollY;
      const threshold = initialTopRef.current - 80; // 80px from top becomes sticky

      setIsSticky(scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [enableSticky]);

  // Generate gradient based on wallet address for uniqueness
  const generateGradient = useCallback((addr: string | undefined) => {
    if (!addr) return 'from-amber-400 via-orange-500 to-red-500';

    // Use address hash to generate consistent colors
    const hash = addr.slice(2, 10);
    const hue1 = parseInt(hash.slice(0, 2), 16) % 360;
    const hue2 = (hue1 + 40) % 360;
    const hue3 = (hue1 + 80) % 360;

    return `from-[hsl(${hue1},70%,55%)] via-[hsl(${hue2},70%,50%)] to-[hsl(${hue3},70%,45%)]`;
  }, []);

  const gradient = generateGradient(address);

  // Apple Watch squircle style (22% border-radius for superellipse approximation)
  const squircleStyle = {
    borderRadius: '22%',
  };

  // Float animation classes
  const floatClass = enableFloat && !isHovered ? 'apex-float' : '';

  // Sticky positioning style
  const stickyStyle = isSticky && enableSticky
    ? {
        position: 'fixed' as const,
        top: '88px',
        right: '16px',
        zIndex: 50,
      }
    : {};

  if (!mounted) {
    return (
      <div
        className={`bg-gray-200 dark:bg-slate-700 ${className}`}
        style={{
          width: dimensions.container,
          height: dimensions.container,
          ...squircleStyle,
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer select-none ${className}`}
      style={{
        width: dimensions.container,
        height: dimensions.container,
        ...stickyStyle,
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label="Open apeX profile panel"
    >
      {/* Main Avatar Container */}
      <div
        className={`
          relative w-full h-full
          bg-gradient-to-br ${gradient}
          transition-all duration-300 ease-out
          ${isHovered ? 'scale-105' : 'scale-100'}
          ${floatClass}
        `}
        style={squircleStyle}
      >
        {/* Video or Image Background */}
        {videoSrc ? (
          <video
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={squircleStyle}
          />
        ) : finalImageSrc ? (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              ...squircleStyle,
              backgroundImage: `url(${finalImageSrc})`,
            }}
          />
        ) : (
          // Default gradient avatar with icon
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/80">
              <Bell className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Subtle inner border for depth */}
        <div
          className="absolute inset-0 border-2 border-white/20 dark:border-white/10"
          style={squircleStyle}
        />

        {/* Hover overlay */}
        <div
          className={`
            absolute inset-0 bg-black/0 transition-all duration-300
            ${isHovered ? 'bg-black/10' : ''}
          `}
          style={squircleStyle}
        />
      </div>

      {/* Notification Badge */}
      {showBadge && badgeCount > 0 && (
        <AvatarBadge
          count={badgeCount}
          size={size}
          className="absolute -top-1 -right-1"
        />
      )}

      {/* Connection indicator dot */}
      {isConnected && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"
          style={{
            transform: 'translate(25%, 25%)',
          }}
        />
      )}
    </div>
  );
}

export default ApexAvatar;
