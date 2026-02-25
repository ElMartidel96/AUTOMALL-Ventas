'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Loader2, CheckCircle, AlertCircle, Upload, Trash2 } from 'lucide-react';
import {
  compressImageSmart,
  createPreviewUrl,
  revokePreviewUrl,
  type SmartCompressOptions,
} from '@/lib/inventory/image-utils';

type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'success' | 'error';

interface ImageUploadFieldProps {
  label: string;
  help: string;
  currentUrl?: string;
  /** Official default image shown when no custom image exists */
  defaultUrl?: string;
  /** Badge text for default image (e.g., "Official") */
  defaultLabel?: string;
  onUploadComplete: (url: string) => void;
  /** Callback when user removes their custom image */
  onDelete?: () => void | Promise<void>;
  uploadEndpoint: string;
  walletAddress: string;
  compressOptions?: SmartCompressOptions;
  previewAspect?: 'square' | 'wide';
  disabled?: boolean;
  /** i18n strings */
  strings: {
    dragOrClick: string;
    compressing: string;
    uploading: string;
    success: string;
    error: string;
    change: string;
    delete?: string;
    defaultBadge?: string;
  };
}

export function ImageUploadField({
  label,
  help,
  currentUrl,
  defaultUrl,
  defaultLabel,
  onUploadComplete,
  onDelete,
  uploadEndpoint,
  walletAddress,
  compressOptions,
  previewAspect = 'square',
  disabled = false,
  strings,
}: ImageUploadFieldProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) revokePreviewUrl(previewUrl);
    };
  }, [previewUrl]);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    // Show preview immediately
    if (previewUrl) revokePreviewUrl(previewUrl);
    const preview = createPreviewUrl(file);
    setPreviewUrl(preview);

    try {
      // Compress
      setStatus('compressing');
      const { blob, format } = await compressImageSmart(file, compressOptions);

      // Determine file extension
      const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

      // Upload
      setStatus('uploading');
      const formData = new FormData();
      formData.append('file', new File([blob], `upload.${ext}`, { type: format }));
      formData.append('wallet', walletAddress);

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Server error (${res.status})`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Extract URL from response (supports both avatar and hero endpoints)
      const uploadedUrl = data.data?.avatar_url || data.data?.hero_image_url;
      if (!uploadedUrl) throw new Error('No URL in response');

      setStatus('success');
      onUploadComplete(uploadedUrl);
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  }, [compressOptions, onUploadComplete, previewUrl, uploadEndpoint, walletAddress]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      if (previewUrl) {
        revokePreviewUrl(previewUrl);
        setPreviewUrl(null);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, previewUrl]);

  // Determine state
  const hasCustomImage = !!currentUrl;
  const hasDefault = !!defaultUrl;
  const displayUrl = previewUrl || currentUrl;
  const isProcessing = status === 'compressing' || status === 'uploading';
  const isBusy = isProcessing || isDeleting;

  const previewDimensions = previewAspect === 'square'
    ? { w: 80, h: 80, className: 'w-20 h-20 rounded-xl' }
    : { w: 240, h: 80, className: 'w-full h-24 rounded-xl' };

  const badgeText = strings.defaultBadge || defaultLabel || 'Default';

  // Hidden file input (shared across all states)
  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      onChange={handleFileChange}
      className="hidden"
      disabled={disabled || isBusy}
    />
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>

      {displayUrl ? (
        /* ── State B: Custom image (or preview of uploading file) ── */
        <div className="flex items-center gap-4">
          <div className={`${previewDimensions.className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 relative flex-shrink-0`}>
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-am-orange animate-spin" />
            ) : (
              <Image
                src={displayUrl}
                alt={label}
                width={previewDimensions.w}
                height={previewDimensions.h}
                className="w-full h-full object-cover"
                unoptimized
              />
            )}
          </div>
          <div className="flex-1">
            {fileInput}
            <div className="flex items-center gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={disabled || isBusy}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 inline mr-1.5" />
                {strings.change}
              </button>
              {onDelete && hasCustomImage && (
                <button
                  onClick={handleDelete}
                  disabled={disabled || isBusy}
                  className="px-3 py-2 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50"
                  aria-label={strings.delete || 'Remove'}
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
            <StatusMessage status={status} strings={strings} />
          </div>
        </div>
      ) : hasDefault ? (
        /* ── State A: No custom image, show default with badge ── */
        <div
          onClick={() => !disabled && !isBusy && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all p-4 ${
            isDragging
              ? 'border-am-orange bg-am-orange/5'
              : 'border-gray-200 dark:border-gray-700 hover:border-am-orange/50 hover:bg-am-orange/5'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {fileInput}
          <div className="flex items-center gap-4">
            <div className={`${previewDimensions.className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 relative flex-shrink-0`}>
              {isProcessing ? (
                <Loader2 className="w-6 h-6 text-am-orange animate-spin" />
              ) : (
                <>
                  <Image
                    src={defaultUrl}
                    alt={label}
                    width={previewDimensions.w}
                    height={previewDimensions.h}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-am-blue/80 text-white backdrop-blur-sm leading-none">
                    {badgeText}
                  </span>
                </>
              )}
            </div>
            <div className="flex-1">
              {isProcessing ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {status === 'compressing' ? strings.compressing : strings.uploading}
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {strings.dragOrClick}
                  </p>
                </div>
              )}
              <StatusMessage status={status} strings={strings} />
            </div>
          </div>
        </div>
      ) : (
        /* ── State C: No image, no default — empty drop zone ── */
        <div
          onClick={() => !disabled && !isProcessing && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all p-6 text-center ${
            isDragging
              ? 'border-am-orange bg-am-orange/5'
              : 'border-gray-200 dark:border-gray-700 hover:border-am-orange/50 hover:bg-am-orange/5'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {fileInput}
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-am-orange animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {status === 'compressing' ? strings.compressing : strings.uploading}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {strings.dragOrClick}
              </p>
            </div>
          )}
          <StatusMessage status={status} strings={strings} />
        </div>
      )}

      <p className="text-xs text-gray-400 mt-1">{help}</p>
    </div>
  );
}

function StatusMessage({
  status,
  strings,
}: {
  status: UploadStatus;
  strings: { success: string; error: string };
}) {
  if (status === 'success') {
    return (
      <p className="text-xs text-am-green flex items-center gap-1 mt-1">
        <CheckCircle className="w-3 h-3" />
        {strings.success}
      </p>
    );
  }
  if (status === 'error') {
    return (
      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3" />
        {strings.error}
      </p>
    );
  }
  return null;
}
