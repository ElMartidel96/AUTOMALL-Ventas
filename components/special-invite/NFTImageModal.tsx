'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface NFTImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
  name: string;
  tokenId?: string;
  contractAddress?: string;
  metadata?: {
    description?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
}

/**
 * NFTImageModal - Elegant full-screen image viewer for Special Invites
 *
 * Adapted from CryptoGift Wallets project for DAO usage
 *
 * Features:
 * - Responsive layout: side-by-side for wide images, stacked for tall images
 * - Perfect aspect ratio preservation
 * - Smooth animations and blur backgrounds
 * - Keyboard navigation (Escape to close)
 * - Click outside to close
 * - Beautiful metadata display
 * - Mobile swipe-to-close
 */
export function NFTImageModal({
  isOpen,
  onClose,
  image,
  name,
  tokenId,
  contractAddress,
  metadata
}: NFTImageModalProps) {
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [isWideImage, setIsWideImage] = useState(false);

  // Mobile detection for enhanced mobile experience
  const [isMobile, setIsMobile] = useState(false);

  // Mobile swipe down to close functionality
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [minDragDistance, setMinDragDistance] = useState(0);

  // Portal state - renders to document.body to escape stacking context issues
  const [portalReady, setPortalReady] = useState(false);

  // Enable portal after mount (client-side only)
  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Detect image aspect ratio for adaptive layout
  useEffect(() => {
    if (!isOpen || !image) return;

    const img = new window.Image();
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(aspectRatio);
      setIsWideImage(aspectRatio >= 1.6);
    };
    img.src = image;
  }, [isOpen, image]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;

    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartTime(Date.now());
    setMinDragDistance(0);
    setDragY(0);

    const screenHeight = window.innerHeight;
    const touchInTopArea = touch.clientY < screenHeight * 0.25;

    if (touchInTopArea) {
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - touchStartY;
    const timeDiff = Date.now() - touchStartTime;

    if (deltaY > 20) {
      const adjustedDelta = deltaY - 20;
      const velocity = timeDiff > 0 ? adjustedDelta / timeDiff : 0;

      if (velocity > 0.1 || adjustedDelta > 30) {
        setMinDragDistance(Math.max(minDragDistance, adjustedDelta));
        const resistedY = adjustedDelta > 80
          ? 80 + (adjustedDelta - 80) * 0.4
          : adjustedDelta;
        setDragY(resistedY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;

    setIsDragging(false);
    const timeDiff = Date.now() - touchStartTime;
    const velocity = timeDiff > 0 ? minDragDistance / timeDiff : 0;

    const shouldClose = (
      minDragDistance > 100 && velocity > 0.3
    ) || minDragDistance > 150;

    if (shouldClose) {
      onClose();
    }

    setDragY(0);
    setTouchStartY(0);
    setTouchStartTime(0);
    setMinDragDistance(0);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Modal content - will be rendered via portal
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* MOBILE VERSION */}
          {isMobile ? (
            <motion.div
              className="fixed inset-0 z-[10050] bg-white dark:bg-slate-900 overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: dragY }}
              exit={{ y: '100%' }}
              transition={{ duration: isDragging ? 0 : 0.3, ease: 'easeOut' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: `translateY(${dragY}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
              }}
            >
              {/* Mobile Header */}
              <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">
                      Vista Previa
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Pull down hint */}
                <div className="text-center mt-2">
                  <div
                    className={`w-8 h-1 rounded-full mx-auto transition-all duration-200 ${
                      isDragging && minDragDistance > 60
                        ? 'bg-green-500 w-12 h-2'
                        : isDragging && minDragDistance > 20
                        ? 'bg-yellow-500 w-10 h-1.5'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  ></div>
                  <p className={`text-[10px] mt-1 transition-colors duration-200 ${
                    isDragging && minDragDistance > 60
                      ? 'text-green-600 dark:text-green-400 font-medium'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {isDragging && minDragDistance > 100
                      ? 'Suelta para cerrar!'
                      : isDragging && minDragDistance > 30
                      ? 'Sigue deslizando...'
                      : 'Desliza desde arriba para cerrar'
                    }
                  </p>
                </div>
              </div>

              {/* Mobile Content */}
              <div className="p-4 space-y-6">
                {/* Image Section */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4">
                  <Image
                    src={image}
                    alt={name}
                    width={400}
                    height={400}
                    className="w-full max-w-full h-auto object-contain rounded-lg"
                    priority={true}
                  />
                </div>

                {/* Content Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {name}
                    </h3>
                    {tokenId && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        ID: {tokenId}
                      </p>
                    )}
                    {contractAddress && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 font-mono mt-1">
                        {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
                      </p>
                    )}
                  </div>

                  {metadata?.description && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                        {metadata.description}
                      </p>
                    </div>
                  )}

                  {/* Attributes */}
                  {metadata?.attributes && metadata.attributes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">Atributos</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {metadata.attributes.map((attr, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">{attr.trait_type}</p>
                            <p className="text-[11px] font-medium text-slate-900 dark:text-white">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <div className="pt-4 pb-8">
                    <button
                      onClick={onClose}
                      className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Cerrar Vista Previa
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* DESKTOP VERSION */
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10050]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
              />

              {/* Modal Container */}
              <motion.div
                className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    onClose();
                  }
                }}
              >
                {/* Modal Content */}
                <div
                  className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden max-w-6xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Content Layout - Simple and Clean */}
                  <div className="flex flex-col lg:flex-row max-h-[85vh]">
                    {/* Image Section - Full width, proper aspect ratio */}
                    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 min-h-[300px]">
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={image}
                          alt={name}
                          width={1200}
                          height={800}
                          className="rounded-lg shadow-lg"
                          priority={true}
                          style={{
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '75vh',
                            width: 'auto',
                            height: 'auto'
                          }}
                        />
                      </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="lg:w-80 flex-shrink-0 p-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-y-auto">
                      <div className="space-y-4">
                        {/* Title & IDs */}
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                            {name}
                          </h2>
                          {tokenId && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              ID: {tokenId}
                            </p>
                          )}
                          {contractAddress && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300">
                                {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(contractAddress);
                                }}
                                className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              >
                                Copiar
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {metadata?.description && (
                          <div>
                            <h3 className="text-[11px] font-medium text-slate-900 dark:text-white mb-1">Descripcion</h3>
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed break-words">
                                {metadata.description}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Attributes */}
                        {metadata?.attributes && metadata.attributes.length > 0 && (
                          <div>
                            <h3 className="text-[11px] font-medium text-slate-900 dark:text-white mb-2">Atributos</h3>
                            <div className="space-y-1">
                              {metadata.attributes.map((attr, idx) => (
                                <div key={idx} className="flex justify-between items-center px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded text-[10px]">
                                  <span className="text-slate-600 dark:text-slate-400">{attr.trait_type}</span>
                                  <span className="font-medium text-slate-900 dark:text-white">{attr.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Info */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                            <div>Tipo: Invitacion Especial DAO</div>
                            <div>Network: Base Mainnet</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );

  // CRITICAL: Use Portal to render directly to document.body
  // This escapes any parent stacking context and ensures z-index works correctly
  // against other portaled elements (like the video player with z-index: 9999)
  if (portalReady && typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  // Fallback for SSR
  return modalContent;
}
