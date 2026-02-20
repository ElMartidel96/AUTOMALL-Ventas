'use client';

/**
 * VideoCarousel - Glass crystal video carousel for landing page
 *
 * ARCHITECTURE (Based on EmbeddedVideoDevice pattern that WORKS):
 * - Video ALWAYS in portal (never remounts = no flasheo)
 * - NORMAL MODE: Video positioned fixed over placeholder, floating words visible
 * - STICKY MODE: Video floats to top, navigation arrows inside video
 * - Rubber band effect applies to placeholder + floating words container
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Play, Maximize2, Volume2, VolumeX, Minimize2 } from 'lucide-react';
import { VideoExperienceHint } from '@/components/ui/RotatePhoneHint';

// Configuration
const AUTO_PLAY_VOLUME = 0.15;
const STICKY_THRESHOLD = 0.50;
const RETURN_THRESHOLD = 0.70;
const NAVBAR_HEIGHT = 54;
const STICKY_TOP_OFFSET = 40;

// CSS Keyframes - CRITICAL: Dismiss animations use CSS custom properties for dynamic start position
const animationStyles = `
  @keyframes dismissUp {
    0% { opacity: 1; transform: translate(var(--swipe-x, 0px), var(--swipe-y, 0px)) scale(1); }
    100% { opacity: 0; transform: translate(var(--swipe-x, 0px), -100vh) scale(0.85); }
  }
  @keyframes dismissLeft {
    0% { opacity: 1; transform: translate(var(--swipe-x, 0px), var(--swipe-y, 0px)) scale(1); }
    100% { opacity: 0; transform: translate(-100vw, var(--swipe-y, 0px)) scale(0.85); }
  }
  @keyframes dismissRight {
    0% { opacity: 1; transform: translate(var(--swipe-x, 0px), var(--swipe-y, 0px)) scale(1); }
    100% { opacity: 0; transform: translate(100vw, var(--swipe-y, 0px)) scale(0.85); }
  }
  @keyframes floatVideoSticky {
    0%, 100% { margin-top: 0px; }
    50% { margin-top: -8px; }
  }
  @keyframes floatVideoNormal {
    0%, 100% { margin-top: 0px; }
    50% { margin-top: -6px; }
  }
  @keyframes floatWord {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
`;

/**
 * Custom hook for horizontal rubber band overscroll effect
 */
function useHorizontalOverscroll() {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalGesture = useRef<boolean | null>(null);
  const isDragging = useRef(false);
  const targetPosition = useRef(0);
  const currentPosition = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const lastWheelTime = useRef(0);
  const isWheelActive = useRef(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const resistance = 0.5;
    const maxTranslate = 140;

    const animate = () => {
      const now = Date.now();
      const timeSinceLastWheel = now - lastWheelTime.current;

      if (timeSinceLastWheel > 100 && isWheelActive.current) {
        targetPosition.current *= 0.92;
        if (Math.abs(targetPosition.current) < 0.5) {
          targetPosition.current = 0;
          isWheelActive.current = false;
        }
      }

      const diff = targetPosition.current - currentPosition.current;
      currentPosition.current += diff * 0.15;

      if (Math.abs(currentPosition.current) > 0.1 || isWheelActive.current) {
        const translateAmount = Math.min(Math.abs(currentPosition.current), maxTranslate);
        const direction = currentPosition.current > 0 ? 1 : -1;
        setTranslateX(translateAmount * direction);
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        currentPosition.current = 0;
        setTranslateX(0);
        animationFrame.current = null;
      }
    };

    const startAnimation = () => {
      if (!animationFrame.current) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isHorizontalGesture.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = startX.current - touchX;
      const deltaY = startY.current - touchY;

      if (isHorizontalGesture.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        isHorizontalGesture.current = Math.abs(deltaX) > Math.abs(deltaY);
      }

      if (isHorizontalGesture.current === true) {
        e.preventDefault();
        const translateAmount = Math.min(Math.abs(deltaX) * resistance, maxTranslate);
        setTranslateX(deltaX > 0 ? -translateAmount : translateAmount);
      }
    };

    const handleTouchEnd = () => {
      setTranslateX(0);
      isHorizontalGesture.current = null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;
      isHorizontalGesture.current = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = startX.current - e.clientX;
      const deltaY = startY.current - e.clientY;

      if (isHorizontalGesture.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        isHorizontalGesture.current = Math.abs(deltaX) > Math.abs(deltaY);
      }

      if (isHorizontalGesture.current === true) {
        e.preventDefault();
        const translateAmount = Math.min(Math.abs(deltaX) * resistance, maxTranslate);
        setTranslateX(deltaX > 0 ? -translateAmount : translateAmount);
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        setTranslateX(0);
        isDragging.current = false;
        isHorizontalGesture.current = null;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 1) {
        e.preventDefault();
        lastWheelTime.current = Date.now();
        isWheelActive.current = true;
        targetPosition.current -= e.deltaX * 0.8;
        targetPosition.current = Math.max(-maxTranslate, Math.min(maxTranslate, targetPosition.current));
        startAnimation();
      }
    };

    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    } else {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (isMobile) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      } else {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('wheel', handleWheel);
      }
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return translateX;
}

