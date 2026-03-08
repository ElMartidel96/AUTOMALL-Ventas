/**
 * WhatsApp Image Pipeline
 *
 * Two-phase image handling to avoid double-processing:
 *
 * Phase 1 (extraction): Download from WA → upload to staging in Supabase Storage
 *   Returns public URLs for AI Vision analysis. No vehicle_images records yet.
 *
 * Phase 2 (vehicle creation): Move staged images → insert vehicle_images records
 *   Reassigns storage paths from staging to final vehicle ID. No re-download.
 */

import { getTypedClient } from '@/lib/supabase/client';
import { getMediaUrl, downloadMedia } from './api';

const BUCKET = 'vehicle-images';
const DOWNLOAD_RETRY_ATTEMPTS = 2;
const DOWNLOAD_RETRY_DELAY_MS = 1500;

let bucketChecked = false;

async function ensureBucket() {
  if (bucketChecked) return;
  const db = getTypedClient();
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.some(b => b.name === BUCKET)) {
    await db.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
  }
  bucketChecked = true;
}

export interface StagedImage {
  public_url: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  buffer?: Buffer; // Kept for inline GPT-4o analysis (avoids OpenAI download timeout)
}

export interface UploadedImage {
  id: string;
  public_url: string;
  display_order: number;
  storage_path: string;
}

/**
 * Download a single image from WhatsApp CDN with retry logic.
 */
async function downloadWithRetry(
  mediaId: string,
  waAccessToken: string,
  index: number
): Promise<{ buffer: Buffer; mime_type: string } | null> {
  for (let attempt = 0; attempt <= DOWNLOAD_RETRY_ATTEMPTS; attempt++) {
    try {
      const mediaInfo = await getMediaUrl(mediaId, waAccessToken);
      const buffer = await downloadMedia(mediaInfo.url, waAccessToken);

      return { buffer, mime_type: mediaInfo.mime_type || 'image/jpeg' };
    } catch (error) {
      if (attempt < DOWNLOAD_RETRY_ATTEMPTS) {
        console.warn(`[WA-Pipeline] Retry ${attempt + 1}/${DOWNLOAD_RETRY_ATTEMPTS} for image ${index}`);
        await new Promise(r => setTimeout(r, DOWNLOAD_RETRY_DELAY_MS * (attempt + 1)));
      } else {
        console.error(`[WA-Pipeline] Failed to download image ${index} after ${DOWNLOAD_RETRY_ATTEMPTS + 1} attempts:`, error);
        return null;
      }
    }
  }
  return null;
}

/**
 * Phase 1: Download images from WhatsApp → upload to staging in Supabase Storage.
 * Downloads in parallel for performance. Does NOT create vehicle_images records.
 */
export async function stageWhatsAppImages(
  mediaIds: string[],
  sellerAddress: string,
  waAccessToken: string
): Promise<StagedImage[]> {
  const db = getTypedClient();
  await ensureBucket();

  const sellerAddr = sellerAddress.toLowerCase();

  // Download all images in parallel
  const downloadResults = await Promise.allSettled(
    mediaIds.map((id, i) => downloadWithRetry(id, waAccessToken, i))
  );

  const staged: StagedImage[] = [];

  for (let i = 0; i < downloadResults.length; i++) {
    const result = downloadResults[i];
    if (result.status === 'rejected' || !result.value) continue;

    const { buffer, mime_type } = result.value;

    try {
      const ext = mime_type.includes('png') ? 'png' : 'jpg';
      const storagePath = `${sellerAddr}/staging/${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: mime_type, upsert: false });

      if (uploadError) {
        console.error(`[WA-Pipeline] Stage upload failed for image ${i}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(storagePath);

      staged.push({
        public_url: publicUrl,
        storage_path: storagePath,
        file_size: buffer.length,
        mime_type,
        buffer, // Keep for inline GPT-4o (avoids Supabase download timeout)
      });
    } catch (error) {
      console.error(`[WA-Pipeline] Error uploading image ${i}:`, error);
    }
  }

  return staged;
}

/**
 * Phase 2: Move staged images to final vehicle path + create vehicle_images records.
 * Copies files in storage (staging → vehicle folder), then removes staging copies.
 */
export async function finalizeVehicleImages(
  stagedImages: StagedImage[],
  vehicleId: string,
  sellerAddress: string
): Promise<UploadedImage[]> {
  const db = getTypedClient();
  const sellerAddr = sellerAddress.toLowerCase();
  const uploaded: UploadedImage[] = [];

  for (let i = 0; i < stagedImages.length; i++) {
    const staged = stagedImages[i];
    try {
      // Copy from staging to final vehicle path
      const ext = staged.mime_type.includes('png') ? 'png' : 'jpg';
      const finalPath = `${sellerAddr}/${vehicleId}/${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: copyError } = await db.storage
        .from(BUCKET)
        .copy(staged.storage_path, finalPath);

      if (copyError) {
        // Fallback: use the staging path directly (still valid)
        console.warn(`[WA-Pipeline] Copy failed, using staging path for image ${i}:`, copyError);
      }

      const usedPath = copyError ? staged.storage_path : finalPath;
      const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(usedPath);

      const isPrimary = i === 0;

      const { data: imgRecord, error: insertError } = await db
        .from('vehicle_images')
        .insert({
          vehicle_id: vehicleId,
          storage_path: usedPath,
          public_url: publicUrl,
          display_order: i,
          file_size: staged.file_size,
          mime_type: staged.mime_type,
          is_primary: isPrimary,
        })
        .select('id, public_url, display_order')
        .single();

      if (insertError) {
        console.error(`[WA-Pipeline] Insert record failed for image ${i}:`, insertError);
        continue;
      }

      uploaded.push({ ...imgRecord, storage_path: usedPath });

      // Cleanup staging file (only if copy succeeded)
      if (!copyError) {
        db.storage.from(BUCKET).remove([staged.storage_path]).catch(() => {});
      }
    } catch (error) {
      console.error(`[WA-Pipeline] Error finalizing image ${i}:`, error);
    }
  }

  // Update vehicle image count and primary URL
  if (uploaded.length > 0) {
    await db.from('vehicles').update({
      image_count: uploaded.length,
      primary_image_url: uploaded[0].public_url,
    }).eq('id', vehicleId);
  }

  return uploaded;
}

/**
 * Cleanup: Remove staging images from Supabase Storage.
 * Called on session cancel, error, or expiry to prevent orphaned files.
 */
export async function cleanupStagingImages(imageUrls: string[]): Promise<void> {
  if (imageUrls.length === 0) return;

  try {
    const db = getTypedClient();
    const paths = imageUrls
      .filter(url => url.includes('/vehicle-images/') && url.includes('/staging/'))
      .map(url => url.split('/vehicle-images/')[1])
      .filter(Boolean);

    if (paths.length > 0) {
      await db.storage.from(BUCKET).remove(paths);
      console.log(`[WA-Pipeline] Cleaned up ${paths.length} staging images`);
    }
  } catch (error) {
    console.error('[WA-Pipeline] Cleanup error:', error);
  }
}
