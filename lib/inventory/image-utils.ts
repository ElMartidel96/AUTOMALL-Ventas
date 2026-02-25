/**
 * Client-side image compression utility
 *
 * Uses native Canvas API — zero dependencies.
 * Compresses images to WebP format with configurable quality and dimensions.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  type?: string;
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  type: 'image/webp',
};

/**
 * Compress an image file using Canvas API.
 * Returns a Blob ready for upload.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const { maxWidth, maxHeight, quality, type } = { ...DEFAULTS, ...options };

  // Create bitmap from file
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
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
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
  maxWidth?: number;
  maxHeight?: number;
  initialQuality?: number;
  maxOutputBytes?: number;
  preserveTransparency?: boolean;
}

/**
 * Smart image compression — accepts ANY file size.
 *
 * - Detects transparency and preserves it (PNG) when possible
 * - Iteratively reduces quality until output < maxOutputBytes
 * - Never rejects based on input size
 */
export async function compressImageSmart(
  file: File,
  options: SmartCompressOptions = {},
): Promise<{ blob: Blob; format: string }> {
  const {
    maxWidth = 500,
    maxHeight = 500,
    initialQuality = 0.85,
    maxOutputBytes = 2 * 1024 * 1024,
    preserveTransparency = true,
  } = options;

  // Detect transparency for format selection
  const transparent = preserveTransparency && await hasTransparency(file);
  const preferredFormat = transparent ? 'image/png' : 'image/webp';

  // First attempt with preferred format
  let blob = await compressImage(file, {
    maxWidth,
    maxHeight,
    quality: initialQuality,
    type: preferredFormat,
  });

  // If PNG is too large, fall back to WebP (lossy but smaller)
  if (blob.size > maxOutputBytes && transparent) {
    blob = await compressImage(file, {
      maxWidth,
      maxHeight,
      quality: initialQuality,
      type: 'image/webp',
    });
  }

  // Iteratively reduce quality until under limit
  let quality = initialQuality;
  while (blob.size > maxOutputBytes && quality > 0.3) {
    quality -= 0.1;
    blob = await compressImage(file, {
      maxWidth,
      maxHeight,
      quality,
      type: 'image/webp',
    });
  }

  return { blob, format: blob.type };
}