// Lazy load MUX Player
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then(mod => mod.default),
  { ssr: false, loading: () => <div className="w-full h-full bg-black/50 animate-pulse rounded-xl" /> }
);

// Video configurations
const VIDEOS = {
  es: [
    { id: 'the-gift', muxPlaybackId: '02Sx72OAZtSl1ai3NTVTT3Cnd1LN6Xo2QpwNlRCQBAYI', title: '01. El Regalo', description: 'El primer paso hacia la confianza real', duration: '1 min' },
    { id: 'the-solution', muxPlaybackId: 'w4Vc301lPESPjSzw4RropH7EtQ5wUt4ETlLZTd01ipcd4', title: '02. La Solución', description: '5 contratos verificados. 717+ transacciones on-chain', duration: '2 min' },
    { id: 'the-opportunity', muxPlaybackId: 'kW3Qjf32XNK1XnNQBtTVT68SDJrIk2m502MUrrJwzoyE', title: '03. La Oportunidad', description: 'Tu invitación al futuro de Web3', duration: '3 min' },
    { id: 'gallery-es', muxPlaybackId: 'lsT00V7M302d9EIrKr9vUaVTnxvee3q15yF1OUKZYFpMc', title: 'Gallery', description: 'Oportunidades exclusivas del CryptoGift Club', duration: '2 min' },
    { id: 'demo', muxPlaybackId: 'FCb1PkEnWapDI01wHXObphFgQPa4PY8zK5akxw2o7DcE', title: 'Demo: Crear y Reclamar', description: 'Demo del proceso de creación y reclamación', duration: '1 min' },
  ],
  en: [
    { id: 'the-gift', muxPlaybackId: 'Y02PN1hp8Wu2bq7MOBR3YZlyQ7uoF02Bm01lnFVE5y018i4', title: '01. The Gift', description: 'The first step toward real trust', duration: '1 min' },
    { id: 'the-solution', muxPlaybackId: 'sCdMXnMSw00F6ZOvbN6Zr4A8YUbINEHslDGaWACdaxr8', title: '02. The Solution', description: '5 verified contracts. 717+ on-chain transactions', duration: '2 min' },
    { id: 'the-opportunity', muxPlaybackId: 'Jq01802JfkUoWINtzf5e00UmPD53RLFvtfsCiXvv00t1HFE', title: '03. The Opportunity', description: 'Your invitation to the future of Web3', duration: '3 min' },
    { id: 'gallery-en', muxPlaybackId: 'ntscvAUpAGeSDLi00Yc383JpC028dAT5o5OqeBohx01sMI', title: 'Gallery', description: 'Exclusive CryptoGift Club opportunities', duration: '2 min' },
    { id: 'demo', muxPlaybackId: 'FCb1PkEnWapDI01wHXObphFgQPa4PY8zK5akxw2o7DcE', title: 'Demo: Create & Claim', description: 'Demo of the creation and claiming process', duration: '1 min' },
  ],
};

