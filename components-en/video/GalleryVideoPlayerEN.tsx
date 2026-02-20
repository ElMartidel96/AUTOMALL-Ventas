'use client';

/**
 * GalleryVideoPlayer EN - Single video player with sticky mode
 *
 * Features (same as VideoCarousel):
 * - Portal rendering for smooth sticky transitions
 * - Sticky mode when scrolling down (video <50% visible)
 * - Swipe gestures: UP/LEFT/RIGHT dismiss, DOWN fullscreen (mobile)
 * - Double-tap fullscreen (mobile)
 * - Minimize/Fullscreen/Volume buttons in sticky mode
 * - Float animation in both modes
 * - Click anywhere to play with audio (PC)
 * - Auto-play with audio (mobile)
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Play, Maximize2, Volume2, VolumeX, Minimize2 } from 'lucide-react';

// Configuration
const AUTO_PLAY_VOLUME = 0.15;
const STICKY_THRESHOLD = 0.50;
const RETURN_THRESHOLD = 0.70;
const NAVBAR_HEIGHT = 54;
const STICKY_TOP_OFFSET = 40;

// CSS Keyframes for animations
const animationStyles = `
  @keyframes galleryDismissUp {
    0% { opacity: 1; transform: translate(var(--swipe-x, 0px), var(--swipe-y, 0px)) scale(1); }
    100% { opacity: 0; transform: translate(var(--swipe-x, 0px), -100vh) scale(0.85); }
  }
  @keyframes galleryDismissLeft {
    0% { opacity: 1; transform: translate(var(--swipe-x, 0px), var(--swipe-y, 0px)) scale(1); }
    100% { opacity: 0; transform: translate(-100vw, var(--swipe-y, 0px)) scale(0.85); }
  }
  @keyframes galleryDismissRight {
    0% { opacity: 1; transform: translate(var(--swipe-x, 0px), var(--swipe-y, 0px)) scale(1); }
    100% { opacity: 0; transform: translate(100vw, var(--swipe-y, 0px)) scale(0.85); }
  }
  @keyframes galleryFloatSticky {
    0%, 100% { margin-top: 0px; }
    50% { margin-top: -8px; }
  }
  @keyframes galleryFloatNormal {
    0%, 100% { margin-top: 0px; }
    50% { margin-top: -6px; }
  }
`;

// Lazy load MUX Player
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black/50 animate-pulse rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    )
  }
);

interface GalleryVideoPlayerProps {
  muxPlaybackId: string;
  title?: string;
  onEnded?: () => void;
}

export default function GalleryVideoPlayerEN({
  muxPlaybackId,
  title = 'CRYPTOGIFT DAO GALLERY',
  onEnded,
}: GalleryVideoPlayerProps) {
  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [placeholderRect, setPlaceholderRect] = useState<DOMRect | null>(null);

  // Animation states
  const [dismissDirection, setDismissDirection] = useState<'none' | 'up' | 'left' | 'right'>('none');
  const [isTouching, setIsTouching] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSwipingVideo, setIsSwipingVideo] = useState(false);

  // Refs
  const placeholderRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoPlayed = useRef(false);
  const stickyLocked = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('up');
  const initialDocTop = useRef<number>(0);
  const audioUnlocked = useRef(false);

  const muxPlayerId = `mux-gallery-${muxPlaybackId.substring(0, 8)}`;

  // Detect Mobile
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

  // Portal ready
  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Track scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollDirection.current = currentScrollY > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update placeholder rect for positioning
  useEffect(() => {
    if (!placeholderRef.current) return;

    let measurementCount = 0;
    let lastLeft = -9999;
    let lastTop = -9999;
    let stableTimer: ReturnType<typeof setTimeout>;

    const measure = () => {
      if (!placeholderRef.current) return;
      const rect = placeholderRef.current.getBoundingClientRect();

      const isStable = measurementCount > 0 &&
        Math.abs(rect.left - lastLeft) < 1 &&
        Math.abs(rect.top - lastTop) < 1;

      if (isStable) {
        setPlaceholderRect(rect);
        initialDocTop.current = rect.top + window.scrollY;
        return;
      }

      lastLeft = rect.left;
      lastTop = rect.top;
      measurementCount++;

      if (measurementCount < 15) {
        stableTimer = setTimeout(measure, 50);
      } else {
        setPlaceholderRect(rect);
        initialDocTop.current = rect.top + window.scrollY;
      }
    };

    requestAnimationFrame(measure);

    const handleResize = () => {
      measurementCount = 0;
      lastLeft = -9999;
      lastTop = -9999;
      measure();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(stableTimer);
    };
  }, []);

  // Update video Y position using RAF
  useEffect(() => {
    if (isSticky) return;

    let rafId: number;
    let lastScroll = window.scrollY;

    const updateVideoPosition = () => {
      if (window.scrollY !== lastScroll) {
        lastScroll = window.scrollY;
        if (videoContainerRef.current) {
          const currentTop = initialDocTop.current - window.scrollY;
          videoContainerRef.current.style.transform = `translateY(${currentTop}px)`;
        }
      }
      rafId = requestAnimationFrame(updateVideoPosition);
    };

    rafId = requestAnimationFrame(updateVideoPosition);
    return () => cancelAnimationFrame(rafId);
  }, [isSticky]);

  // Get MuxPlayer
  const getMuxPlayer = useCallback((): any => {
    if (typeof document === 'undefined') return null;
    const wrapper = document.getElementById(muxPlayerId);
    if (!wrapper) return null;
    return wrapper.querySelector('mux-player');
  }, [muxPlayerId]);

  // Sticky mode logic
  useEffect(() => {
    const elementToObserve = placeholderRef.current;
    if (!elementToObserve) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio;
          if (stickyLocked.current) return;

          if (!isSticky && isPlaying && ratio < STICKY_THRESHOLD && scrollDirection.current === 'down') {
            stickyLocked.current = true;
            setIsSticky(true);
            setTimeout(() => { stickyLocked.current = false; }, 600);
          }

          if (isSticky && ratio > RETURN_THRESHOLD) {
            stickyLocked.current = true;
            setIsSticky(false);
            setTimeout(() => { stickyLocked.current = false; }, 600);
          }
        });
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], rootMargin: '0px' }
    );

    observer.observe(elementToObserve);
    return () => observer.disconnect();
  }, [isPlaying, isSticky]);

  // Click anywhere to unlock audio
  useEffect(() => {
    const attemptAutoplayWithAudio = () => {
      if (hasAutoPlayed.current) return;
      const player = getMuxPlayer();
      if (!player) return;

      player.volume = AUTO_PLAY_VOLUME;
      player.muted = false;

      player.play()?.then(() => {
        hasAutoPlayed.current = true;
        audioUnlocked.current = true;
        setIsPlaying(true);
        setIsMuted(false);
      }).catch(() => {});
    };

    const handleUserInteraction = () => {
      if (audioUnlocked.current) return;
      audioUnlocked.current = true;

      if (placeholderRef.current && !hasAutoPlayed.current) {
        const rect = placeholderRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isVisible) {
          setTimeout(attemptAutoplayWithAudio, 50);
        }
      }
    };

    document.addEventListener('click', handleUserInteraction, { passive: true, capture: true });
    document.addEventListener('touchstart', handleUserInteraction, { passive: true, capture: true });
    document.addEventListener('keydown', handleUserInteraction, { passive: true, capture: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction, { capture: true });
      document.removeEventListener('touchstart', handleUserInteraction, { capture: true });
      document.removeEventListener('keydown', handleUserInteraction, { capture: true });
    };
  }, [getMuxPlayer]);

  // Auto-play when visible
  useEffect(() => {
    if (!placeholderRef.current || hasAutoPlayed.current) return;

    const attemptAutoplay = () => {
      if (hasAutoPlayed.current) return;
      const player = getMuxPlayer();
      if (!player) return;

      player.volume = AUTO_PLAY_VOLUME;
      player.muted = false;

      player.play()?.then(() => {
        hasAutoPlayed.current = true;
        audioUnlocked.current = true;
        setIsPlaying(true);
        setIsMuted(false);
      }).catch(() => {
        if (isMobile) {
          player.muted = true;
          player.play()?.then(() => {
            hasAutoPlayed.current = true;
            setIsPlaying(true);
            setIsMuted(true);
          }).catch(() => {});
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio > 0.5 && !hasAutoPlayed.current) {
            attemptAutoplay();
          }
        });
      },
      { threshold: [0.5] }
    );

    observer.observe(placeholderRef.current);
    return () => observer.disconnect();
  }, [isMobile, getMuxPlayer]);

  // Handlers
  const handleVideoClick = useCallback(() => {
    const player = getMuxPlayer();
    if (!player) return;

    if (player.paused) {
      player.volume = AUTO_PLAY_VOLUME;
      player.muted = false;
      player.play()?.then(() => {
        setIsPlaying(true);
        setIsMuted(false);
        hasAutoPlayed.current = true;
        audioUnlocked.current = true;
      }).catch(() => {
        player.muted = true;
        player.play()?.then(() => {
          setIsPlaying(true);
          setIsMuted(true);
          hasAutoPlayed.current = true;
        });
      });
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [getMuxPlayer]);

  const handleDoubleClick = useCallback(() => {
    const player = getMuxPlayer();
    if (!player) return;

    const isFullscreen = !!document.fullscreenElement;
    if (isFullscreen) {
      document.exitFullscreen?.();
    } else {
      const videoEl = player.querySelector('video') || player;
      if ((videoEl as any).webkitEnterFullscreen) {
        (videoEl as any).webkitEnterFullscreen();
      } else if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen();
      }
    }
  }, [getMuxPlayer]);

  const toggleMute = useCallback(() => {
    const player = getMuxPlayer();
    if (player) {
      const newMuted = !player.muted;
      player.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted) player.volume = AUTO_PLAY_VOLUME;
    }
  }, [getMuxPlayer]);

  const handleMinimize = useCallback(() => {
    if (!isSticky) return;
    stickyLocked.current = true;
    setIsSticky(false);
    setTimeout(() => { stickyLocked.current = false; }, 1500);
  }, [isSticky]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    setIsTouching(true);
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    if (isSticky) {
      setIsSwipingVideo(true);
      setSwipeOffset({ x: 0, y: 0 });
    }
  }, [isMobile, isSticky]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (isSticky && isSwipingVideo) {
      setSwipeOffset({ x: deltaX, y: deltaY });
    }
  }, [isMobile, isSticky, isSwipingVideo]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    setIsTouching(false);
    setIsSwipingVideo(false);

    const touch = e.changedTouches[0];
    const now = Date.now();
    const isFullscreen = !!document.fullscreenElement;

    // Double tap for fullscreen
    if (!isFullscreen && now - lastTapRef.current < 300) {
      setSwipeOffset({ x: 0, y: 0 });
      handleDoubleClick();
      lastTapRef.current = 0;
      touchStartRef.current = null;
      return;
    }
    lastTapRef.current = now;

    if (!touchStartRef.current) {
      setSwipeOffset({ x: 0, y: 0 });
      touchStartRef.current = null;
      return;
    }

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Swipe DOWN in fullscreen -> exit
    if (isFullscreen && absY > 80 && deltaY > 0 && absY > absX) {
      setSwipeOffset({ x: 0, y: 0 });
      document.exitFullscreen?.();
      touchStartRef.current = null;
      return;
    }

    // Swipe gestures in sticky mode
    if (isSticky) {
      // Swipe DOWN -> enter fullscreen
      if (absY > 60 && deltaY > 0 && absY > absX) {
        setSwipeOffset({ x: 0, y: 0 });
        handleDoubleClick();
        touchStartRef.current = null;
        return;
      }

      // Swipe UP/LEFT/RIGHT -> dismiss
      let direction: 'up' | 'left' | 'right' | null = null;
      const dismissThreshold = 40;

      if (absY > dismissThreshold && deltaY < 0 && absY > absX) direction = 'up';
      else if (absX > dismissThreshold && deltaX < 0) direction = 'left';
      else if (absX > dismissThreshold && deltaX > 0) direction = 'right';

      if (direction) {
        setDismissDirection(direction);
        stickyLocked.current = true;

        setTimeout(() => {
          setIsSticky(false);
          setDismissDirection('none');
          setSwipeOffset({ x: 0, y: 0 });
          setTimeout(() => { stickyLocked.current = false; }, 1500);
        }, 200);
      } else {
        setSwipeOffset({ x: 0, y: 0 });
      }
    } else {
      setSwipeOffset({ x: 0, y: 0 });
    }

    touchStartRef.current = null;
  }, [isMobile, isSticky, handleDoubleClick]);

  const handleTouchCancel = useCallback(() => {
    setIsTouching(false);
    setIsSwipingVideo(false);
    setSwipeOffset({ x: 0, y: 0 });
    touchStartRef.current = null;
  }, []);

  // Animation for sticky
  const getStickyAnimation = useCallback(() => {
    if (dismissDirection !== 'none') {
      const map = {
        up: 'galleryDismissUp 0.2s ease-out forwards',
        left: 'galleryDismissLeft 0.2s ease-out forwards',
        right: 'galleryDismissRight 0.2s ease-out forwards'
      };
      return map[dismissDirection];
    }
    if (isTouching) return 'none';
    return 'galleryFloatSticky 4s ease-in-out infinite';
  }, [dismissDirection, isTouching]);

  // Calculate dimensions
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 500;
  const stickyWidth = Math.min(400, windowWidth - 32);

  // Video styles
  const currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
  const swipeDistance = Math.abs(swipeOffset.x) + Math.abs(swipeOffset.y);
  const swipeOpacity = isSwipingVideo ? Math.max(0.3, 1 - swipeDistance / 200) : 1;
  const showSwipeTransform = swipeOffset.x !== 0 || swipeOffset.y !== 0;
  const isDismissing = dismissDirection !== 'none';

  const videoStyles: React.CSSProperties = isSticky
    ? {
        position: 'fixed',
        top: NAVBAR_HEIGHT + STICKY_TOP_OFFSET,
        left: `calc(50% - ${stickyWidth / 2}px)`,
        width: stickyWidth,
        zIndex: 9999,
        '--swipe-x': `${swipeOffset.x}px`,
        '--swipe-y': `${swipeOffset.y}px`,
        transform: isDismissing
          ? undefined
          : showSwipeTransform
            ? `translate(${swipeOffset.x}px, ${swipeOffset.y}px)`
            : undefined,
        opacity: isDismissing ? undefined : swipeOpacity,
        animation: isDismissing
          ? getStickyAnimation()
          : (isSwipingVideo || showSwipeTransform)
            ? 'none'
            : getStickyAnimation(),
        transition: isTouching || isDismissing
          ? 'none'
          : 'transform 0.2s ease-out, opacity 0.2s ease-out',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        overflow: 'hidden',
      } as React.CSSProperties
    : placeholderRect
    ? {
        position: 'fixed',
        top: 0,
        left: isMobile
          ? `calc(50% - ${placeholderRect.width / 2}px)`
          : placeholderRect.left,
        width: placeholderRect.width,
        height: placeholderRect.height,
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: '1rem',
        overflow: 'hidden',
        willChange: 'transform',
        transform: `translateY(${initialDocTop.current - currentScrollY}px)`,
        animation: 'galleryFloatNormal 4s ease-in-out infinite',
      }
    : {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '1rem',
        overflow: 'hidden',
      };

  // Video element (always in portal)
  const videoElement = (
    <div
      ref={videoContainerRef}
      style={videoStyles}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl">
        {/* Video area */}
        <div
          className="relative flex-1 cursor-pointer bg-black"
          style={{ aspectRatio: '16/9' }}
          onClick={handleVideoClick}
          onDoubleClick={handleDoubleClick}
        >
          <div id={muxPlayerId} className="absolute inset-0">
            <MuxPlayer
              playbackId={muxPlaybackId}
              streamType="on-demand"
              autoPlay={false}
              muted={isMuted}
              playsInline
              onEnded={onEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{
                width: '100%',
                height: '100%',
                '--controls': 'none',
                objectFit: 'cover',
                '--media-object-fit': 'cover',
              } as any}
              className="w-full h-full object-cover"
              metadata={{
                video_title: title,
                video_series: "CryptoGift Educational"
              }}
            />
          </div>

          {/* Play overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
              <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          )}

          {/* Sticky controls */}
          {isSticky && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
                className="absolute top-3 left-3 z-30 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:bg-black/60 hover:text-white transition-all shadow-lg border border-white/10"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDoubleClick(); }}
                  className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all shadow-lg border border-white/10"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all shadow-lg border border-white/10"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}

          {/* Normal mode volume control */}
          {!isSticky && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="absolute bottom-3 right-3 z-20 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:bg-black/50 hover:text-white transition-all"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{animationStyles}</style>

      {/* Placeholder - reserves space */}
      <div
        ref={placeholderRef}
        className="relative rounded-xl overflow-hidden"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Visual placeholder when sticky */}
        {isSticky && (
          <div
            className="absolute inset-0 rounded-xl border border-white/5 flex items-center justify-center"
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
      </div>

      {/* Video via portal */}
      {portalReady && placeholderRect && typeof document !== 'undefined' && createPortal(videoElement, document.body)}
    </>
  );
}
