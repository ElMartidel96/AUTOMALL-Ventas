/**
 * HERO IMAGE UPLOAD API
 *
 * Uploads seller background/hero images to Supabase Storage.
 * The caller saves the URL to sellers.hero_image_url.
 *
 * @endpoint POST /api/upload/hero
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const HERO_BUCKET = 'hero-images';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_DAO_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }

  supabase = createClient(url, key);
  return supabase;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const wallet = formData.get('wallet') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', success: false },
        { status: 400 },
      );
    }

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address', success: false },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP', success: false },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB', success: false },
        { status: 400 },
      );
    }

    const db = getSupabase();
    const normalizedWallet = wallet.toLowerCase();

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${normalizedWallet}-${Date.now()}.${fileExt}`;
    const filePath = `heroes/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure bucket exists
    const { data: buckets } = await db.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === HERO_BUCKET);

    if (!bucketExists) {
      const { error: createError } = await db.storage.createBucket(HERO_BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });

      if (createError) {
        console.error('Failed to create hero bucket:', createError);
        return NextResponse.json(
          { error: `Storage not configured. Please create the '${HERO_BUCKET}' bucket in Supabase Dashboard.`, success: false },
          { status: 500 },
        );
      }
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await db.storage
      .from(HERO_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Hero upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload image', success: false },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: urlData } = db.storage
      .from(HERO_BUCKET)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        hero_image_url: urlData.publicUrl,
        file_path: filePath,
      },
    });
  } catch (error) {
    console.error('Hero upload failed:', error);
    return NextResponse.json(
      { error: 'Hero image upload failed', success: false },
      { status: 500 },
    );
  }
}
