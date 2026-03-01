/**
 * Client-side image compression utility
 *
 * Uses native Canvas API — zero dependencies.
 * Compresses images to WebP format with configurable quality and dimensions.
 *
 * Designed to handle ANY input size (phone cameras produce 8-30MB files).
 * The pipeline: createImageBitmap → scale → canvas → toBlob(webp).
 * Memory-safe: bitmaps are closed immediately after drawing.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  type?: string;
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  type: 'image/webp',
};

/**
 * Compress an image file using Canvas API.
 * Returns a Blob ready for upload.
 *
 * Handles very large files by using createImageBitmap (which is memory-efficient
 * and supported on all modern browsers including mobile Safari 15+).
 */
export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<Blob> {
  const { maxWidth, maxHeight, quality, type } = { ...DEFAULTS, ...options };

  // createImageBitmap handles HEIC, JPEG, PNG, WebP, GIF natively
  // It decodes without loading the full uncompressed bitmap into JS memory
  const bitmap = await createImageBitmap(file);
  const { width: origW, height: origH } = bitmap;

  // Calculate scaled dimensions (maintain aspect ratio)
  let targetW = origW;
  let targetH = origH;

  if (origW > maxWidth || origH > maxHeight) {
    const ratio = Math.min(maxWidth / origW, maxHeight / origH);
    targetW = Math.round(origW * ratio);
    targetH = Math.round(origH * ratio);
  }

  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas context not available');
  }

  // Use high-quality image smoothing for downscaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close(); // Free native memory immediately

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // Release canvas memory
        canvas.width = 0;
        canvas.height = 0;
        if (blob) resolve(blob);
        else reject(new Error('Failed to compress image'));
      },
      type,
      quality
    );
  });
}

/**
 * Create a thumbnail preview URL from a File.
 * Returns a data URL string for immediate display.
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory.
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Smart Compression ──────────────────────────────────────────────────────

/**
 * Detect if an image has transparency (alpha channel).
 * Samples a small version for speed.
 */
export async function hasTransparency(file: File): Promise<boolean> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const sampleW = Math.min(bitmap.width, 100);
    const sampleH = Math.min(bitmap.height, 100);
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return false; }
    ctx.drawImage(bitmap, 0, 0, sampleW, sampleH);
    bitmap.close();
    const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export interface SmartCompressOptions {
  /** Max output width in pixels (default: 2048 — sharp for car photos) */
  maxWidth?: number;
  /** Max output height in pixels (default: 2048) */
  maxHeight?: number;
  /** Starting quality 0-1 (default: 0.88 — high fidelity) */
  initialQuality?: number;
  /** Target max file size in bytes (default: 4MB — safe under server limit) */
  maxOutputBytes?: number;
  /** Try to preserve PNG transparency (default: true) */
  preserveTransparency?: boolean;
}

/**
 * Smart image compression — accepts ANY file size, ANY format.
 *
 * Pipeline:
 * 1. Accept input of any size (phone cameras: 8-30MB, DSLR: 20-50MB)
 * 2. Detect transparency → choose PNG or WebP
 * 3. Scale down to maxWidth/maxHeight preserving aspect ratio
 * 4. WebP output at high quality (0.88) → check size
 * 5. If still over limit, iteratively reduce quality (0.05 steps, min 0.4)
 * 6. If still over limit at min quality, reduce dimensions by 75% and retry
 * 7. Never rejects — always produces a usable output
 *
 * Quality preservation strategy:
 * - 2048px max dimension = excellent for car listing photos (covers 2K displays)
 * - WebP at 0.88 quality = virtually indistinguishable from original
 * - Only reduces quality/dimensions as last resort for truly enormous files
 */
export async function compressImageSmart(
  file: File,
  options: SmartCompressOptions = {},
): Promise<{ blob: Blob; format: string; finalQuality: number; originalSize: number }> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    initialQuality = 0.88,
    maxOutputBytes = 4 * 1024 * 1024, // 4MB — safe headroom under server limit
    preserveTransparency = true,
  } = options;

  const originalSize = file.size;

  // Skip compression for already-small files (< 500KB)
  if (file.size < 500 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return { blob: file, format: file.type, finalQuality: 1, originalSize };
  }

  // Detect transparency for format selection (car photos: almost never)
  const transparent = preserveTransparency && file.type === 'image/png' && await hasTransparency(file);
  const preferredFormat = transparent ? 'image/png' : 'image/webp';

  // Phase 1: Compress at full quality with preferred format
  let blob = await compressImage(file, {
    maxWidth,
    maxHeight,
    quality: initialQuality,
    type: preferredFormat,
  });

  // If PNG is too large, fall back to WebP (lossy but much smaller)
  if (blob.size > maxOutputBytes && transparent) {
    blob = await compressImage(file, {
      maxWidth,
      maxHeight,
      quality: initialQuality,
      type: 'image/webp',
    });
  }

  // Phase 2: Iteratively reduce quality (fine steps for minimal visual loss)
  let quality = initialQuality;
  const MIN_QUALITY = 0.4;
  const QUALITY_STEP = 0.05;

  while (blob.size > maxOutputBytes && quality > MIN_QUALITY) {
    quality = Math.max(quality - QUALITY_STEP, MIN_QUALITY);
    blob = await compressImage(file, {
      maxWidth,
      maxHeight,
      quality,
      type: 'image/webp',
    });
  }

  // Phase 3: If STILL over limit (rare — extremely high-res source), reduce dimensions
  if (blob.size > maxOutputBytes) {
    const reducedW = Math.round(maxWidth * 0.75);
    const reducedH = Math.round(maxHeight * 0.75);
    blob = await compressImage(file, {
      maxWidth: reducedW,
      maxHeight: reducedH,
      quality: MIN_QUALITY,
      type: 'image/webp',
    });
  }

  return { blob, format: blob.type, finalQuality: quality, originalSize };
}
