'use client';

/**
 * useApexPosition - Hook for sticky positioning of ApexAvatar
 *
 * Features:
 * - Detects scroll position for sticky mode
 * - Calculates optimal position based on viewport
 * - Respects navbar height
 * - Mobile-responsive positioning
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface ApexPositionConfig {
  navbarHeight?: number;
  stickyThreshold?: number;
  mobileBreakpoint?: number;
  rightOffset?: number;
  topOffset?: number;
}

interface ApexPositionState {
  isSticky: boolean;
  isMobile: boolean;
  position: {
    top: number;
    right: number;
  };
}

const DEFAULT_CONFIG: ApexPositionConfig = {
  navbarHeight: 54,
  stickyThreshold: 200,
  mobileBreakpoint: 768,
  rightOffset: 16,
  topOffset: 156,
};

export function useApexPosition(
  elementRef: React.RefObject<HTMLElement | null>,
  config: ApexPositionConfig = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const initialTopRef = useRef<number | null>(null);

  const [state, setState] = useState<ApexPositionState>({
    isSticky: false,
    isMobile: false,
    position: {
      top: mergedConfig.topOffset || 88,
      right: mergedConfig.rightOffset || 16,
    },
  });

  // Check if mobile
  const checkMobile = useCallback(() => {
    return typeof window !== 'undefined' && window.innerWidth < (mergedConfig.mobileBreakpoint || 768);
  }, [mergedConfig.mobileBreakpoint]);

  // Update position based on scroll
  const updatePosition = useCallback(() => {
    if (!elementRef.current) return;

    const isMobile = checkMobile();

    // Store initial position on first render
    if (initialTopRef.current === null) {
      initialTopRef.current = elementRef.current.getBoundingClientRect().top + window.scrollY;
    }

    const scrollY = window.scrollY;
    const threshold = initialTopRef.current - (mergedConfig.topOffset || 88);

    const isSticky = scrollY > threshold;

    // Calculate position
    const position = {
      top: mergedConfig.topOffset || 88,
      right: isMobile ? 8 : (mergedConfig.rightOffset || 16),
    };

    setState(prev => {
      // Only update if values changed
      if (
        prev.isSticky !== isSticky ||
        prev.isMobile !== isMobile ||
        prev.position.top !== position.top ||
        prev.position.right !== position.right
      ) {
        return { isSticky, isMobile, position };
      }
      return prev;
    });
  }, [elementRef, checkMobile, mergedConfig.topOffset, mergedConfig.rightOffset]);

  // Setup scroll and resize listeners
  useEffect(() => {
    // Initial check
    updatePosition();

    // Add listeners
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  // Reset initial position on element change
  useEffect(() => {
    initialTopRef.current = null;
  }, [elementRef]);

  return {
    ...state,
    resetPosition: () => {
      initialTopRef.current = null;
      updatePosition();
    },
  };
}

export default useApexPosition;
