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

import { createClient } from '@supabase/supabase-js';
import { getMediaUrl, downloadMedia } from './api';

const BUCKET = 'vehicle-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.SUPABASE_DAO_URL;
  const key = process.env.SUPABASE_DAO_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  supabase = createClient(url, key);
  return supabase;
}

async function ensureBucket(db: ReturnType<typeof createClient>) {
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.some(b => b.name === BUCKET)) {
    await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
  }
}

export interface StagedImage {
  public_url: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
}

export interface UploadedImage {
  id: string;
  public_url: string;
  display_order: number;
  storage_path: string;
}

/**
 * Phase 1: Download images from WhatsApp → upload to staging in Supabase Storage.
 * Returns public URLs for AI analysis. Does NOT create vehicle_images records.
 */
export async function stageWhatsAppImages(
  mediaIds: string[],
  sellerAddress: string,
  waAccessToken: string
): Promise<StagedImage[]> {
  const db = getSupabase();
  await ensureBucket(db);

  const sellerAddr = sellerAddress.toLowerCase();
  const staged: StagedImage[] = [];

  for (let i = 0; i < mediaIds.length; i++) {
    try {
      const mediaInfo = await getMediaUrl(mediaIds[i], waAccessToken);
      const buffer = await downloadMedia(mediaInfo.url, waAccessToken);

      if (buffer.length > MAX_FILE_SIZE) {
        console.warn(`[WA-Pipeline] Image ${i} too large (${buffer.length} bytes), skipping`);
        continue;
      }

      const ext = mediaInfo.mime_type?.includes('png') ? 'png' : 'jpg';
      const storagePath = `${sellerAddr}/staging/${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const contentType = mediaInfo.mime_type || 'image/jpeg';

      const { error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType, upsert: false });

      if (uploadError) {
        console.error(`[WA-Pipeline] Stage upload failed for image ${i}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(storagePath);

      staged.push({
        public_url: publicUrl,
        storage_path: storagePath,
        file_size: buffer.length,
        mime_type: contentType,
      });
    } catch (error) {
      console.error(`[WA-Pipeline] Error staging image ${i}:`, error);
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
  const db = getSupabase();
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
