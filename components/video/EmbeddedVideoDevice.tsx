'use client';

/**
 * EMBEDDED VIDEO DEVICE - Premium Video Player with Sticky Mode
 *
 * BEHAVIOR (PC & Mobile identical):
 * - Video stays in original position until >50% hidden by scroll
 * - When >50% hidden → Video floats to fixed position below navbar (EXACT same visual)
 * - When >70% visible again → Returns to original position
 * - PC: Click to start playing
 * - Mobile: Auto-play when visible
 *
 * IMPORTANT: Uses React Portal for sticky mode to escape backdrop-filter containers
 * that break position:fixed behavior.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Play, Volume2, VolumeX, Minimize2, Maximize2 } from 'lucide-react';
import { VideoExperienceHint } from '@/components/ui/RotatePhoneHint';

// Lazy load Mux Player for optimization
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="relative aspect-video w-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black rounded-3xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white/70 text-sm">Loading...</p>
        </div>
      </div>
    )
  }
);

interface EmbeddedVideoDeviceProps {
  muxPlaybackId: string;
  lessonId: string;
  title?: string;
  description?: string;
  onVideoComplete?: () => void;
  className?: string;
  locale?: 'en' | 'es';
}

// Auto-play volume (0.0 to 1.0) - 30% as requested
const AUTO_PLAY_VOLUME = 0.30;

// Visibility thresholds for sticky behavior
const STICKY_THRESHOLD = 0.50; // Go sticky when <50% visible (>50% hidden)
const RETURN_THRESHOLD = 0.70; // Return to normal when >70% visible

// Navbar height in pixels
const NAVBAR_HEIGHT = 54;
const STICKY_TOP_OFFSET = 40;

// CSS Keyframes
const animationStyles = `
  @keyframes ambientPulse {
    0%, 100% { opacity: 0.5; transform: scale(1.12); }
    50% { opacity: 0.65; transform: scale(1.18); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes floatVideo {
    0%, 100% { margin-top: 0px; }
    50% { margin-top: -8px; }
  }
  @keyframes dismissUp {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-150px) scale(0.8); }
  }
  @keyframes dismissLeft {
    0% { opacity: 1; transform: translateX(0) scale(1); }
    100% { opacity: 0; transform: translateX(-120%) scale(0.9); }
  }
  @keyframes dismissRight {
    0% { opacity: 1; transform: translateX(0) scale(1); }
    100% { opacity: 0; transform: translateX(120%) scale(0.9); }
  }
`;

export function EmbeddedVideoDevice({
  muxPlaybackId,
  lessonId,
  title,
  description,
  onVideoComplete,
  className = '',
}: EmbeddedVideoDeviceProps) {
  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(AUTO_PLAY_VOLUME);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // STICKY MODE: Video floats to fixed position when scrolled >50% out of view
  const [isSticky, setIsSticky] = useState(false);

  // Dismiss animation state - tracks swipe direction for visual feedback
  const [dismissDirection, setDismissDirection] = useState<'none' | 'up' | 'left' | 'right'>('none');

  // Touch active state - pauses float animation during touch to prevent vibration
  const [isTouching, setIsTouching] = useState(false);

  // Store original dimensions for placeholder
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  // Ambient Mode state
  const [ambientColors, setAmbientColors] = useState({
    dominant: 'rgba(139, 92, 246, 0.4)',
    secondary: 'rgba(6, 182, 212, 0.3)',
    accent: 'rgba(168, 85, 247, 0.35)'
  });

  // Refs
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const ambientIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoPlayed = useRef(false);
  const stickyLocked = useRef(false);

  // Portal state - for escaping backdrop-filter containers
  const [portalReady, setPortalReady] = useState(false);
  const [placeholderRect, setPlaceholderRect] = useState<DOMRect | null>(null);

  // Swipe gesture state for mobile minimize
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  // CRITICAL: Unique DOM ID for MuxPlayer
  const muxPlayerId = `mux-player-${lessonId}`;

  // Detect Mobile device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        const isSmallScreen = window.innerWidth < 768;
        const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isSmallScreen || mobileUA;
      };

      setIsMobile(checkMobile());

      const handleResize = () => setIsMobile(checkMobile());
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Portal ready check (client-side only)
  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Update placeholder rect for positioning when NOT sticky
  // CRITICAL: Calculate immediately and continuously to avoid "jump" on initial render
  useEffect(() => {
    if (!placeholderRef.current) return;

    const updateRect = () => {
      if (placeholderRef.current && !isSticky) {
        setPlaceholderRect(placeholderRef.current.getBoundingClientRect());
      }
    };

    // CRITICAL FIX: Use requestAnimationFrame to ensure layout is complete
    // This prevents the initial "jump" where video appears in wrong position
    const rafUpdate = () => {
      requestAnimationFrame(() => {
        updateRect();
        // Double RAF for extra safety on first load (ensures paint is complete)
        requestAnimationFrame(updateRect);
      });
    };

    // Initial update with RAF
    rafUpdate();

    // Also update after a small delay to catch any late layout changes
    const initialTimeout = setTimeout(updateRect, 100);
    const secondTimeout = setTimeout(updateRect, 300);

    // Update on scroll and resize when not sticky
    if (!isSticky) {
      window.addEventListener('scroll', updateRect, { passive: true });
      window.addEventListener('resize', updateRect, { passive: true });
      return () => {
        clearTimeout(initialTimeout);
        clearTimeout(secondTimeout);
        window.removeEventListener('scroll', updateRect);
        window.removeEventListener('resize', updateRect);
      };
    }

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(secondTimeout);
    };
  }, [isSticky]);

  // Capture original height when video is ready
  useEffect(() => {
    if (videoContainerRef.current && isVideoReady && !originalHeight) {
      setOriginalHeight(videoContainerRef.current.offsetHeight);
    }
  }, [isVideoReady, originalHeight]);

  // Get MuxPlayer via DOM
  const getMuxPlayer = useCallback((): any => {
    if (typeof document === 'undefined') return null;
    const wrapper = document.getElementById(muxPlayerId);
    if (!wrapper) return null;
    return wrapper.querySelector('mux-player');
  }, [muxPlayerId]);

  // Audio unlock on first interaction
  useEffect(() => {
    if (audioUnlocked) return;

    const unlockAudio = () => {
      setAudioUnlocked(true);
      const player = getMuxPlayer();
      if (player && isPlaying && isMuted) {
        try {
          player.muted = false;
          player.volume = AUTO_PLAY_VOLUME;
          setIsMuted(false);
        } catch (e) {
          console.log('[Video] Could not unmute:', e);
        }
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio, { once: true, passive: true });
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [audioUnlocked, isPlaying, isMuted, getMuxPlayer]);

  // Attempt auto-play (for mobile)
  const attemptAutoPlay = useCallback(() => {
    if (hasAutoPlayed.current) return;

    const player = getMuxPlayer();
    if (!player) return;

    player.volume = AUTO_PLAY_VOLUME;
    player.muted = false;
    setVolume(AUTO_PLAY_VOLUME);
    setIsMuted(false);

    const playPromise = player.play();
    if (playPromise?.then) {
      playPromise.then(() => {
        hasAutoPlayed.current = true;
        setIsPlaying(true);
        setIsMuted(false);
      }).catch(() => {
        // Fallback: muted play
        player.muted = true;
        setIsMuted(true);
        player.play()?.then(() => {
          hasAutoPlayed.current = true;
          setIsPlaying(true);
        }).catch(() => {});
      });
    }
  }, [getMuxPlayer]);

  // Extract colors from video for ambient effect
  const extractVideoColors = useCallback(() => {
    if (!isPlaying) return;
    const time = Date.now() / 5000;
    setAmbientColors({
      dominant: `rgba(${139 + Math.sin(time) * 30}, ${92 + Math.sin(time + 1) * 30}, ${246 + Math.sin(time + 2) * 9}, 0.5)`,
      secondary: `rgba(${6 + Math.sin(time + 2) * 6}, ${182 + Math.sin(time) * 30}, ${212 + Math.sin(time + 1) * 30}, 0.4)`,
      accent: `rgba(${168 + Math.sin(time + 1) * 30}, ${85 + Math.sin(time + 2) * 30}, ${247 + Math.sin(time) * 8}, 0.45)`
    });
  }, [isPlaying]);

  // Start/stop ambient color extraction
  useEffect(() => {
    if (isPlaying) {
      ambientIntervalRef.current = setInterval(extractVideoColors, 100);
      return () => {
        if (ambientIntervalRef.current) clearInterval(ambientIntervalRef.current);
      };
    }
  }, [isPlaying, extractVideoColors]);

  // =============================================================================
  // STICKY MODE LOGIC - IntersectionObserver
  // =============================================================================
  useEffect(() => {
    const elementToObserve = placeholderRef.current;
    if (!elementToObserve) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visibilityRatio = entry.intersectionRatio;

          console.log(`[Sticky] Visibility: ${(visibilityRatio * 100).toFixed(0)}%, Playing: ${isPlaying}, Sticky: ${isSticky}`);

          // Prevent rapid toggles
          if (stickyLocked.current) return;

          // GO STICKY: When <50% visible AND video is playing
          if (!isSticky && isPlaying && visibilityRatio < STICKY_THRESHOLD) {
            console.log('[Sticky] Going STICKY - video >50% hidden');
            stickyLocked.current = true;
            setIsSticky(true);
            setTimeout(() => { stickyLocked.current = false; }, 600);
          }

          // RETURN TO NORMAL: When >70% visible
          if (isSticky && visibilityRatio > RETURN_THRESHOLD) {
            console.log('[Sticky] Returning to NORMAL - video >70% visible');
            stickyLocked.current = true;
            setIsSticky(false);
            setTimeout(() => { stickyLocked.current = false; }, 600);
          }
        });
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '0px'
      }
    );

    observer.observe(elementToObserve);
    return () => observer.disconnect();
  }, [isPlaying, isSticky]);

  // Handle click to play/pause
  const handleVideoClick = useCallback(() => {
    const player = getMuxPlayer();
    if (!player) return;

    const isPaused = player.paused;

    if (isPaused) {
      player.volume = AUTO_PLAY_VOLUME;
      player.muted = false;
      setVolume(AUTO_PLAY_VOLUME);
      setIsMuted(false);
      setAudioUnlocked(true);

      player.play()?.then(() => {
        setIsPlaying(true);
        hasAutoPlayed.current = true;
      }).catch(() => {
        player.muted = true;
        setIsMuted(true);
        player.play()?.then(() => {
          setIsPlaying(true);
          hasAutoPlayed.current = true;
        });
      });
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [getMuxPlayer]);

  // Fullscreen on double-click
  const handleDoubleClick = useCallback(() => {
    const player = getMuxPlayer();
    if (!player) return;

    const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);

    if (isFullscreen) {
      document.exitFullscreen?.() || (document as any).webkitExitFullscreen?.();
    } else {
      const el = videoContainerRef.current || player;
      el?.requestFullscreen?.() || (el as any)?.webkitRequestFullscreen?.();
    }
  }, [getMuxPlayer]);

  // Video ready handler
  const handleVideoLoaded = useCallback(() => {
    setTimeout(() => setIsVideoReady(true), 300);
  }, []);

  // Auto-play when ready (mobile only)
  useEffect(() => {
    if (!isVideoReady || hasAutoPlayed.current || !isMobile) return;

    const checkAndPlay = () => {
      const player = getMuxPlayer();
      if (!player) {
        setTimeout(checkAndPlay, 300);
        return;
      }

      const rect = placeholderRef.current?.getBoundingClientRect();
      if (rect) {
        const visibleHeight = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
        const visibility = visibleHeight / rect.height;
        if (visibility > 0.5) {
          attemptAutoPlay();
        }
      }
    };

    setTimeout(checkAndPlay, 600);
  }, [isVideoReady, isMobile, attemptAutoPlay, getMuxPlayer]);

  const handleVideoEnd = useCallback(() => {
    localStorage.setItem(`video_seen:${lessonId}`, 'completed');
    setIsPlaying(false);
    setIsSticky(false);
    onVideoComplete?.();
  }, [lessonId, onVideoComplete]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const player = getMuxPlayer();
    if (player) {
      const newMuted = !player.muted;
      player.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted) player.volume = volume;
    }
  }, [volume, getMuxPlayer]);

  // =============================================================================
  // MINIMIZE & FULLSCREEN CONTROLS
  // =============================================================================

  // Minimize: Just HIDE the sticky panel - stay where you are
  // Video will re-activate when scrolling back up past the placeholder
  const handleMinimize = useCallback(() => {
    if (!isSticky) return;
    console.log('[Video] Minimizing - hiding sticky panel (no scroll)');
    stickyLocked.current = true;
    setIsSticky(false);
    // Lock for longer to prevent immediate re-sticky when still scrolled down
    setTimeout(() => { stickyLocked.current = false; }, 1500);
    // NO scrollIntoView - user stays where they are
  }, [isSticky]);

  // Fullscreen toggle - with mobile-specific APIs
  const handleFullscreen = useCallback(() => {
    const player = getMuxPlayer();
    if (!player) return;

    // Check current fullscreen state
    const isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (isFullscreen) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    } else {
      // Enter fullscreen - try multiple approaches for mobile compatibility
      // 1. Try the video element directly (works better on mobile)
      const videoEl = player.querySelector('video') || player;

      // 2. iOS Safari uses webkitEnterFullscreen on video element
      if ((videoEl as any).webkitEnterFullscreen) {
        (videoEl as any).webkitEnterFullscreen();
        return;
      }

      // 3. Try webkitRequestFullscreen (iOS Safari newer versions)
      if ((videoEl as any).webkitRequestFullscreen) {
        (videoEl as any).webkitRequestFullscreen();
        return;
      }

      // 4. Standard requestFullscreen
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen();
        return;
      }

      // 5. Fallback to container
      const container = videoContainerRef.current;
      if (container) {
        if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        } else if (container.requestFullscreen) {
          container.requestFullscreen();
        }
      }
    }
  }, [getMuxPlayer]);

  // =============================================================================
  // MOBILE TOUCH GESTURES: Swipe to minimize + Double tap for fullscreen
  // =============================================================================

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    setIsTouching(true); // Pause float animation during touch
    if (!isSticky) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, [isMobile, isSticky]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    setIsTouching(false); // Resume float animation

    const touch = e.changedTouches[0];
    const now = Date.now();

    // Double tap detection for fullscreen (300ms threshold)
    if (now - lastTapRef.current < 300) {
      handleFullscreen();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // Swipe detection for minimize with visual animation (only when sticky)
    if (isSticky && touchStartRef.current) {
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine swipe direction and trigger animation
      let direction: 'up' | 'left' | 'right' | null = null;

      // Swipe up (threshold: 50px upward)
      if (absY > 50 && deltaY < 0 && absY > absX) {
        direction = 'up';
      }
      // Swipe left (threshold: 80px)
      else if (absX > 80 && deltaX < 0) {
        direction = 'left';
      }
      // Swipe right (threshold: 80px)
      else if (absX > 80 && deltaX > 0) {
        direction = 'right';
      }

      // If valid swipe, trigger dismiss animation then hide
      if (direction) {
        console.log(`[Video] Swipe ${direction} detected - animating dismiss`);
        setDismissDirection(direction);
        stickyLocked.current = true;

        // Wait for animation to complete (300ms) then hide
        setTimeout(() => {
          setIsSticky(false);
          setDismissDirection('none');
          // Extended lock to prevent immediate re-sticky
          setTimeout(() => { stickyLocked.current = false; }, 1500);
        }, 300);
      }
    }

    touchStartRef.current = null;
  }, [isMobile, isSticky, handleFullscreen]);

  // Handle touch cancel - reset state
  const handleTouchCancel = useCallback(() => {
    setIsTouching(false);
    touchStartRef.current = null;
  }, []);

  // Ambient gradient
  const ambientGradient = `
    radial-gradient(ellipse 120% 100% at 50% 50%, ${ambientColors.dominant} 0%, transparent 50%),
    radial-gradient(ellipse 80% 60% at 20% 30%, ${ambientColors.secondary} 0%, transparent 45%),
    radial-gradient(ellipse 80% 60% at 80% 70%, ${ambientColors.accent} 0%, transparent 45%)
  `;

  // =============================================================================
  // RENDER - WITH PORTAL TO ESCAPE BACKDROP-FILTER
  // =============================================================================

  // Compute video container styles - ALWAYS fixed to escape backdrop-filter
  // Use placeholder width for sticky to maintain consistent size
  const stickyWidth = placeholderRect?.width || 400;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 500;

  // Calculate sticky width for centering
  const computedStickyWidth = Math.min(stickyWidth, windowWidth - 32);

  // Determine which animation to use
  const getStickyAnimation = () => {
    // If dismissing, use the dismiss animation
    if (dismissDirection !== 'none') {
      const animationMap = {
        up: 'dismissUp 0.3s ease-out forwards',
        left: 'dismissLeft 0.3s ease-out forwards',
        right: 'dismissRight 0.3s ease-out forwards',
      };
      return animationMap[dismissDirection];
    }
    // If touching, no animation (prevents vibration)
    if (isTouching) {
      return 'none';
    }
    // Normal floating animation
    return 'floatVideo 4s ease-in-out infinite';
  };

  const videoStyles: React.CSSProperties = isSticky
    ? {
        // STICKY: Fixed below navbar - centered with calc to avoid transform conflict
        position: 'fixed',
        top: NAVBAR_HEIGHT + STICKY_TOP_OFFSET,
        left: `calc(50% - ${computedStickyWidth / 2}px)`,
        width: computedStickyWidth,
        zIndex: 9999,
        // Animation: dismiss, none (touching), or float
        animation: getStickyAnimation(),
        // Shadow for sticky mode - prominent and visible
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
      }
    : placeholderRect
    ? {
        // NORMAL: Fixed at placeholder position (simulates being in place)
        position: 'fixed',
        top: placeholderRect.top,
        left: placeholderRect.left,
        width: placeholderRect.width,
        height: placeholderRect.height,
        zIndex: 50,
        // Shadow for normal mode - subtle but visible
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
      }
    : {
        // FALLBACK before rect is calculated - HIDDEN to prevent "jump"
        // Video will appear once placeholderRect is calculated (within ~100ms)
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        maxWidth: '600px',
        opacity: 0, // CRITICAL: Hidden until rect is calculated
        pointerEvents: 'none',
        zIndex: -1,
      };

  // The video element - extracted for portal usage
  const videoElement = (
    <div
      ref={videoContainerRef}
      style={{
        ...videoStyles,
        // Ensure no background bleeds through corners
        borderRadius: '1.5rem',
        overflow: 'hidden',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div
        className="relative w-full h-full overflow-hidden rounded-3xl cursor-pointer"
        style={{
          boxShadow: '0 0 15px rgba(0,0,0,0.4), 0 0 25px rgba(0,0,0,0.3)',
          ...(isSticky ? { aspectRatio: '16/9' } : {}),
          borderRadius: '1.5rem',
          overflow: 'hidden',
        }}
        onClick={handleVideoClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Video with 16:9 aspect ratio - NO background color to avoid corner artifacts */}
        <div className="relative w-full h-full" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
          <div id={muxPlayerId} className="absolute inset-0" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
            <MuxPlayer
              playbackId={muxPlaybackId}
              streamType="on-demand"
              autoPlay={false}
              muted={isMuted}
              playsInline
              onLoadedData={handleVideoLoaded}
              onCanPlay={handleVideoLoaded}
              onEnded={handleVideoEnd}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                borderRadius: '1.5rem',
                '--controls': 'none',
                '--media-object-fit': 'cover',
                '--media-object-position': 'center',
              } as any}
              metadata={{
                video_title: title || 'CryptoGift Video',
                video_series: 'CryptoGift Educational'
              }}
            />
          </div>

          {/* Play overlay when paused */}
          {!isPlaying && isVideoReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 animate-pulse">
                <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
              </div>
              <div className="mt-4 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                <span className="text-white text-sm font-medium">
                  {isMobile ? 'Tap to play' : 'Click to play'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* MINIMIZE button - only visible when sticky (top-left, discrete) */}
        {isSticky && (
          <button
            onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
            className="absolute top-3 left-3 z-30 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:bg-black/60 hover:text-white transition-all shadow-lg border border-white/10"
            title="Return to original position"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}

        {/* Control buttons container - top-right */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {/* Fullscreen button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
            className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all shadow-lg border border-white/10"
            title="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          {/* Volume control button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all shadow-lg border border-white/10"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{animationStyles}</style>

      {/* SPACE HOLDER - Always reserves space with 16:9 ratio */}
      <div
        ref={placeholderRef}
        className={`relative w-full max-w-2xl mx-auto ${className}`}
        style={{ paddingBottom: '56.25%', height: 0 }}
      >
        {/* Placeholder visual when video is floating */}
        {isSticky && (
          <div
            className="absolute inset-0 rounded-3xl border border-white/5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(15,15,25,0.3) 0%, rgba(5,5,15,0.3) 100%)' }}
          >
            <div className="text-center opacity-40">
              <svg className="w-8 h-8 text-white/30 mx-auto mb-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <p className="text-white/30 text-sm">Video playing above</p>
            </div>
          </div>
        )}

        {/* VIDEO via PORTAL to body - escapes backdrop-filter containers */}
        {portalReady && typeof document !== 'undefined'
          ? createPortal(videoElement, document.body)
          : videoElement
        }
      </div>

      {/* Elements outside the space holder (not affected by sticky) */}
      {!isSticky && (
        <div className="max-w-2xl mx-auto">
          <div className="mt-3">
            <VideoExperienceHint />
          </div>
          {description && (
            <p className="text-center text-sm text-cyan-300/80 mt-3 max-w-md mx-auto" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              {description}
            </p>
          )}
        </div>
      )}
    </>
  );
}

export default EmbeddedVideoDevice;
