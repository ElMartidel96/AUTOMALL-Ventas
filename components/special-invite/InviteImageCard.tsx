'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Ticket, Coins, Rocket, Star } from 'lucide-react';
import { NFTImageModal } from './NFTImageModal';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { EmbeddedVideoDevice } from '@/components/video/EmbeddedVideoDevice';
import { VIDEO_CONFIG as VIDEO_CONFIG_ES } from '@/config/videoConfig';
import { VIDEO_CONFIG as VIDEO_CONFIG_EN } from '@/config/videoConfigEN';

interface InviteImageCardProps {
  image: string;
  name: string;
  customMessage?: string;
  referrerCode?: string;
  inviteCode?: string;
  expiresAt?: string;
  status?: 'active' | 'claimed' | 'expired' | 'revoked';
  className?: string;
  onRefresh?: () => void;
  /** Show the intro video below the referrer message */
  showIntroVideo?: boolean;
  /** Callback when video completes */
  onVideoComplete?: () => void;
}

/**
 * InviteImageCard - Left panel card displaying the special invite image
 *
 * Adapted from EscrowGiftStatus component
 *
 * Features:
 * - Clickable image that opens NFTImageModal
 * - YugiOh futuristic card style border
 * - Status badge
 * - Invite details display
 * - Custom message from referrer
 */
