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
