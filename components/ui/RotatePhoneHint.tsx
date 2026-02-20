'use client';

/**
 * ROTATE PHONE HINT COMPONENT
 *
 * Beautiful animated indicator encouraging users to:
 * - Enable fullscreen mode
 * - Rotate phone to landscape
 *
 * Features:
 * - Elegant hand holding phone animation
 * - Smooth rotation animation
 * - Gradient accents matching brand
 * - Responsive (only shows on mobile-sized screens)
 * - Bilingual support
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, RotateCcw, Smartphone, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RotatePhoneHintProps {
  /** Show only on first video (default: true) */
  showOnce?: boolean;
  /** Custom className for positioning */
  className?: string;
  /** Language override (uses i18n by default) */
  locale?: 'en' | 'es';
}

export function RotatePhoneHint({
  showOnce = true,
  className = '',
  locale
}: RotatePhoneHintProps) {
  const t = useTranslations('video');
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile and if already dismissed
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check localStorage for dismissal
    if (showOnce) {
      const dismissed = localStorage.getItem('rotateHintDismissed');
      if (dismissed) {
        setIsDismissed(true);
      }
    }

    // Show after a small delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, [showOnce]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (showOnce) {
      localStorage.setItem('rotateHintDismissed', 'true');
    }
  };

  // Don't render on desktop or if dismissed
  if (!isMobile || isDismissed || !isVisible) {
    return null;
  }

  // Translations with fallback
  const getText = (key: string, fallbackEs: string, fallbackEn: string) => {
    try {
      return t(key);
    } catch {
      return locale === 'en' ? fallbackEn : fallbackEs;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`relative ${className}`}
      >
        {/* Main Container */}
        <div className="relative mx-auto max-w-sm">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 blur-xl rounded-2xl" />

          {/* Card */}
          <motion.div
            className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30 shadow-2xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>

            <div className="flex items-center gap-4">
              {/* Animated Phone Icon */}
              <div className="relative w-16 h-16 flex-shrink-0">
                {/* Hand silhouette */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 0, 90, 90, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    times: [0, 0.3, 0.5, 0.8, 1],
                    ease: 'easeInOut'
                  }}
                >
                  {/* Phone */}
                  <div className="relative">
                    <Smartphone className="w-10 h-10 text-cyan-400" strokeWidth={1.5} />
                    {/* Screen glow */}
                    <motion.div
                      className="absolute inset-2 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-sm opacity-50"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </motion.div>

                {/* Rotation Arrow */}
                <motion.div
                  className="absolute -right-1 -bottom-1"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 1.5, repeat: Infinity }
                  }}
                >
                  <RotateCcw className="w-5 h-5 text-purple-400" strokeWidth={2} />
                </motion.div>
              </div>

              {/* Text Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">
                    {getText('fullscreenHint', 'Mejor experiencia', 'Best experience')}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {getText(
                    'rotateHint',
                    'Activa pantalla completa y gira tu teléfono para disfrutar mejor el video',
                    'Enable fullscreen and rotate your phone to enjoy the video better'
                  )}
                </p>
              </div>
            </div>

            {/* Animated Bottom Border */}
            <motion.div
              className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scaleX: [0.8, 1, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact version for inline use below video
 */
export function RotatePhoneHintCompact({
  className = '',
  locale
}: Pick<RotatePhoneHintProps, 'className' | 'locale'>) {
  const t = useTranslations('video');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  const getText = (key: string, fallbackEs: string, fallbackEn: string) => {
    try {
      return t(key);
    } catch {
      return locale === 'en' ? fallbackEn : fallbackEs;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className={`flex items-center justify-center gap-3 py-3 ${className}`}
    >
      {/* Animated Icons */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: [0, 0, 90, 90, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            times: [0, 0.3, 0.5, 0.8, 1],
            ease: 'easeInOut'
          }}
        >
          <Smartphone className="w-5 h-5 text-purple-500 dark:text-purple-400" strokeWidth={1.5} />
        </motion.div>
        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Maximize2 className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
        </motion.div>
      </div>

      {/* Text */}
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {getText(
          'rotateHintShort',
          'Gira tu teléfono para mejor experiencia',
          'Rotate your phone for better experience'
        )}
      </span>
    </motion.div>
  );
}

/**
 * Desktop version - Floating hint to expand video
 * Shows animated cursor with double-click indication
 */
export function ExpandVideoHintDesktop({
  className = '',
  locale
}: Pick<RotatePhoneHintProps, 'className' | 'locale'>) {
  const t = useTranslations('video');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  if (!isDesktop) return null;

  const getText = (key: string, fallbackEs: string, fallbackEn: string) => {
    try {
      return t(key);
    } catch {
      return locale === 'en' ? fallbackEn : fallbackEs;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.6 }}
      className={`flex items-center justify-center gap-3 py-3 ${className}`}
      style={{ animation: 'float 4s ease-in-out infinite' }}
    >
      {/* Animated Mouse with Double-Click */}
      <div className="relative flex items-center gap-2">
        {/* Mouse Icon */}
        <div className="relative">
          <motion.div
            className="w-6 h-9 rounded-full border-2 border-purple-400 dark:border-purple-500 relative"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Scroll wheel / click indicator */}
            <motion.div
              className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-2 bg-purple-400 dark:bg-purple-500 rounded-full"
              animate={{
                opacity: [1, 0.3, 1, 0.3, 1],
                scale: [1, 0.8, 1, 0.8, 1]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                times: [0, 0.2, 0.4, 0.6, 1]
              }}
            />
          </motion.div>

          {/* Click ripple effect */}
          <motion.div
            className="absolute -inset-2 rounded-full border border-cyan-400/50"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              times: [0, 0.5, 1]
            }}
          />
        </div>

        {/* Double-click text indicator */}
        <motion.div
          className="flex items-center gap-1"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs font-medium text-purple-500 dark:text-purple-400">2×</span>
        </motion.div>

        {/* Expand icon */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, 0, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Maximize2 className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
        </motion.div>
      </div>

      {/* Text */}
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {getText(
          'expandHintShort',
          'Doble clic para ampliar el video',
          'Double-click to expand the video'
        )}
      </span>
    </motion.div>
  );
}

/**
 * Combined component that shows the appropriate hint based on device
 * - Mobile: Rotate phone hint
 * - Desktop: Expand video hint
 */
export function VideoExperienceHint({
  className = '',
  locale
}: Pick<RotatePhoneHintProps, 'className' | 'locale'>) {
  return (
    <>
      <RotatePhoneHintCompact className={className} locale={locale} />
      <ExpandVideoHintDesktop className={className} locale={locale} />
    </>
  );
}

export default RotatePhoneHint;