export const InviteImageCard: React.FC<InviteImageCardProps> = ({
  image,
  name,
  customMessage,
  referrerCode,
  inviteCode,
  expiresAt,
  status = 'active',
  className = '',
  onRefresh,
  showIntroVideo = true,
  onVideoComplete
}) => {
  const t = useTranslations('inviteCard');
  const tVideo = useTranslations('video');
  const locale = useLocale();
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Select video config based on current locale (ES = Spanish, EN = English)
  const VIDEO_CONFIG = useMemo(() => {
    return locale === 'es' ? VIDEO_CONFIG_ES : VIDEO_CONFIG_EN;
  }, [locale]);

  // Auto-translate message based on current locale (uses Lingva API)
  const { translatedText: displayMessage, isTranslating } = useAutoTranslate(customMessage);

  // Fallback to local image if Supabase image fails
  const displayImage = imageError || !image ? '/special-referral.jpg' : image;

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'active': return { icon: '🟢', text: t('status.active') };
      case 'expired': return { icon: '⏰', text: t('status.expired') };
      case 'claimed': return { icon: '✅', text: t('status.claimed') };
      case 'revoked': return { icon: '❌', text: t('status.revoked') };
      default: return { icon: '❓', text: statusValue.toUpperCase() };
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'expired': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'claimed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'revoked': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  const statusInfo = getStatusIcon(status);

  // Calculate time remaining if expiresAt is provided
  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return t('expired');

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return t('daysRemaining', { days });
    if (hours > 0) return t('hoursRemaining', { hours });
    return t('expiresSoon');
  };

  return (
    <div className={`bg-white/70 dark:bg-slate-800/60 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-white/20 dark:border-slate-600/30 ${className}`}>
      {/* YUGI-OH FUTURISTIC CARD HEADER */}
      <div className="relative overflow-hidden">
        {displayImage ? (
          <div
            className="nft-card-image-container relative cursor-pointer group"
            onClick={() => setShowImageModal(true)}
            title={t('clickToView')}
          >
            <Image
              src={displayImage}
              alt={name}
              width={500}
              height={500}
              className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem 0.5rem 0 0'
              }}
              onError={() => setImageError(true)}
            />

            {/* YUGI-OH STYLE BORDER OVERLAY */}
            <div className="absolute inset-0 border-2 border-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 rounded-t-lg opacity-60 pointer-events-none" />
            <div className="absolute inset-0 border border-white/30 rounded-t-lg pointer-events-none" />

            {/* HOLOGRAPHIC EFFECT */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-40 pointer-events-none" />

            {/* CLICK HINT */}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              {t('clickToEnlarge')}
            </div>
          </div>
        ) : (
          <div className="w-full aspect-square min-h-[200px]">
            <div className="h-full bg-gradient-to-br from-purple-400 via-blue-500 to-cyan-500 flex items-center justify-center relative overflow-hidden">
              {/* FUTURISTIC PLACEHOLDER DESIGN */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" />
              <div className="relative z-10 text-center">
                <Ticket className="w-20 h-20 text-white mb-4 drop-shadow-lg mx-auto" />
                <div className="text-white font-bold text-lg">{t('placeholder.title')}</div>
                <div className="text-white/80 text-sm">{t('placeholder.subtitle')}</div>
              </div>

              {/* GEOMETRIC PATTERNS */}
              <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white/30 rotate-45" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-white/20 rotate-12" />
              <div className="absolute top-1/2 left-8 w-4 h-4 bg-white/20 rounded-full" />
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(status)}`}>
            {statusInfo.icon} {statusInfo.text}
          </span>
        </div>

        {/* Quick Actions */}
        {onRefresh && (
          <div className="absolute top-3 left-3 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
              title={t('updateStatus')}
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Custom Message from Referrer - Auto-translated based on locale */}
        {(displayMessage || isTranslating) && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
            <div className="flex items-start">
              <span className="text-xl mr-2">💬</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
                  {t('referrerMessage')}
                </p>
                <p className={`text-sm text-purple-700 dark:text-purple-400 italic transition-opacity ${isTranslating ? 'opacity-50' : 'opacity-100'}`}>
                  &ldquo;{displayMessage || customMessage}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* EMBEDDED INTRO VIDEO - iPad/Tablet Style with Floating Words */}
        {/* The first video of the sales masterclass embedded here */}
        {/* ========================================================== */}
        {showIntroVideo && status === 'active' && (
          <div className="mt-6">
            {/* Floating Pills - EXACT glass-crystal style from Home VideoCarousel */}
            <div className="flex items-center justify-center gap-3 mb-4 relative z-10">
              {/* Pill 1: Discover CryptoGift - glass-crystal with amber text like "No complications" */}
              <div
                className="p-2 rounded-lg text-xs glass-crystal"
                style={{ animation: 'float 4s ease-in-out infinite' }}
              >
                <span className="font-medium text-amber-600 dark:text-amber-400">{tVideo('salesMasterclass.discoverPill')}</span>
              </div>

              {/* Pill 2: El Regalo / The Gift - glass-crystal with emerald text like "No gas" */}
              <div
                className="p-2 rounded-lg text-xs glass-crystal"
                style={{ animation: 'float 4.2s ease-in-out infinite 0.3s' }}
              >
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{tVideo('salesMasterclass.theGift.title')}</span>
              </div>
            </div>

            {/* Embedded Video Device - Sin description */}
            <EmbeddedVideoDevice
              muxPlaybackId={VIDEO_CONFIG.salesMasterclassV2_TheGift.muxPlaybackId}
              lessonId={VIDEO_CONFIG.salesMasterclassV2_TheGift.lessonId}
              onVideoComplete={onVideoComplete}
              className="mb-4"
            />

            {/* Urgency Banner Below Video */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Ticket className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-bounce" />
                <span className="font-bold text-amber-800 dark:text-amber-300">
                  {t('introVideo.urgencyTitle', { defaultValue: 'Este Lugar No Esperará Para Siempre' })}
                </span>
              </div>
              <div className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <span>
                    <strong>200 CGC Instantáneos</strong> - {t('introVideo.benefit1', { defaultValue: 'Empieza con tokens de gobernanza. 1 CGC = 1 Voto en decisiones reales.' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                  <span>
                    <strong>{t('introVideo.earnRange', { defaultValue: 'Gana 200-3000 CGC' })}</strong> - {t('introVideo.benefit2', { defaultValue: 'Completa tareas, cobra en tokens. Sin jefe, sin permisos necesarios.' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <span>
                    <strong>{t('introVideo.founderMembers', { defaultValue: 'Solo Miembros Fundadores' })}</strong> - {t('introVideo.benefit3', { defaultValue: 'Únete a los primeros 10,000 pioneros construyendo el futuro de la adopción Web3.' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Remaining */}
        {status === 'active' && expiresAt && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('timeRemaining')}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getTimeRemaining()}
              </span>
            </div>
          </div>
        )}

        {/* Invite Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('details.type')}:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {t('details.typeValue')}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('details.network')}:</span>
            <span className="text-gray-900 dark:text-white">
              {t('details.networkValue')}
            </span>
          </div>

          {expiresAt && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('details.expires')}:</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(expiresAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {status === 'claimed' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-green-800 dark:text-green-300 text-sm font-medium">
              {t('messages.claimed')}
            </p>
          </div>
        )}

        {status === 'expired' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <p className="text-orange-800 dark:text-orange-300 text-sm font-medium">
              {t('messages.expired')}
            </p>
          </div>
        )}

        {status === 'revoked' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-800 dark:text-red-300 text-sm font-medium">
              {t('messages.revoked')}
            </p>
          </div>
        )}
      </div>

      {/* NFT IMAGE MODAL */}
      <NFTImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        image={displayImage}
        name={name}
        tokenId={inviteCode}
        metadata={{
          description: displayMessage || t('metadata.description'),
          attributes: [
            { trait_type: t('metadata.type'), value: t('metadata.typeValue') },
            { trait_type: t('details.network'), value: t('details.networkValue') },
            { trait_type: t('metadata.status'), value: statusInfo.text },
            ...(referrerCode ? [{ trait_type: t('metadata.referrer'), value: referrerCode }] : [])
          ]
        }}
      />
    </div>
  );
};