// Floating words
const FLOATING_WORDS = {
  right: [
    { text: 'Open', color: 'purple', top: -24, offset: -80, delay: 0.5, duration: 4 },
    { text: 'Secure', color: 'blue', top: 16, offset: -112, delay: 1, duration: 5 },
    { text: 'Human', color: 'rose', top: 80, offset: -96, delay: 0.2, duration: 4.5 },
    { text: 'Gift in 5 min', color: 'cyan', top: 144, offset: -128, delay: 1.5, duration: 5.5 },
    { text: 'Easy claim', color: 'teal', bottom: 48, offset: -80, delay: 0.7, duration: 4.3 },
    { text: 'Base L2', color: 'sky', bottom: 112, offset: -144, delay: 1.8, duration: 5.8 },
  ],
  left: [
    { text: 'No gas', color: 'emerald', top: -32, offset: -96, delay: 0.8, duration: 5 },
    { text: 'No complications', color: 'amber', top: 24, offset: -128, delay: 0.3, duration: 4.2 },
    { text: 'No fear', color: 'green', top: 96, offset: -112, delay: 1.2, duration: 5.2 },
    { text: '100% yours', color: 'indigo', top: 160, offset: -144, delay: 0.6, duration: 4.8 },
    { text: 'Web3 simple', color: 'fuchsia', bottom: 80, offset: -96, delay: 1.4, duration: 4.6 },
    { text: 'Intuitive UX', color: 'orange', bottom: 16, offset: -128, delay: 0.9, duration: 5.4 },
  ],
};

