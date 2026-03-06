/**
 * WhatsApp Image Pipeline
 *
 * Downloads images from WhatsApp Cloud API and uploads to Supabase Storage.
 * Reuses the exact pattern from app/api/inventory/[id]/images/route.ts.
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

export interface UploadedImage {
  id: string;
  public_url: string;
  display_order: number;
  storage_path: string;
}

/**
 * Download images from WhatsApp and upload to Supabase Storage.
 * Returns public URLs for all successfully uploaded images.
 */
export async function processWhatsAppImages(
  mediaIds: string[],
  vehicleId: string,
  sellerAddress: string,
  waAccessToken: string
): Promise<UploadedImage[]> {
  const db = getSupabase();
  await ensureBucket(db);

  const sellerAddr = sellerAddress.toLowerCase();
  const uploaded: UploadedImage[] = [];

  for (let i = 0; i < mediaIds.length; i++) {
    try {
      // 1. Get download URL from WhatsApp
      const mediaInfo = await getMediaUrl(mediaIds[i], waAccessToken);

      // 2. Download the image binary
      const buffer = await downloadMedia(mediaInfo.url, waAccessToken);

      if (buffer.length > MAX_FILE_SIZE) {
        console.warn(`[WA-Pipeline] Image ${i} too large (${buffer.length} bytes), skipping`);
        continue;
      }

      // 3. Upload to Supabase Storage
      const ext = mediaInfo.mime_type?.includes('png') ? 'png' : 'jpg';
      const storagePath = `${sellerAddr}/${vehicleId}/${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const contentType = mediaInfo.mime_type || 'image/jpeg';

      const { error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType, upsert: false });

      if (uploadError) {
        console.error(`[WA-Pipeline] Upload failed for image ${i}:`, uploadError);
        continue;
      }

      // 4. Get public URL
      const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(storagePath);

      // 5. Insert into vehicle_images table
      const isPrimary = i === 0;

      const { data: imgRecord, error: insertError } = await db
        .from('vehicle_images')
        .insert({
          vehicle_id: vehicleId,
          storage_path: storagePath,
          public_url: publicUrl,
          display_order: i,
          file_size: buffer.length,
          mime_type: contentType,
          is_primary: isPrimary,
        })
        .select('id, public_url, display_order')
        .single();

      if (insertError) {
        // Cleanup uploaded file
        await db.storage.from(BUCKET).remove([storagePath]);
        console.error(`[WA-Pipeline] Insert record failed for image ${i}:`, insertError);
        continue;
      }

      uploaded.push({ ...imgRecord, storage_path: storagePath });
    } catch (error) {
      console.error(`[WA-Pipeline] Error processing image ${i}:`, error);
    }
  }

  // Update vehicle image count and primary URL
  if (uploaded.length > 0) {
    const updatePayload: Record<string, unknown> = {
      image_count: uploaded.length,
      primary_image_url: uploaded[0].public_url,
    };

    await db.from('vehicles').update(updatePayload).eq('id', vehicleId);
  }

  return uploaded;
}
