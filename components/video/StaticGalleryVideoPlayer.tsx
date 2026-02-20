'use client';

/**
 * StaticGalleryVideoPlayer - STATIC video player (no portal)
 *
 * Based on IntroVideoGate pattern which WORKS PERFECTLY:
 * - NO portal rendering (stays in normal DOM flow)
 * - NO position:fixed (no getBoundingClientRect issues)
 * - Works inside Framer Motion containers
 * - Auto-play with audio on user interaction
 * - Click to play/pause, double-click for fullscreen
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Play, Maximize2, Volume2, VolumeX } from 'lucide-react';

const AUTO_PLAY_VOLUME = 0.15;

// Lazy load MUX Player
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="relative aspect-video w-full flex items-center justify-center
        bg-gradient-to-br from-gray-900/95 to-black/95 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent
            rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-white/60 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }
);

interface StaticGalleryVideoPlayerProps {
  muxPlaybackId: string;
  title?: string;
  onEnded?: () => void;
}

export default function StaticGalleryVideoPlayer({
  muxPlaybackId,
  title = 'CRYPTOGIFT DAO GALLERY',
  onEnded,
}: StaticGalleryVideoPlayerProps) {
  // Unique ID for this video instance
  const muxPlayerId = useMemo(() => `mux-gallery-static-${muxPlaybackId.substring(0, 8)}`, [muxPlaybackId]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoPlayed = useRef(false);
  const audioUnlocked = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 20;

  // Detect mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSmallScreen = window.innerWidth < 768;
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isSmallScreen || mobileUA);
    }
  }, []);

  // Get MuxPlayer element
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
      setIsMuted(false);
      console.log('[StaticGallery] ▶️ Playing with audio');
    }).catch(() => {
      // Mobile fallback: try muted
      if (isMobile) {
        player.muted = true;
        player.play()?.then(() => {
          hasAutoPlayed.current = true;
          setIsPlaying(true);
          setIsMuted(true);
          console.log('[StaticGallery] ▶️ Playing muted (mobile fallback)');
        }).catch(() => {
          console.log('[StaticGallery] ❌ Autoplay completely blocked');
        });
      } else {
        console.log('[StaticGallery] ⏳ PC: Waiting for click to play with audio');
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

  // CLICK ANYWHERE: Listen for ANY user interaction
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleDocumentInteraction = () => {
      if (audioUnlocked.current || hasAutoPlayed.current) return;

      audioUnlocked.current = true;
      console.log('[StaticGallery] 🖱️ User interaction detected');

      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (!isVisible) return;

      retryCount.current = 0;

      setTimeout(() => {
        const player = getMuxPlayer();
        if (!player || hasAutoPlayed.current) return;

        player.volume = AUTO_PLAY_VOLUME;
        player.muted = false;

        player.play()?.then(() => {
          hasAutoPlayed.current = true;
          setIsPlaying(true);
          setIsMuted(false);
          console.log('[StaticGallery] ▶️ Started with audio after click');
        }).catch(() => {
          player.muted = true;
          player.play()?.then(() => {
            hasAutoPlayed.current = true;
            setIsPlaying(true);
            setIsMuted(true);
          }).catch(() => {});
        });
      }, 50);
    };

    document.addEventListener('click', handleDocumentInteraction, { capture: true, passive: true });
    document.addEventListener('touchstart', handleDocumentInteraction, { capture: true, passive: true });
    document.addEventListener('keydown', handleDocumentInteraction, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleDocumentInteraction, { capture: true });
      document.removeEventListener('touchstart', handleDocumentInteraction, { capture: true });
      document.removeEventListener('keydown', handleDocumentInteraction, { capture: true });
    };
  }, [getMuxPlayer]);

  // UNMUTE: If playing muted and user interacts, unmute
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleUnmute = () => {
      const player = getMuxPlayer();
      if (player && !player.paused && player.muted) {
        player.muted = false;
        player.volume = AUTO_PLAY_VOLUME;
        setIsMuted(false);
        console.log('[StaticGallery] 🔊 Unmuted');
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
  const handleVideoClick = useCallback(() => {
    audioUnlocked.current = true;
    const player = getMuxPlayer();
    if (!player) return;

    if (player.paused) {
      player.volume = AUTO_PLAY_VOLUME;
      player.muted = false;
      player.play()?.then(() => {
        setIsPlaying(true);
        setIsMuted(false);
        hasAutoPlayed.current = true;
      }).catch(() => {
        player.muted = true;
        player.play()?.then(() => {
          setIsPlaying(true);
          setIsMuted(true);
        }).catch(() => {});
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

  const toggleMute = useCallback(() => {
    const player = getMuxPlayer();
    if (player) {
      const newMuted = !player.muted;
      player.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted) player.volume = AUTO_PLAY_VOLUME;
    }
  }, [getMuxPlayer]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto"
    >
      {/* Video container - STATIC position (no portal) */}
      <div
        className="relative aspect-video w-full
          bg-gradient-to-br from-gray-900/95 to-black/95
          backdrop-blur-xl backdrop-saturate-150
          rounded-xl overflow-hidden
          border border-white/10 dark:border-gray-800/50
          shadow-2xl shadow-purple-500/20
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

        {/* Volume control */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          className="absolute bottom-3 right-3 z-20 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:bg-black/60 hover:text-white transition-all shadow-lg border border-white/10"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Fullscreen hint */}
        <div className="absolute bottom-3 left-3 opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-20">
          <div className="px-2 py-1 rounded bg-black/50 text-white text-xs flex items-center gap-1">
            <Maximize2 className="w-3 h-3" />
            <span>Doble clic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
