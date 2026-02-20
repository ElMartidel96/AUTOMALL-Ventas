import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authHelpers } from '@/lib/auth/middleware';
import { DEFAULT_TEAM_MEMBERS } from '@/lib/team/default-team';
import type { TeamMember } from '@/lib/team/types';
import {
  getTeamMemberFromStorage,
  isMissingTeamTableError,
  upsertTeamMemberInStorage,
} from '@/lib/team/storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_BUCKET = 'avatars';
const DEFAULT_STATS = {
  tasksCompleted: 0,
  reputation: 0,
  respect: 0,
  rank: 'Team',
  contributions: 0,
};

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

function buildMemberFallback({
  wallet,
  storedMember,
  fallback,
}: {
  wallet: string;
  storedMember: TeamMember | null;
  fallback: TeamMember | undefined;
}): TeamMember {
  return {
    name: storedMember?.name || fallback?.name || 'Team Member',
    role: storedMember?.role || fallback?.role || '',
    description: storedMember?.description || fallback?.description || '',
    wallet,
    imageSrc: storedMember?.imageSrc || fallback?.imageSrc,
    socials: {
      ...(fallback?.socials || {}),
      ...(storedMember?.socials || {}),
    },
    stats: {
      ...(fallback?.stats || DEFAULT_STATS),
      ...(storedMember?.stats || {}),
    },
  };
}

export const POST = authHelpers.admin(async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const wallet = formData.get('wallet') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedWallet = wallet.toLowerCase();
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `team/${normalizedWallet}-${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: buckets } = await db.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === AVATAR_BUCKET);

    if (!bucketExists) {
      const { error: createError } = await db.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });

      if (createError) {
        return NextResponse.json(
          { error: `Storage not configured. Please create the '${AVATAR_BUCKET}' bucket.` },
          { status: 500 }
        );
      }
    }

    const { error: uploadError } = await db.storage
      .from(AVATAR_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Team avatar upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message || 'Upload failed' }, { status: 500 });
    }

    const { data: urlData } = db.storage.from(AVATAR_BUCKET).getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    const { data: existing, error: existingError } = await db
      .from('team_members')
      .select('name, role, description, socials, stats, sort_order')
      .eq('wallet_address', normalizedWallet)
      .maybeSingle();

    if (existingError && isMissingTeamTableError(existingError)) {
      const storedMember = await getTeamMemberFromStorage(db, normalizedWallet);
      const fallback = DEFAULT_TEAM_MEMBERS.find(
        (member) => member.wallet.toLowerCase() === normalizedWallet
      );
      const baseMember = buildMemberFallback({
        wallet: normalizedWallet,
        storedMember,
        fallback,
      });
      const updatedMember = await upsertTeamMemberInStorage(db, {
        ...baseMember,
        imageSrc: imageUrl,
      });

      return NextResponse.json({
        success: true,
        data: {
          image_url: updatedMember.imageSrc,
        },
      });
    }

    const fallback = DEFAULT_TEAM_MEMBERS.find(
      (member) => member.wallet.toLowerCase() === normalizedWallet
    );

    const { error: updateError } = await db
      .from('team_members')
      .upsert(
        {
          wallet_address: normalizedWallet,
          name: existing?.name || fallback?.name || 'Team Member',
          role: existing?.role || fallback?.role || '',
          description: existing?.description || fallback?.description || '',
          socials: existing?.socials || fallback?.socials || {},
          stats: existing?.stats || fallback?.stats || {},
          sort_order: existing?.sort_order ?? null,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address' }
      );

    if (updateError) {
      console.error('Team avatar update error:', updateError);
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        image_url: imageUrl,
      },
    });
  } catch (error) {
    console.error('Team avatar upload failed:', error);
    return NextResponse.json({ error: 'Team avatar upload failed' }, { status: 500 });
  }
});
