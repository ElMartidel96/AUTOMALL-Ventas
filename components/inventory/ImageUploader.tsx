'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { compressImageSmart, createPreviewUrl, revokePreviewUrl, formatFileSize } from '@/lib/inventory/image-utils';
import { Upload, X, GripVertical, Loader2, ImageIcon, Star, AlertCircle, RotateCcw } from 'lucide-react';

export interface LocalImage {
  id: string;
  file: File;
  preview: string;
  compressed?: Blob;
  compressedSize?: number;
  status: 'pending' | 'compressing' | 'ready' | 'uploading' | 'done' | 'error';
  error?: string;
}

export interface UploadedImage {
  id: string;
  public_url: string;
  display_order: number;
}

interface ImageUploaderProps {
  localImages: LocalImage[];
  uploadedImages: UploadedImage[];
  onAddFiles: (images: LocalImage[]) => void;
  onRemoveLocal: (id: string) => void;
  onRemoveUploaded: (id: string) => void;
  onReorder: (ids: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUploader({
  localImages,
  uploadedImages,
  onAddFiles,
  onRemoveLocal,
  onRemoveUploaded,
  onReorder,
  maxImages = 10,
  disabled = false,
}: ImageUploaderProps) {
  const t = useTranslations('inventory.images');
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = localImages.length + uploadedImages.length;
  const canAdd = totalImages < maxImages;

  // Compress a single image with retry support
  const compressSingleImage = useCallback(async (img: LocalImage) => {
    try {
      const { blob } = await compressImageSmart(img.file);
      img.compressed = blob;
      img.compressedSize = blob.size;
      img.status = 'ready';
      img.error = undefined;
    } catch (err) {
      // Retry once — mobile browsers can fail on first attempt due to memory pressure
      try {
        // Small delay to let GC reclaim memory
        await new Promise(r => setTimeout(r, 300));
        const { blob } = await compressImageSmart(img.file, {
          maxWidth: 1536,    // Slightly smaller on retry
          maxHeight: 1536,
        });
        img.compressed = blob;
        img.compressedSize = blob.size;
        img.status = 'ready';
        img.error = undefined;
      } catch {
        img.status = 'error';
        img.error = err instanceof Error ? err.message : t('compressionFailed');
      }
    }
  }, [t]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const remaining = maxImages - totalImages;
    const toProcess = fileArr.slice(0, remaining);

    const newImages: LocalImage[] = [];

    for (const file of toProcess) {
      // Accept any image type — no size limit, compression handles everything
      if (!file.type.startsWith('image/') && !file.name.match(/\.(heic|heif)$/i)) continue;

      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const preview = createPreviewUrl(file);

      const img: LocalImage = { id, file, preview, status: 'compressing' };
      newImages.push(img);
    }

    if (newImages.length === 0) return;
    onAddFiles(newImages);

    // Compress each image sequentially (memory-safe for mobile)
    for (const img of newImages) {
      await compressSingleImage(img);
      // Trigger re-render after each image completes
      onAddFiles([]);
    }
  }, [maxImages, totalImages, onAddFiles, compressSingleImage]);

  // Retry compression for a failed image
  const handleRetryCompression = useCallback(async (imageId: string) => {
    const img = localImages.find(i => i.id === imageId);
    if (!img) return;
    img.status = 'compressing';
    img.error = undefined;
    onAddFiles([]); // trigger re-render
    await compressSingleImage(img);
    onAddFiles([]); // trigger re-render with result
  }, [localImages, onAddFiles, compressSingleImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || !canAdd) return;
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, canAdd, processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  // Drag-to-reorder for uploaded images
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnd = () => setDraggedId(null);
  const handleDragOverItem = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const ids = uploadedImages.map(img => img.id);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newIds = [...ids];
    newIds.splice(fromIdx, 1);
    newIds.splice(toIdx, 0, draggedId);
    onReorder(newIds);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (canAdd) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => canAdd && !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragOver
            ? 'border-am-orange bg-am-orange/5 scale-[1.01]'
            : 'border-gray-300 dark:border-gray-600 hover:border-am-orange/50'
          }
          ${!canAdd || disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || !canAdd}
        />
        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('dropzone')}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {t('formats')} · {t('anySize')} · {totalImages}/{maxImages}
        </p>
      </div>

      {/* Image grid */}
      {(uploadedImages.length > 0 || localImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Uploaded images (reorderable) */}
          {uploadedImages.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(img.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, img.id)}
              className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all
                ${draggedId === img.id ? 'opacity-50 border-am-orange' : 'border-transparent hover:border-am-blue/30'}
              `}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.public_url} alt="" className="w-full h-full object-cover" />
              {/* Drag handle */}
              <div className="absolute top-1 left-1 p-1 bg-black/50 rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3 text-white" />
              </div>
              {/* Primary badge */}
              {idx === 0 && (
                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-am-orange text-white text-[10px] rounded font-medium flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" />
                  {t('primary')}
                </div>
              )}
              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveUploaded(img.id); }}
                className="absolute bottom-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}

          {/* Local images (pending upload) */}
          {localImages.map((img) => (
            <div
              key={img.id}
              className={`relative group aspect-square rounded-lg overflow-hidden border-2 border-dashed transition-colors
                ${img.status === 'error'
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
                }
              `}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              {/* Status overlay — compressing */}
              {img.status === 'compressing' && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                  <span className="text-[10px] text-white/80">{t('optimizing')}</span>
                </div>
              )}
              {/* Status overlay — uploading */}
              {img.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                  <Loader2 className="w-6 h-6 text-am-orange animate-spin" />
                  <span className="text-[10px] text-white/80">{t('uploading')}</span>
                </div>
              )}
              {/* Status overlay — error with retry */}
              {img.status === 'error' && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5 p-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-[10px] text-white text-center leading-tight">
                    {img.error || t('compressionFailed')}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRetryCompression(img.id); }}
                    className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-[10px] text-white transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('retry')}
                  </button>
                </div>
              )}
              {/* Size info — show original → compressed */}
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
                {img.compressedSize
                  ? `${formatFileSize(img.file.size)} → ${formatFileSize(img.compressedSize)}`
                  : formatFileSize(img.file.size)
                }
              </div>
              {/* Delete button */}
              <button
                onClick={() => { revokePreviewUrl(img.preview); onRemoveLocal(img.id); }}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}

          {/* Add more placeholder */}
          {canAdd && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-am-orange/50 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <ImageIcon className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">+</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
