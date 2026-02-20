'use client';

/**
 * ShareButton - Profile sharing component with Copy, QR Code, and NFC
 *
 * Features:
 * - Copy profile link to clipboard with visual feedback
 * - Show QR Code inline/popover
 * - Web NFC tap-to-share (Chrome Android only)
 * - Does NOT change profile card levels (stays in L4)
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import {
  Link2,
  Check,
  QrCode,
  Smartphone,
  X,
  Download,
  Share2,
} from 'lucide-react';
import { useReferralCode } from '@/hooks/useReferrals';
import { useAccount } from '@/lib/thirdweb';

// Check if Web NFC is supported
const isNFCSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

interface ShareButtonProps {
  walletAddress: string;
  className?: string;
}

export function ShareButton({ walletAddress, className = '' }: ShareButtonProps) {
  const t = useTranslations('profile.share');
  const { address } = useAccount();

  // Get current user's referral code to include in shared links
  const { code: referralCode } = useReferralCode(address);

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [nfcActive, setNfcActive] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Generate profile URL pointing to HOME with profile overlay
  // This keeps users on the main page while showing the presentation card
  // URL format: /?profile=WALLET&card=presentation&ref=CODE
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?profile=${walletAddress}&card=presentation${referralCode ? `&ref=${referralCode}` : ''}`
    : `/?profile=${walletAddress}&card=presentation${referralCode ? `&ref=${referralCode}` : ''}`;

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle NFC activation
  const handleNFC = async () => {
    if (!isNFCSupported) {
      setNfcError(t('nfcNotSupported'));
      setTimeout(() => setNfcError(null), 3000);
      return;
    }

    try {
      // @ts-expect-error - NDEFReader is not in TypeScript types yet
      const ndef = new NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: profileUrl }],
      });
      setNfcActive(true);
      // NFC remains active for 30 seconds
      setTimeout(() => setNfcActive(false), 30000);
    } catch (err) {
      console.error('NFC error:', err);
      setNfcError(t('nfcError'));
      setTimeout(() => setNfcError(null), 3000);
    }
  };

  // Handle Web Share API
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CryptoGift DAO Profile',
          text: t('shareMessage'),
          url: profileUrl,
        });
      } catch {
        // User cancelled or share failed
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  // Handle main button click - Copy + Show QR + Activate NFC (simultaneously)
  const handleMainClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. Copy link to clipboard
    await handleCopy();

    // 2. Show QR Code popover
    setShowQR(true);

    // 3. Try to activate NFC if supported
    if (isNFCSupported) {
      handleNFC();
    }
    // Note: Does NOT change levels - stays in L4
  };

  // Close popover when clicking outside
  useEffect(() => {
    if (!showQR) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowQR(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showQR]);

  // Handle QR download
  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImg = new Image();

    canvas.width = 512;
    canvas.height = 512;

    qrImg.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const padding = 40;
        ctx.drawImage(qrImg, padding, padding, canvas.width - (padding * 2), canvas.height - (padding * 2));

        // Add logo in center
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          const logoSize = 80;
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = (canvas.height - logoSize) / 2;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

          const link = document.createElement('a');
          link.download = `CryptoGift-Profile-${walletAddress.slice(0, 8)}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
        logoImg.onerror = () => {
          const link = document.createElement('a');
          link.download = `CryptoGift-Profile-${walletAddress.slice(0, 8)}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
        logoImg.src = '/cgc-logo-200x200.png';
      }
    };

    qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Share Button - styled like SocialSlot */}
      <button
        onClick={handleMainClick}
        className={`
          relative w-10 h-10 rounded-lg
          border-2 transition-all duration-300
          flex items-center justify-center
          ${copied
            ? 'border-emerald-500 bg-emerald-500/20 shadow-lg'
            : 'border-purple-500 bg-purple-500/20 shadow-lg hover:bg-purple-500/30'
          }
        `}
        style={{
          boxShadow: copied
            ? '0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 10px rgba(16, 185, 129, 0.2)'
            : '0 0 20px rgba(147, 51, 234, 0.4), inset 0 0 10px rgba(147, 51, 234, 0.2)',
        }}
        title={t('button')}
      >
        {copied ? (
          <Check className="w-5 h-5 text-emerald-500" />
        ) : (
          <Link2 className="w-5 h-5 text-purple-500" />
        )}
      </button>

      {/* Copied notification */}
      {copied && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 whitespace-nowrap">
          {t('copied')}
        </div>
      )}

      {/* NFC Active indicator */}
      {nfcActive && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg shadow-lg animate-pulse whitespace-nowrap">
          <Smartphone className="w-3.5 h-3.5" />
          {t('nfcReady')}
        </div>
      )}

      {/* NFC Error */}
      {nfcError && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap">
          {nfcError}
        </div>
      )}

      {/* QR Code Popover */}
      {showQR && (
        <div
          ref={popoverRef}
          className="absolute top-14 right-0 z-50 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                {t('qrTitle')}
              </h4>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('qrDescription')}
            </p>
          </div>

          {/* QR Code */}
          <div className="p-4">
            <div
              ref={qrRef}
              className="relative bg-white rounded-xl p-3 mx-auto w-fit"
            >
              <QRCodeSVG
                value={profileUrl}
                size={180}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1e1e2e"
              />
              {/* Logo overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white p-0.5 rounded-lg shadow-sm">
                  <img
                    src="/cgc-logo-200x200.png"
                    alt="CGC"
                    className="w-10 h-10 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {t('downloadQR')}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              {t('shareButton')}
            </button>
          </div>

          {/* NFC hint if supported */}
          {isNFCSupported && (
            <div className="px-4 pb-3">
              <button
                onClick={handleNFC}
                className={`
                  w-full flex items-center justify-center gap-2 py-2 px-3 text-xs rounded-lg transition-all
                  ${nfcActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 animate-pulse'
                    : 'bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <Smartphone className="w-3.5 h-3.5" />
                {nfcActive ? t('nfcReady') : t('activateNfc')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ShareButton;
