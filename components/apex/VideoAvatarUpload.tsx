'use client';

/**
 * VideoAvatarUpload - Upload component for video avatars
 *
 * Features:
 * - Drag and drop support
 * - File size validation (max 7MB)
 * - Video format validation
 * - Preview before upload
 * - Progress indicator
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Upload,
  X,
  Video,
  Image,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { VideoAvatar } from './VideoAvatar';

interface VideoAvatarUploadProps {
  currentVideoSrc?: string;
  currentImageSrc?: string;
  onUpload: (file: File, type: 'video' | 'image') => Promise<string>;
  onRemove?: () => void;
  maxSizeMB?: number;
  className?: string;
}

const MAX_SIZE_DEFAULT = 7; // 7MB default
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function VideoAvatarUpload({
  currentVideoSrc,
  currentImageSrc,
  onUpload,
  onRemove,
  maxSizeMB = MAX_SIZE_DEFAULT,
  className = '',
}: VideoAvatarUploadProps) {
  const t = useTranslations('apex');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'video' | 'image' | null>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback((file: File): { valid: boolean; type: 'video' | 'image' | null; error?: string } => {
    // Check file size
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        type: null,
        error: `File too large. Maximum size is ${maxSizeMB}MB.`,
      };
    }

    // Check file type
    if (ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return { valid: true, type: 'video' };
    }

    if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return { valid: true, type: 'image' };
    }

    return {
      valid: false,
      type: null,
      error: 'Invalid file type. Please upload a video (MP4, WebM, MOV) or image (JPG, PNG, WebP, GIF).',
    };
  }, [maxSizeBytes, maxSizeMB]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    const validation = validateFile(file);
    if (!validation.valid || !validation.type) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewType(validation.type);

    // Upload
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (real progress would come from upload API)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const uploadedUrl = await onUpload(file, validation.type);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Cleanup preview
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
        setPreviewType(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
      setPreviewType(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [validateFile, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Avatar Preview */}
      <div className="flex items-center gap-4">
        <VideoAvatar
          videoSrc={previewUrl && previewType === 'video' ? previewUrl : currentVideoSrc}
          imageSrc={previewUrl && previewType === 'image' ? previewUrl : currentImageSrc}
          size="xl"
          enableSound
        />

        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            Profile Avatar
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a video or image for your profile avatar.
            Max size: {maxSizeMB}MB
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`
          relative
          border-2 border-dashed rounded-xl
          p-6
          transition-colors duration-200
          ${isDragging
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
            : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
          }
          ${isUploading ? 'pointer-events-none' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={[...ACCEPTED_VIDEO_TYPES, ...ACCEPTED_IMAGE_TYPES].join(',')}
          onChange={handleFileSelect}
        />

        <div className="flex flex-col items-center gap-3 text-center">
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Uploading...
                </p>
                <div className="w-48 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Video className="w-8 h-8 text-purple-500" />
                <span className="text-gray-400">/</span>
                <Image className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  MP4, WebM, MOV, JPG, PNG, WebP, GIF (max {maxSizeMB}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Remove Button */}
      {(currentVideoSrc || currentImageSrc) && onRemove && !isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            w-full py-2 px-4
            text-sm text-red-600 dark:text-red-400
            border border-red-200 dark:border-red-800
            rounded-lg
            hover:bg-red-50 dark:hover:bg-red-900/20
            transition-colors duration-200
          "
        >
          Remove Avatar
        </button>
      )}
    </div>
  );
}

export default VideoAvatarUpload;
