/**
 * AVATAR / LOGO UPLOAD API
 *
 * Uploads images to Supabase Storage and returns the public URL.
 * The caller (frontend) is responsible for saving the URL to the
 * appropriate table (sellers.logo_url, users.avatar_url, etc.).
 *
 * @endpoint POST /api/profile/avatar
 * @endpoint DELETE /api/profile/avatar?wallet=0x...&url=<encoded_url>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (client compresses before upload)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const AVATAR_BUCKET = 'avatars';

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
        { status: 400 }
      );
    }

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address', success: false },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP', success: false },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedWallet = wallet.toLowerCase();

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${normalizedWallet}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure bucket exists
    const { data: buckets } = await db.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === AVATAR_BUCKET);

    if (!bucketExists) {
      const { error: createError } = await db.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });

      if (createError) {
        console.error('Failed to create bucket:', createError);
        return NextResponse.json(
          { error: `Storage not configured. Please create the '${AVATAR_BUCKET}' bucket in Supabase Dashboard.`, success: false },
          { status: 500 }
        );
      }
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await db.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      let errorMessage = 'Failed to upload image';
      if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
        errorMessage = `Storage bucket '${AVATAR_BUCKET}' not found. Please create it in Supabase Dashboard.`;
      } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
        errorMessage = 'Storage permission denied. Check bucket policies in Supabase.';
      } else if (uploadError.message) {
        errorMessage = uploadError.message;
      }
      return NextResponse.json(
        { error: errorMessage, success: false },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = db.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Auto-update user_profiles.avatar_url (matches DAO behavior)
    const { error: updateError } = await db
      .from('user_profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', normalizedWallet);

    if (updateError) {
      // Non-critical: profile may not exist yet, or table may not exist
      console.warn('[Avatar] Could not update user_profiles:', updateError.message);
    }

    // Also update users.avatar_url for the AutoMALL user system
    try {
      await db
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('wallet_address', normalizedWallet);
    } catch {
      // Non-critical: users table may not have avatar_url column
    }

    return NextResponse.json({
      success: true,
      data: {
        avatar_url: avatarUrl,
        file_path: filePath,
      },
    });
  } catch (error) {
    console.error('Avatar upload failed:', error);
    return NextResponse.json(
      { error: 'Avatar upload failed', success: false },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/avatar?wallet=0x...&url=<encoded_url>
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const imageUrl = searchParams.get('url');

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address', success: false },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();

    // Extract file path from URL and delete from storage
    const urlParts = imageUrl.split('/');
    const filePath = `profiles/${urlParts[urlParts.length - 1]}`;

    await db.storage.from(AVATAR_BUCKET).remove([filePath]);

    return NextResponse.json({
      success: true,
      message: 'Image removed from storage',
    });
  } catch (error) {
    console.error('Avatar removal failed:', error);
    return NextResponse.json(
      { error: 'Avatar removal failed', success: false },
      { status: 500 }
    );
  }
}