export function VideoCarousel() {
  const locale = useLocale() as 'es' | 'en';
  const videos = VIDEOS[locale] || VIDEOS.en;

  // Core state
  const [currentIndex, setCurrentIndex] = useState(0);
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
  const scrollDirection = useRef<'up' | 'down'>('up'); // Default to 'up' to prevent sticky on initial load
  const wasPlayingBeforeChange = useRef(false);
  const initialDocTop = useRef<number>(0); // Absolute position in document (not viewport)
  const audioUnlocked = useRef(false); // Tracks if user has interacted (enables audio autoplay)

  const currentVideo = videos[currentIndex];
  const muxPlayerId = `mux-carousel-${currentIndex}`;

  // Rubber band effect
  const translateX = useHorizontalOverscroll();

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

  // Track scroll direction - CRITICAL: Only go sticky on scroll DOWN
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollDirection.current = currentScrollY > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update placeholder rect for positioning - ONLY on resize (not scroll)
  // MOBILE FIX: Wait for STABLE measurements (two consecutive equal readings)
  useEffect(() => {
    if (!placeholderRef.current) return;

    let measurementCount = 0;
    let lastLeft = -9999;
    let lastTop = -9999;
    let stableTimer: ReturnType<typeof setTimeout>;

    const measure = () => {
      if (!placeholderRef.current) return;
      const rect = placeholderRef.current.getBoundingClientRect();

      // CRITICAL: Check if measurement is STABLE (same as last one within 1px tolerance)
      // This ensures mobile layout has fully settled before rendering video
      const isStable = measurementCount > 0 &&
        Math.abs(rect.left - lastLeft) < 1 &&
        Math.abs(rect.top - lastTop) < 1;

      if (isStable) {
        // Position is stable - safe to render video at this position
        setPlaceholderRect(rect);
        initialDocTop.current = rect.top + window.scrollY;
        return;
      }

      // Not stable yet - save current values and retry
      lastLeft = rect.left;
      lastTop = rect.top;
      measurementCount++;

      if (measurementCount < 15) { // Max 15 attempts (~750ms)
        stableTimer = setTimeout(measure, 50);
      } else {
        // Fallback after max attempts - use current measurement
        setPlaceholderRect(rect);
        initialDocTop.current = rect.top + window.scrollY;
      }
    };

    // Start measuring after initial RAF
    requestAnimationFrame(measure);

    // Also update on resize (reset and re-measure)
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

  // CRITICAL: Update video Y position using requestAnimationFrame (not scroll event)
  // Mobile browsers don't fire scroll events every frame - RAF ensures smooth 60fps updates
  useEffect(() => {
    if (isSticky) return; // Sticky mode has fixed position, no need to track

    let rafId: number;
    let lastScrollY = window.scrollY;

    const updateVideoPosition = () => {
      // Only update DOM if scroll position actually changed (performance optimization)
      if (window.scrollY !== lastScrollY) {
        lastScrollY = window.scrollY;
        if (videoContainerRef.current) {
          // Use transform instead of top - GPU accelerated, no reflow
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

  // Sticky mode logic - ONLY activates on scroll DOWN (not UP)
  useEffect(() => {
    const elementToObserve = placeholderRef.current;
    if (!elementToObserve) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio;

          if (stickyLocked.current) return;

          // GO STICKY: When <50% visible AND playing AND scrolling DOWN
          // CRITICAL: Never go sticky on scroll UP (annoying at page top)
          if (!isSticky && isPlaying && ratio < STICKY_THRESHOLD && scrollDirection.current === 'down') {
            stickyLocked.current = true;
            setIsSticky(true);
            setTimeout(() => { stickyLocked.current = false; }, 600);
          }

          // RETURN: When >70% visible (regardless of scroll direction)
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

  // CRITICAL: Detect ANY user interaction to unlock audio autoplay
  // Browsers require user gesture before allowing audio playback
  // Once user clicks/touches/presses key anywhere, we can autoplay with audio
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
      }).catch(() => {
        // If still fails, the gesture wasn't strong enough - will retry on next interaction
      });
    };

    const handleUserInteraction = () => {
      if (audioUnlocked.current) return; // Already unlocked

      audioUnlocked.current = true;

      // Check if video is visible and should autoplay
      if (placeholderRef.current && !hasAutoPlayed.current) {
        const rect = placeholderRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isVisible) {
          // Small delay to ensure the gesture is registered
          setTimeout(attemptAutoplayWithAudio, 50);
        }
      }
    };

    // Listen for ANY user interaction
    document.addEventListener('click', handleUserInteraction, { passive: true, capture: true });
    document.addEventListener('touchstart', handleUserInteraction, { passive: true, capture: true });
    document.addEventListener('keydown', handleUserInteraction, { passive: true, capture: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction, { capture: true });
      document.removeEventListener('touchstart', handleUserInteraction, { capture: true });
      document.removeEventListener('keydown', handleUserInteraction, { capture: true });
    };
  }, [getMuxPlayer]);

  // Auto-play when visible - Works for BOTH mobile and PC
  // Mobile: Tries immediately (usually succeeds)
  // PC: Waits for audioUnlocked (user interaction) then plays with audio
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
        // On PC without interaction, this will fail - that's expected
        // The handleUserInteraction will retry when user interacts
        // On mobile, try muted as last resort
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

  // Reset on video change
  useEffect(() => {
    hasAutoPlayed.current = false;
  }, [currentIndex]);

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
        audioUnlocked.current = true; // CRITICAL: User clicked = audio unlocked for session
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

  const goToPrevious = useCallback(() => {
    // CRITICAL: Preserve playback state when navigating
    if (isPlaying) {
      wasPlayingBeforeChange.current = true;
    }
    setCurrentIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
    hasAutoPlayed.current = false;
  }, [videos.length, isPlaying]);

  const goToNext = useCallback(() => {
    // CRITICAL: Preserve playback state when navigating
    if (isPlaying) {
      wasPlayingBeforeChange.current = true;
    }
    setCurrentIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
    hasAutoPlayed.current = false;
  }, [videos.length, isPlaying]);

  // Touch handlers for sticky mode and fullscreen swipe gestures
  // CRITICAL: Visual feedback during swipe - video follows finger
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    setIsTouching(true);
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    // Only enable visual swipe tracking in sticky mode
    if (isSticky) {
      setIsSwipingVideo(true);
      setSwipeOffset({ x: 0, y: 0 });
    }
  }, [isMobile, isSticky]);

  // CRITICAL: Update position in real-time as finger moves - NO RESISTANCE
  // Video follows finger 1:1 for natural, responsive feel
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // In sticky mode: video follows finger directly (1:1 movement)
    if (isSticky && isSwipingVideo) {
      // NO resistance - direct 1:1 mapping for responsive feel
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

    // Double tap for fullscreen (only when not already in fullscreen)
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

    // Swipe DOWN in fullscreen → exit fullscreen (return to sticky)
    if (isFullscreen && absY > 80 && deltaY > 0 && absY > absX) {
      setSwipeOffset({ x: 0, y: 0 });
      document.exitFullscreen?.();
      touchStartRef.current = null;
      return;
    }

    // Swipe gestures in sticky mode
    if (isSticky) {
      // Swipe DOWN → enter fullscreen (threshold: 60px)
      if (absY > 60 && deltaY > 0 && absY > absX) {
        setSwipeOffset({ x: 0, y: 0 });
        handleDoubleClick(); // This toggles fullscreen
        touchStartRef.current = null;
        return;
      }

      // Swipe UP/LEFT/RIGHT → dismiss (minimize) with animation
      // SENSITIVE threshold: 40px is enough to trigger dismiss
      let direction: 'up' | 'left' | 'right' | null = null;
      const dismissThreshold = 40;

      if (absY > dismissThreshold && deltaY < 0 && absY > absX) direction = 'up';
      else if (absX > dismissThreshold && deltaX < 0) direction = 'left';
      else if (absX > dismissThreshold && deltaX > 0) direction = 'right';

      if (direction) {
        // CRITICAL: Keep swipeOffset as-is so CSS animation starts from current position
        // The CSS keyframes use CSS custom properties (--swipe-x, --swipe-y) to start
        // from the current finger position and animate to off-screen

        // Complete the dismiss animation in the direction of swipe
        setDismissDirection(direction);
        stickyLocked.current = true;

        // Let CSS animation play (200ms fast animation), then hide
        setTimeout(() => {
          setIsSticky(false);
          setDismissDirection('none');
          setSwipeOffset({ x: 0, y: 0 }); // Reset only after animation completes
          setTimeout(() => { stickyLocked.current = false; }, 1500);
        }, 200);
      } else {
        // Swipe wasn't far enough - spring back to center with smooth transition
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

  // Animation for sticky - FAST 200ms dismiss animation
  const getStickyAnimation = useCallback(() => {
    if (dismissDirection !== 'none') {
      // Fast 200ms animation for snappy dismiss
      const map = {
        up: 'dismissUp 0.2s ease-out forwards',
        left: 'dismissLeft 0.2s ease-out forwards',
        right: 'dismissRight 0.2s ease-out forwards'
      };
      return map[dismissDirection];
    }
    if (isTouching) return 'none';
    return 'floatVideoSticky 4s ease-in-out infinite';
  }, [dismissDirection, isTouching]);

  // Video ended - auto advance to next (carousel mode)
  const handleVideoEnd = useCallback(() => {
    // Mark that we should continue playing after video change
    wasPlayingBeforeChange.current = true;
    const nextIndex = currentIndex === videos.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIndex);
    hasAutoPlayed.current = false;
  }, [currentIndex, videos.length]);

  // Auto-play when video changes and was playing before (carousel continuation)
  // CRITICAL: Always play with audio ON - user already interacted, no need to be silent
  useEffect(() => {
    if (!wasPlayingBeforeChange.current) return;

    // Wait for new MuxPlayer to mount
    const timer = setTimeout(() => {
      const newPlayerId = `mux-carousel-${currentIndex}`;
      const wrapper = document.getElementById(newPlayerId);
      if (!wrapper) return;

      const player = wrapper.querySelector('mux-player') as any;
      if (player) {
        // ALWAYS play with audio ON - user has already interacted
        player.volume = AUTO_PLAY_VOLUME;
        player.muted = false;
        player.play()?.then(() => {
          setIsPlaying(true);
          setIsMuted(false); // Ensure UI reflects audio is ON
          hasAutoPlayed.current = true;
          wasPlayingBeforeChange.current = false;
        }).catch(() => {
          // Retry after small delay (video might not be ready yet)
          setTimeout(() => {
            player.volume = AUTO_PLAY_VOLUME;
            player.muted = false;
            player.play()?.then(() => {
              setIsPlaying(true);
              setIsMuted(false);
              hasAutoPlayed.current = true;
            }).catch(() => {});
          }, 200);
          wasPlayingBeforeChange.current = false;
        });
      }
    }, 400); // Wait for MuxPlayer to fully mount

    return () => clearTimeout(timer);
  }, [currentIndex, isMobile]);

  // Calculate dimensions
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 500;
  const stickyWidth = Math.min(400, windowWidth - 32);

  // Video styles - ALWAYS fixed, position changes based on sticky
  // CRITICAL: In normal mode, 'top' is calculated from initialDocTop (no getBoundingClientRect lag)
  // The scroll listener in useEffect updates 'top' directly in DOM for real-time positioning
  const currentScrollY = typeof window !== 'undefined' ? window.scrollY : 0;

  // Calculate opacity based on swipe distance (fade out as user swipes away)
  const swipeDistance = Math.abs(swipeOffset.x) + Math.abs(swipeOffset.y);
  const swipeOpacity = isSwipingVideo ? Math.max(0.3, 1 - swipeDistance / 200) : 1;

  // Determine if we should show swipe offset (during active swipe OR during spring-back)
  const showSwipeTransform = swipeOffset.x !== 0 || swipeOffset.y !== 0;

  // Check if dismiss animation is playing
  const isDismissing = dismissDirection !== 'none';

  const videoStyles: React.CSSProperties = isSticky
    ? {
        position: 'fixed',
        top: NAVBAR_HEIGHT + STICKY_TOP_OFFSET,
        left: `calc(50% - ${stickyWidth / 2}px)`,
        width: stickyWidth,
        zIndex: 9999,
        // CSS custom properties for dismiss animation to start from current position
        // The @keyframes use var(--swipe-x) and var(--swipe-y) to continue from finger position
        '--swipe-x': `${swipeOffset.x}px`,
        '--swipe-y': `${swipeOffset.y}px`,
        // CRITICAL: During dismiss, let CSS animation handle transform (uses custom properties)
        // During swipe, apply transform directly for real-time finger tracking
        // During spring-back, transition animates back to 0
        transform: isDismissing
          ? undefined  // Let CSS animation handle it with custom properties
          : showSwipeTransform
            ? `translate(${swipeOffset.x}px, ${swipeOffset.y}px)`
            : undefined,
        opacity: isDismissing ? undefined : swipeOpacity,  // Let CSS animation handle opacity during dismiss
        // Animation priority: dismiss > none (during swipe) > float
        animation: isDismissing
          ? getStickyAnimation()  // Play dismiss animation
          : (isSwipingVideo || showSwipeTransform)
            ? 'none'              // Disable float animation during swipe/spring-back
            : getStickyAnimation(),  // Normal floating animation
        // Fast spring-back transition (0.2s) when user releases finger without triggering dismiss
        transition: isTouching || isDismissing
          ? 'none' // No transition while finger is down or during dismiss animation
          : 'transform 0.2s ease-out, opacity 0.2s ease-out',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        overflow: 'hidden',
      } as React.CSSProperties
    : placeholderRect
    ? {
        position: 'fixed',
        // CRITICAL: Use transform instead of top for GPU-accelerated positioning (no reflow)
        // RAF updates transform directly - smoother than changing top property
        top: 0,
        // MOBILE FIX: Calculate left mathematically instead of using getBoundingClientRect
        // On mobile, max-w-md container is centered, so: left = (windowWidth - width) / 2
        // This avoids timing issues where CSS layout hasn't fully computed yet
        left: isMobile
          ? `calc(50% - ${placeholderRect.width / 2}px + ${translateX}px)`
          : placeholderRect.left + translateX,
        width: placeholderRect.width,
        height: placeholderRect.height,
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: '1rem',
        overflow: 'hidden',
        transition: translateX === 0 ? 'left 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        willChange: 'transform', // Hint browser for GPU optimization
        transform: `translateY(${initialDocTop.current - currentScrollY}px)`, // Initial position
        // Float animation using margin-top (doesn't interfere with transform positioning)
        animation: 'floatVideoNormal 4s ease-in-out infinite',
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

  // The video element (ALWAYS in portal)
  const videoElement = (
    <div
      ref={videoContainerRef}
      style={videoStyles}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Glass card container */}
      <div className="glass-crystal h-full flex flex-col">
        {/* Header - only in normal mode */}
        {!isSticky && (
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentVideo.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentVideo.duration}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>{currentIndex + 1}</span>/<span>{videos.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Video area */}
        <div
          className="relative flex-1 cursor-pointer bg-black"
          style={{ aspectRatio: isSticky ? '16/9' : undefined }}
          onClick={handleVideoClick}
          onDoubleClick={handleDoubleClick}
        >
          <div id={muxPlayerId} className="absolute inset-0">
            <MuxPlayer
              key={currentVideo.id}
              playbackId={currentVideo.muxPlaybackId}
              streamType="on-demand"
              autoPlay={false}
              muted={isMuted}
              playsInline
              onEnded={handleVideoEnd}
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

              {/* Navigation arrows in sticky */}
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute bottom-3 left-3 z-30 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:bg-black/50 hover:text-white transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white/60 text-xs">
                {currentIndex + 1} / {videos.length}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute bottom-3 right-3 z-30 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:bg-black/50 hover:text-white transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer with navigation - only in normal mode */}
        {!isSticky && (
          <div className="flex items-center justify-between p-3 border-t border-white/10 flex-shrink-0">
            <button onClick={goToPrevious} className="p-2 rounded-full glass-crystal hover:scale-110 transition-transform">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {videos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // CRITICAL: Preserve playback state when navigating via dots
                      if (isPlaying) {
                        wasPlayingBeforeChange.current = true;
                      }
                      setCurrentIndex(index);
                      hasAutoPlayed.current = false;
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex ? 'bg-blue-500 w-4' : 'bg-gray-400 dark:bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
              <button onClick={toggleMute} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                {isMuted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
              </button>
            </div>
            <button onClick={goToNext} className="p-2 rounded-full glass-crystal hover:scale-110 transition-transform">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{animationStyles}</style>

      {/* Main container with rubber band - affects placeholder + floating words */}
      <div
        className="relative w-full max-w-md mx-auto"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        }}
      >
        {/* Gradient shadow */}
        <div
          className="absolute -inset-8 -z-20 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139, 92, 246, 0.25) 0%, transparent 70%),
              radial-gradient(ellipse 60% 80% at 30% 60%, rgba(59, 130, 246, 0.20) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 70% 60%, rgba(6, 182, 212, 0.18) 0%, transparent 60%)
            `,
            filter: 'blur(40px)',
            opacity: 0.8,
          }}
        />

        {/* Floating words - only when not sticky */}
        {!isSticky && (
          <>
            {FLOATING_WORDS.right.map((word, i) => (
              <div
                key={`right-${i}`}
                className="absolute p-2 rounded-lg text-xs glass-crystal pointer-events-none"
                style={{
                  right: word.offset,
                  ...(word.top !== undefined ? { top: word.top } : { bottom: word.bottom }),
                  animation: `float ${word.duration}s ease-in-out ${word.delay}s infinite`,
                }}
              >
                <span className={`font-medium text-${word.color}-600 dark:text-${word.color}-400`}>{word.text}</span>
              </div>
            ))}
            {FLOATING_WORDS.left.map((word, i) => (
              <div
                key={`left-${i}`}
                className="absolute p-2 rounded-lg text-xs glass-crystal pointer-events-none"
                style={{
                  left: word.offset,
                  ...(word.top !== undefined ? { top: word.top } : { bottom: word.bottom }),
                  animation: `float ${word.duration}s ease-in-out ${word.delay}s infinite`,
                }}
              >
                <span className={`font-medium text-${word.color}-600 dark:text-${word.color}-400`}>{word.text}</span>
              </div>
            ))}
          </>
        )}

        {/* PLACEHOLDER - reserves space, video positioned over it via portal */}
        <div
          ref={placeholderRef}
          className="relative rounded-xl overflow-hidden"
          style={{ aspectRatio: '4/3.5' }}
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

        {/* Video experience hint */}
        <div className="mt-4">
          <VideoExperienceHint />
        </div>
      </div>

      {/* VIDEO VIA PORTAL - Only render when placeholderRect is ready (prevents initial position jump) */}
      {portalReady && placeholderRect && typeof document !== 'undefined' && createPortal(videoElement, document.body)}
    </>
  );
}

export default VideoCarousel;
