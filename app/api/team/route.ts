import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { TeamMember } from '@/lib/team/types';
import { DEFAULT_TEAM_MEMBERS } from '@/lib/team/default-team';
import {
  isMissingTeamTableError,
  readTeamMembersFromStorage,
  upsertTeamMemberInStorage,
} from '@/lib/team/storage';
import { authHelpers } from '@/lib/auth/middleware';

type TeamMemberRow = {
  id: string;
  wallet_address: string;
  name: string;
  role: string;
  description: string;
  image_url: string | null;
  socials: Record<string, string> | null;
  stats: Record<string, string | number> | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
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

function mapRowToMember(row: TeamMemberRow): TeamMember {
  const fallback = DEFAULT_TEAM_MEMBERS.find(
    (member) => member.wallet.toLowerCase() === row.wallet_address.toLowerCase()
  );

  return {
    name: row.name || fallback?.name || 'Team Member',
    role: row.role || fallback?.role || '',
    description: row.description || fallback?.description || '',
    wallet: row.wallet_address,
    imageSrc: row.image_url || fallback?.imageSrc,
    socials: {
      ...(fallback?.socials || {}),
      ...(row.socials || {}),
    },
    stats: {
      ...(fallback?.stats || {
        tasksCompleted: 0,
        reputation: 0,
        respect: 0,
        rank: 'Team',
        contributions: 0,
      }),
      ...(row.stats || {}),
    },
  };
}

export async function GET() {
  try {
    const db = getSupabase();
    const { data, error } = await db
      .from('team_members')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      if (isMissingTeamTableError(error)) {
        const storedMembers = await readTeamMembersFromStorage(db);
        if (storedMembers?.length) {
          return NextResponse.json({ success: true, data: storedMembers });
        }
      }

      console.error('Team fetch error:', error);
      return NextResponse.json({ success: true, data: DEFAULT_TEAM_MEMBERS });
    }

    if (!data || data.length === 0) {
      const storedMembers = await readTeamMembersFromStorage(db);
      if (storedMembers?.length) {
        return NextResponse.json({ success: true, data: storedMembers });
      }

      return NextResponse.json({ success: true, data: DEFAULT_TEAM_MEMBERS });
    }

    const members = (data as TeamMemberRow[]).map(mapRowToMember);
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('Team fetch failed:', error);
    return NextResponse.json({ success: true, data: DEFAULT_TEAM_MEMBERS });
  }
}

export const PATCH = authHelpers.admin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const member = body?.member as TeamMember | undefined;

    if (!member || !member.wallet) {
      return NextResponse.json({ error: 'Member payload is required' }, { status: 400 });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(member.wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const db = getSupabase();
    const payload = {
      wallet_address: member.wallet.toLowerCase(),
      name: member.name,
      role: member.role,
      description: member.description,
      image_url: member.imageSrc || null,
      socials: member.socials || {},
      stats: member.stats || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('team_members')
      .upsert(payload, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (error) {
      if (isMissingTeamTableError(error)) {
        const storedMember = await upsertTeamMemberInStorage(db, member);
        return NextResponse.json({
          success: true,
          data: storedMember,
        });
      }

      console.error('Team update error:', error);
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: mapRowToMember(data as TeamMemberRow),
    });
  } catch (error) {
    console.error('Team update failed:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
});
