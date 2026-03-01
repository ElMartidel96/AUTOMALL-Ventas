/**
 * Vehicle Images API — Upload + Delete
 *
 * POST   /api/inventory/[id]/images — Upload images (FormData, multi-file)
 * DELETE /api/inventory/[id]/images?imageId=xxx&seller=0x...
 *
 * Client compresses to <4MB WebP before sending.
 * Server accepts up to 10MB as safety net.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// App Router: use route segment config (NOT `export const config`)
export const maxDuration = 30; // seconds — allow time for large uploads

const BUCKET = 'vehicle-images';
const MAX_IMAGES_PER_VEHICLE = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — generous server limit (client compresses to <4MB)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

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
      allowedMimeTypes: ALLOWED_TYPES,
    });
  } else {
    // Bucket exists — update limits in case they changed
    await db.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });
  }
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: vehicleId } = await context.params;
    const formData = await request.formData();
    const seller = formData.get('seller') as string;
    const files = formData.getAll('images') as File[];

    if (!seller || !/^0x[a-fA-F0-9]{40}$/.test(seller)) {
      return NextResponse.json(
        { error: 'Valid seller address required', success: false },
        { status: 400 }
      );
    }

    if (!files.length) {
      return NextResponse.json(
        { error: 'No images provided', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const sellerAddr = seller.toLowerCase();

    // Verify ownership
    const { data: vehicle } = await db
      .from('vehicles')
      .select('seller_address, image_count')
      .eq('id', vehicleId)
      .single();

    if (!vehicle || vehicle.seller_address !== sellerAddr) {
      return NextResponse.json(
        { error: 'Vehicle not found or unauthorized', success: false },
        { status: 403 }
      );
    }

    // Check image limit
    const currentCount = vehicle.image_count || 0;
    if (currentCount + files.length > MAX_IMAGES_PER_VEHICLE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES_PER_VEHICLE} images per vehicle. Current: ${currentCount}`, success: false },
        { status: 400 }
      );
    }

    await ensureBucket(db);

    const uploaded: Array<{ id: string; public_url: string; display_order: number }> = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate type — accept common image types
      if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        errors.push(`${file.name}: invalid type (${file.type})`);
        continue;
      }
      // Size check — client should compress, but enforce a generous server limit
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB)`);
        continue;
      }

      const order = currentCount + i;
      const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
      const storagePath = `${sellerAddr}/${vehicleId}/${order}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: file.type, upsert: false });

      if (uploadError) {
        errors.push(`${file.name}: upload failed`);
        continue;
      }

      const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(storagePath);
      const isPrimary = currentCount === 0 && i === 0;

      const { data: imgRecord, error: insertError } = await db
        .from('vehicle_images')
        .insert({
          vehicle_id: vehicleId,
          storage_path: storagePath,
          public_url: publicUrl,
          display_order: order,
          file_size: file.size,
          mime_type: file.type,
          is_primary: isPrimary,
        })
        .select('id, public_url, display_order')
        .single();

      if (insertError) {
        // Cleanup uploaded file
        await db.storage.from(BUCKET).remove([storagePath]);
        errors.push(`${file.name}: failed to save record`);
        continue;
      }

      uploaded.push(imgRecord);
    }

    // Update vehicle counts
    if (uploaded.length > 0) {
      const newCount = currentCount + uploaded.length;
      const primaryUrl = currentCount === 0 ? uploaded[0].public_url : undefined;
      const updatePayload: Record<string, unknown> = { image_count: newCount };
      if (primaryUrl) updatePayload.primary_image_url = primaryUrl;

      await db.from('vehicles').update(updatePayload).eq('id', vehicleId);
    }

    return NextResponse.json({
      success: true,
      data: { uploaded, errors },
    });
  } catch (error) {
    console.error('[Inventory] Image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: vehicleId } = await context.params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const seller = searchParams.get('seller');

    if (!imageId || !seller) {
      return NextResponse.json(
        { error: 'imageId and seller are required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const sellerAddr = seller.toLowerCase();

    // Verify ownership
    const { data: vehicle } = await db
      .from('vehicles')
      .select('seller_address, image_count')
      .eq('id', vehicleId)
      .single();

    if (!vehicle || vehicle.seller_address !== sellerAddr) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 403 }
      );
    }

    // Get image to delete
    const { data: image } = await db
      .from('vehicle_images')
      .select('storage_path, is_primary')
      .eq('id', imageId)
      .eq('vehicle_id', vehicleId)
      .single();

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found', success: false },
        { status: 404 }
      );
    }

    // Delete from storage
    await db.storage.from(BUCKET).remove([image.storage_path]);

    // Delete record
    await db.from('vehicle_images').delete().eq('id', imageId);

    // Recalculate counts and primary
    const newCount = Math.max(0, (vehicle.image_count || 1) - 1);
    const updatePayload: Record<string, unknown> = { image_count: newCount };

    if (image.is_primary || newCount === 0) {
      // Find new primary
      const { data: remaining } = await db
        .from('vehicle_images')
        .select('id, public_url')
        .eq('vehicle_id', vehicleId)
        .order('display_order', { ascending: true })
        .limit(1);

      if (remaining && remaining.length > 0) {
        updatePayload.primary_image_url = remaining[0].public_url;
        await db.from('vehicle_images').update({ is_primary: true }).eq('id', remaining[0].id);
      } else {
        updatePayload.primary_image_url = null;
      }
    }

    await db.from('vehicles').update(updatePayload).eq('id', vehicleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Inventory] Image delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
