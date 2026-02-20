'use client';

/**
 * ProfileCard - Unified 4-level profile identity system
 *
 * Usage:
 * <ProfileCard />                           // Uses connected wallet
 * <ProfileCard wallet="0x..." />            // Shows specific user
 * <ProfileCard initialLevel={1} />          // Start at thumbnail
 * <ProfileCard size="sm" showBadge />       // Customize thumbnail
 *
 * Levels:
 * 1 - Thumbnail (48px Apple Watch style)
 * 2 - Expanded Panel (wallet + balance + bio preview)
 * 3 - Mini Card (stats + social preview)
 * 4 - Full Modal (everything)
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { ProfileCardProvider, type ProfileLevel } from './ProfileCardProvider';
import { ProfileThumbnail } from './ProfileThumbnail';
import { ProfileExpanded } from './ProfileExpanded';
import { ProfileMiniCard } from './ProfileMiniCard';
import { ProfileFullCard } from './ProfileFullCard';
import { WalletMiniCard } from './WalletMiniCard';

interface ProfileCardProps {
  /** Wallet address to show. If not provided, uses connected wallet */
  wallet?: string;

  /** Initial level to show (default: 1 = thumbnail) */
  initialLevel?: ProfileLevel;

  /** Callback when level changes */
  onLevelChange?: (level: ProfileLevel) => void;

  /** Size for Level 1 thumbnail */
  size?: 'sm' | 'md' | 'lg';

  /** Show notification badge on thumbnail */
  showBadge?: boolean;

  /** Badge count for notifications */
  badgeCount?: number;

  /** Enable floating animation on thumbnail */
  enableFloat?: boolean;

  /** Additional CSS class for thumbnail container */
  className?: string;
}

export function ProfileCard({
  wallet,
  initialLevel = 1,
  onLevelChange,
  size = 'sm',
  showBadge = false,
  badgeCount = 0,
  enableFloat = false,
  className = '',
}: ProfileCardProps) {
  return (
    <ProfileCardProvider
      wallet={wallet}
      initialLevel={initialLevel}
      onLevelChange={onLevelChange}
    >
      {/* Level 1: Thumbnail (always visible as anchor) */}
      <ProfileThumbnail
        size={size}
        showBadge={showBadge}
        badgeCount={badgeCount}
        enableFloat={enableFloat}
        className={className}
      />

      {/* Level 2: Expanded Panel (portal) */}
      <ProfileExpanded />

      {/* Wallet preview (shows alongside Level 2 when user has wallets) */}
      <WalletMiniCard />

      {/* Level 3: Mini Card (portal) */}
      <ProfileMiniCard />

      {/* Level 4: Full Modal (portal) */}
      <ProfileFullCard />
    </ProfileCardProvider>
  );
}

export default ProfileCard;
