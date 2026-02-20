/**
 * INTRO VIDEO GATE - Sistema reutilizable de video para lecciones
 * Componente ESTÁTICO (sin oscilación) para SalesMasterclass
 *
 * FEATURES:
 * - MOBILE: Auto-play with audio immediately when visible
 * - PC: Click ANYWHERE on page triggers play with audio
 * - Click on video to play/pause, double-click for fullscreen
 * - NO portal rendering, NO position tracking = ZERO wobble
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { SkipForward, ArrowLeft, Play, Maximize2 } from 'lucide-react';

const AUTO_PLAY_VOLUME = 0.15;

// Lazy load MUX Player
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="relative aspect-video w-full flex items-center justify-center
        bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent
            rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Cargando video...</p>
        </div>
      </div>
    )
  }
);

interface IntroVideoGateProps {
  lessonId: string;
  muxPlaybackId: string;
  poster?: string;
  captionsVtt?: string;
  title?: string;
  description?: string;
  onFinish: () => void;
  onBack?: () => void;
  autoSkip?: boolean;
  forceShow?: boolean;
}

export default function IntroVideoGate({
  lessonId,
  muxPlaybackId,
  poster,
  captionsVtt,
  title = "Video Introductorio",
  description,
  onFinish,
  onBack,
}: IntroVideoGateProps) {
  const storageKey = useMemo(() => `intro_video_seen:${lessonId}`, [lessonId]);

  // Unique ID for this video instance
  const muxPlayerId = useMemo(() => `mux-intro-${lessonId.replace(/[^a-zA-Z0-9]/g, '-')}`, [lessonId]);

  const [show, setShow] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Refs - CRITICAL for tracking state across renders
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoPlayed = useRef(false);
  const audioUnlocked = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 20; // 20 retries * 100ms = 2 seconds max wait

  // Detect mobile ONCE on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSmallScreen = window.innerWidth < 768;
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isSmallScreen || mobileUA);
    }
  }, []);

  // Get MuxPlayer element - searches for the mux-player in the wrapper
  const getMuxPlayer = useCallback((): any => {
    if (typeof document === 'undefined') return null;
    const wrapper = document.getElementById(muxPlayerId);
    if (!wrapper) return null;
    return wrapper.querySelector('mux-player');
  }, [muxPlayerId]);

  // CORE: Attempt to play with audio, with retry logic
  const attemptPlayWithAudio = useCallback(() => {
    if (hasAutoPlayed.current) return;

    const player = getMuxPlayer();
    if (!player) {
      // Player not ready, retry up to maxRetries times
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        setTimeout(attemptPlayWithAudio, 100);
      }
      return;
    }

    player.volume = AUTO_PLAY_VOLUME;
    player.muted = false;

    player.play()?.then(() => {
      hasAutoPlayed.current = true;
      audioUnlocked.current = true;
      setIsPlaying(true);
      console.log('[IntroVideo] ▶️ Playing with audio');
    }).catch(() => {
      // Mobile fallback: try muted
      if (isMobile) {
        player.muted = true;
        player.play()?.then(() => {
          hasAutoPlayed.current = true;
          setIsPlaying(true);
          console.log('[IntroVideo] ▶️ Playing muted (mobile fallback)');
        }).catch(() => {
          console.log('[IntroVideo] ❌ Autoplay completely blocked');
        });
      } else {
        // PC: Don't fallback to muted, wait for click anywhere
        console.log('[IntroVideo] ⏳ PC: Waiting for click anywhere to play with audio');
      }
    });
  }, [getMuxPlayer, isMobile]);

  // VISIBILITY: Auto-play when video becomes visible
  useEffect(() => {
    if (!containerRef.current || hasAutoPlayed.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAutoPlayed.current) {
          retryCount.current = 0;
          setTimeout(attemptPlayWithAudio, 300);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [attemptPlayWithAudio]);

  // CLICK ANYWHERE: Listen for ANY user interaction on the entire document
  // This is the KEY feature - clicking anywhere on the page starts the video
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleDocumentInteraction = (e: Event) => {
      // If audio already unlocked or video already playing, skip
      if (audioUnlocked.current || hasAutoPlayed.current) return;

      // Mark audio as unlocked (user has interacted)
      audioUnlocked.current = true;
      console.log('[IntroVideo] 🖱️ User interaction detected, attempting play');

      // Check if our video container is visible
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (!isVisible) return;

      // Reset retry counter and attempt to play
      retryCount.current = 0;

      // Use setTimeout to ensure the gesture is registered by the browser
      setTimeout(() => {
        const player = getMuxPlayer();
        if (!player || hasAutoPlayed.current) return;

        player.volume = AUTO_PLAY_VOLUME;
        player.muted = false;

        player.play()?.then(() => {
          hasAutoPlayed.current = true;
          setIsPlaying(true);
          console.log('[IntroVideo] ▶️ Started playing with audio after click anywhere');
        }).catch(() => {
          // Last resort: try muted even on PC
          player.muted = true;
          player.play()?.then(() => {
            hasAutoPlayed.current = true;
            setIsPlaying(true);
            console.log('[IntroVideo] ▶️ Playing muted after click (fallback)');
          }).catch(() => {
            console.log('[IntroVideo] ❌ Play failed even after user interaction');
          });
        });
      }, 50);
    };

    // Register listeners on document with CAPTURE phase to catch ALL clicks
    document.addEventListener('click', handleDocumentInteraction, { capture: true, passive: true });
    document.addEventListener('touchstart', handleDocumentInteraction, { capture: true, passive: true });
    document.addEventListener('keydown', handleDocumentInteraction, { capture: true, passive: true });

    console.log('[IntroVideo] 📡 Document listeners registered for click-anywhere');

    return () => {
      document.removeEventListener('click', handleDocumentInteraction, { capture: true });
      document.removeEventListener('touchstart', handleDocumentInteraction, { capture: true });
      document.removeEventListener('keydown', handleDocumentInteraction, { capture: true });
      console.log('[IntroVideo] 📡 Document listeners removed');
    };
  }, [getMuxPlayer]);

  // UNMUTE: If video is playing muted and user interacts, unmute it
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleUnmute = () => {
      const player = getMuxPlayer();
      if (player && !player.paused && player.muted) {
        player.muted = false;
        player.volume = AUTO_PLAY_VOLUME;
        console.log('[IntroVideo] 🔊 Unmuted after user interaction');
      }
    };

    document.addEventListener('click', handleUnmute, { passive: true });
    document.addEventListener('touchstart', handleUnmute, { passive: true });

    return () => {
      document.removeEventListener('click', handleUnmute);
      document.removeEventListener('touchstart', handleUnmute);
    };
  }, [getMuxPlayer]);

  // Handlers
  const handleFinish = useCallback(() => {
    localStorage.setItem(storageKey, "completed");
    setShow(false);
    onFinish();
  }, [storageKey, onFinish]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(storageKey, "skipped");
    setShow(false);
    onFinish();
  }, [storageKey, onFinish]);

  const handleVideoClick = useCallback(() => {
    audioUnlocked.current = true;
    const player = getMuxPlayer();
    if (!player) return;

    if (player.paused) {
      player.volume = AUTO_PLAY_VOLUME;
      player.muted = false;
      player.play()?.then(() => {
        setIsPlaying(true);
        hasAutoPlayed.current = true;
      }).catch(() => {
        player.muted = true;
        player.play()?.then(() => setIsPlaying(true)).catch(() => {});
      });
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [getMuxPlayer]);

  const handleDoubleClick = useCallback(() => {
    const player = getMuxPlayer();
    if (!player) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      // Try various fullscreen methods for compatibility
      const videoEl = player.querySelector?.('video') || player;
      if ((videoEl as any).webkitEnterFullscreen) {
        (videoEl as any).webkitEnterFullscreen();
      } else if ((videoEl as any).webkitRequestFullscreen) {
        (videoEl as any).webkitRequestFullscreen();
      } else if (player.requestFullscreen) {
        player.requestFullscreen();
      }
    }
  }, [getMuxPlayer]);

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto"
    >
      {/* Static glow - CSS only, no JavaScript updates */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 120% 100% at 50% 0%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse 100% 120% at 0% 50%, rgba(139, 92, 246, 0.35) 0%, transparent 55%),
            radial-gradient(ellipse 100% 120% at 100% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 55%),
            radial-gradient(ellipse 120% 100% at 50% 100%, rgba(139, 92, 246, 0.35) 0%, transparent 60%)
          `,
          filter: 'blur(80px)',
          opacity: 0.5,
          transform: 'scale(1.18)',
        }}
      />

      {/* Video container - STATIC position */}
      <div
        className="relative aspect-video w-full
          bg-gradient-to-br from-gray-900/95 to-black/95
          backdrop-blur-xl backdrop-saturate-150
          rounded-3xl overflow-hidden
          border border-white/10 dark:border-gray-800/50
          shadow-2xl shadow-purple-500/20 z-10
          cursor-pointer"
        onClick={handleVideoClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Wrapper with ID for getMuxPlayer to find */}
        <div id={muxPlayerId} className="absolute inset-0">
          <MuxPlayer
            playbackId={muxPlaybackId}
            streamType="on-demand"
            autoPlay={false}
            muted={false}
            playsInline
            poster={poster}
            onEnded={handleFinish}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{
              width: '100%',
              height: '100%',
              '--controls': 'none',
            } as any}
            className="w-full h-full"
            metadata={{
              video_title: title,
              video_series: "CryptoGift Educational"
            }}
          >
            {captionsVtt && (
              <track
                kind="subtitles"
                srcLang="es"
                src={captionsVtt}
                default
                label="Español"
              />
            )}
          </MuxPlayer>
        </div>

        {/* Play overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Fullscreen hint */}
        <div className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-20">
          <div className="px-2 py-1 rounded bg-black/50 text-white text-xs flex items-center gap-1">
            <Maximize2 className="w-3 h-3" />
            <span>Doble clic</span>
          </div>
        </div>
      </div>

      {/* Title, description and buttons */}
      <div className="mt-6 space-y-4">
        <div className="bg-white/10 dark:bg-black/30
          backdrop-blur-xl backdrop-saturate-150
          rounded-2xl px-6 py-4
          border border-white/20 dark:border-gray-700/50
          shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {description}
            </p>
          )}
        </div>

        <div className="flex justify-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-4 rounded-xl
                bg-white/10 dark:bg-black/30
                hover:bg-white/20 dark:hover:bg-black/40
                text-gray-700 dark:text-gray-300 font-bold text-lg
                backdrop-blur-xl border border-gray-300/30 dark:border-gray-700/30
                transition-all hover:scale-105
                shadow-lg
                flex items-center gap-3"
            >
              <ArrowLeft className="w-6 h-6" />
              <span>Volver</span>
            </button>
          )}

          <button
            onClick={handleSkip}
            className="px-8 py-4 rounded-xl
              bg-gradient-to-r from-purple-500 to-pink-500
              hover:from-purple-600 hover:to-pink-600
              text-white font-bold text-lg
              backdrop-blur-xl border border-purple-400/30
              transition-all hover:scale-105
              shadow-lg shadow-purple-500/30
              flex items-center gap-3"
          >
            <SkipForward className="w-6 h-6" />
            <span>Saltar intro</span>
          </button>
        </div>
      </div>
    </div>
  );
}
