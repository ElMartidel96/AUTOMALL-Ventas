'use client';

/**
 * ApexAvatarWithPanel - Combined avatar and panel component
 *
 * Integrates ApexAvatar with ApexPanel for a complete
 * profile experience. Click avatar to open panel.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useRef, useCallback } from 'react';
import { ApexAvatar } from './ApexAvatar';
import { ApexPanel } from './ApexPanel';

interface ApexAvatarWithPanelProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  badgeCount?: number;
  enableFloat?: boolean;
  enableSticky?: boolean;
  className?: string;
}

export function ApexAvatarWithPanel({
  size = 'md',
  showBadge = true,
  badgeCount = 0,
  enableFloat = true,
  enableSticky = false,
  className = '',
}: ApexAvatarWithPanelProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const handleAvatarClick = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  return (
    <>
      <div ref={avatarRef} className={className}>
        <ApexAvatar
          size={size}
          showBadge={showBadge}
          badgeCount={badgeCount}
          enableFloat={enableFloat && !isPanelOpen}
          enableSticky={enableSticky}
          onClick={handleAvatarClick}
        />
      </div>

      <ApexPanel
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        anchorRef={avatarRef}
      />
    </>
  );
}

export default ApexAvatarWithPanel;
