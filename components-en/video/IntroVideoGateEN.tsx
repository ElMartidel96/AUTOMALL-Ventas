/**
 * INTRO VIDEO GATE EN - Reusable video system for lessons (English version)
 * STATIC component (no wobble) for SalesMasterclass
 *
 * FEATURES:
 * - MOBILE: Auto-play with audio immediately
 * - PC: Click anywhere on page triggers play with audio
 * - Click to play/pause, double-click for fullscreen
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
          <p className="text-white/80 text-lg">Loading video...</p>
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
  title = "Introductory Video",
  description,
  onFinish,
  onBack,
}: IntroVideoGateProps) {
  const storageKey = useMemo(() => `intro_video_seen:${lessonId}`, [lessonId]);

  // Unique ID for this video instance
  const muxPlayerId = useMemo(() => `mux-intro-${lessonId.replace(/[^a-zA-Z0-9]/g, '-')}`, [lessonId]);

  const [show, setShow] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoPlayed = useRef(false);
  const audioUnlocked = useRef(false);

  // Get MuxPlayer element - CRITICAL: Use the mux-player directly, not the video inside shadow DOM
  const getMuxPlayer = useCallback((): any => {
    if (typeof document === 'undefined') return null;
    const wrapper = document.getElementById(muxPlayerId);
    if (!wrapper) return null;
    return wrapper.querySelector('mux-player');
  }, [muxPlayerId]);

  // Attempt to play video with audio
  const attemptPlay = useCallback(() => {
    if (hasAutoPlayed.current) return;

    const player = getMuxPlayer();
    if (!player) {
      // Player not ready yet, retry in 100ms
      setTimeout(() => attemptPlay(), 100);
      return;
    }

    player.volume = AUTO_PLAY_VOLUME;
    player.muted = false;

    player.play()?.then(() => {
      hasAutoPlayed.current = true;
      audioUnlocked.current = true;
      setIsPlaying(true);
      console.log('[Video] ▶️ Playing with audio');
    }).catch(() => {
      // Try muted as fallback (mobile without interaction)
      player.muted = true;
      player.play()?.then(() => {
        hasAutoPlayed.current = true;
        setIsPlaying(true);
        console.log('[Video] ▶️ Playing muted (fallback)');
      }).catch(() => {
        console.log('[Video] ❌ Autoplay blocked, waiting for interaction');
      });
    });
  }, [getMuxPlayer]);

  // MOBILE: Auto-play immediately when visible
  // PC: Wait for user interaction
  useEffect(() => {
    if (!containerRef.current || hasAutoPlayed.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAutoPlayed.current) {
          // Small delay to ensure MuxPlayer is mounted
          setTimeout(() => attemptPlay(), 300);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [attemptPlay]);

  // PC: Click anywhere on page triggers play with audio
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleUserInteraction = () => {
      if (audioUnlocked.current) return;
      audioUnlocked.current = true;

      const player = getMuxPlayer();
      if (player && player.paused && !hasAutoPlayed.current) {
        player.volume = AUTO_PLAY_VOLUME;
        player.muted = false;
        player.play()?.then(() => {
          hasAutoPlayed.current = true;
          setIsPlaying(true);
          console.log('[Video] ▶️ Started playing after user interaction');
        }).catch(() => {});
      } else if (player && player.paused === false && player.muted) {
        // Already playing muted, unmute it
        player.muted = false;
        player.volume = AUTO_PLAY_VOLUME;
        console.log('[Video] 🔊 Unmuted after user interaction');
      }
    };

    document.addEventListener('click', handleUserInteraction, { capture: true, passive: true });
    document.addEventListener('touchstart', handleUserInteraction, { capture: true, passive: true });
    document.addEventListener('keydown', handleUserInteraction, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction, { capture: true });
      document.removeEventListener('touchstart', handleUserInteraction, { capture: true });
      document.removeEventListener('keydown', handleUserInteraction, { capture: true });
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
                srcLang="en"
                src={captionsVtt}
                default
                label="English"
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
            <span>Double click</span>
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
              <span>Back</span>
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
            <span>Skip intro</span>
          </button>
        </div>
      </div>
    </div>
  );
}
