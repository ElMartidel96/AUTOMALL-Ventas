'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import { X, Download, Copy, Check, Share2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralLink: string;
  referralCode: string;
}

export function QRCodeModal({ isOpen, onClose, referralLink, referralCode }: QRCodeModalProps) {
  const t = useTranslations('referrals');
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImg = new Image();

    // Set canvas size (larger for better quality)
    canvas.width = 512;
    canvas.height = 512;

    qrImg.onload = () => {
      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code centered
        const padding = 40;
        ctx.drawImage(qrImg, padding, padding, canvas.width - (padding * 2), canvas.height - (padding * 2));

        // Draw logo in center
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          const logoSize = 80;
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = (canvas.height - logoSize) / 2;

          // White background for logo
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

          // Download
          const link = document.createElement('a');
          link.download = `CryptoGift-QR-${referralCode}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
        logoImg.onerror = () => {
          // Download without logo if it fails to load
          const link = document.createElement('a');
          link.download = `CryptoGift-QR-${referralCode}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
        logoImg.src = '/cgc-logo-200x200.png';
      }
    };

    qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CryptoGift DAO - Referral Invite',
          text: t('share.message') || 'Join CryptoGift DAO with my referral link and earn CGC tokens!',
          url: referralLink,
        });
      } catch (err) {
        // User cancelled or share failed, copy instead
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-700">
          {/* Gradient decoration */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Content */}
          <div className="relative p-6 pt-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg mb-4">
                <QrCode className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('qrModal.title') || 'Your Referral QR Code'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('qrModal.description') || 'Scan to join CryptoGift DAO'}
              </p>
            </div>

            {/* QR Code with Logo Overlay */}
            <div
              ref={qrRef}
              className="relative flex items-center justify-center p-6 bg-white rounded-xl shadow-inner mx-auto max-w-[280px]"
            >
              <QRCodeSVG
                value={referralLink}
                size={220}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1e1e2e"
              />
              {/* Logo overlay in center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white p-1 rounded-lg shadow-sm">
                  <img
                    src="/cgc-logo-200x200.png"
                    alt="CGC"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Referral Code Display */}
            <div className="mt-6 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-1">
                {t('qrModal.code') || 'Referral Code'}
              </p>
              <p className="text-center font-mono font-bold text-lg text-purple-600 dark:text-purple-400">
                {referralCode}
              </p>
            </div>

            {/* Link Display */}
            <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-1">
                {t('qrModal.link') || 'Referral Link'}
              </p>
              <p className="text-center text-sm text-gray-700 dark:text-gray-300 truncate px-2">
                {referralLink}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500 mb-1" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-600 dark:text-gray-300 mb-1" />
                )}
                <span className="text-xs">
                  {copied ? (t('qrModal.copied') || 'Copied!') : (t('qrModal.copy') || 'Copy')}
                </span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={handleDownload}
              >
                <Download className="h-5 w-5 text-gray-600 dark:text-gray-300 mb-1" />
                <span className="text-xs">{t('qrModal.download') || 'Download'}</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center py-4 h-auto dark:border-slate-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-300 mb-1" />
                <span className="text-xs">{t('qrModal.share') || 'Share'}</span>
              </Button>
            </div>

            {/* Footer tip */}
            <p className="mt-4 text-xs text-center text-gray-400 dark:text-gray-500">
              {t('qrModal.tip') || 'Friends who scan this code will automatically be linked to your referral network'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
