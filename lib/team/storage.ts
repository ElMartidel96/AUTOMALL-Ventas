import type { SupabaseClient } from '@supabase/supabase-js';
import type { TeamMember } from './types';
import { DEFAULT_TEAM_MEMBERS } from './default-team';

const TEAM_DATA_BUCKET = 'team-data';
const TEAM_DATA_PATH = 'team/team-members.json';
const MAX_TEAM_JSON_SIZE = 1024 * 1024;

const DEFAULT_STATS = {
  tasksCompleted: 0,
  reputation: 0,
  respect: 0,
  rank: 'Team',
  contributions: 0,
};

type StoredTeamPayload = {
  members: TeamMember[];
  updatedAt?: string;
};

function normalizeMember(member: TeamMember): TeamMember {
  const fallback = DEFAULT_TEAM_MEMBERS.find(
    (defaultMember) => defaultMember.wallet.toLowerCase() === member.wallet.toLowerCase()
  );

  return {
    name: member.name || fallback?.name || 'Team Member',
    role: member.role || fallback?.role || '',
    description: member.description || fallback?.description || '',
    wallet: member.wallet,
    imageSrc: member.imageSrc || fallback?.imageSrc,
    socials: {
      ...(fallback?.socials || {}),
      ...(member.socials || {}),
    },
    stats: {
      ...(fallback?.stats || DEFAULT_STATS),
      ...(member.stats || {}),
    },
  };
}

async function ensureTeamDataBucket(db: SupabaseClient) {
  const { data: buckets, error } = await db.storage.listBuckets();
  if (error) {
    throw new Error(`Failed to list storage buckets: ${error.message}`);
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === TEAM_DATA_BUCKET);
  if (bucketExists) {
    return;
  }

  const { error: createError } = await db.storage.createBucket(TEAM_DATA_BUCKET, {
    public: false,
    fileSizeLimit: MAX_TEAM_JSON_SIZE,
    allowedMimeTypes: ['application/json'],
  });

  if (createError) {
    throw new Error(`Failed to create team data bucket: ${createError.message}`);
  }
}

export function isMissingTeamTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message = 'message' in error ? String(error.message) : '';
  const code = 'code' in error ? String(error.code) : '';

  return code === 'PGRST205' || message.includes('Could not find the table');
}

export async function readTeamMembersFromStorage(db: SupabaseClient): Promise<TeamMember[] | null> {
  const { data: buckets } = await db.storage.listBuckets();
  const bucketExists = buckets?.some((bucket) => bucket.name === TEAM_DATA_BUCKET);

  if (!bucketExists) {
    return null;
  }

  const { data, error } = await db.storage.from(TEAM_DATA_BUCKET).download(TEAM_DATA_PATH);

  if (error || !data) {
    return null;
  }

  const text = await data.text();

  if (!text) {
    return null;
  }

  const parsed = JSON.parse(text) as StoredTeamPayload | TeamMember[];
  const members = Array.isArray(parsed) ? parsed : parsed.members;

  if (!Array.isArray(members)) {
    return null;
  }

  return members.map(normalizeMember);
}

export async function writeTeamMembersToStorage(
  db: SupabaseClient,
  members: TeamMember[]
): Promise<TeamMember[]> {
  await ensureTeamDataBucket(db);

  const normalized = members.map(normalizeMember);
  const payload: StoredTeamPayload = {
    members: normalized,
    updatedAt: new Date().toISOString(),
  };

  const buffer = Buffer.from(JSON.stringify(payload));

  const { error: uploadError } = await db.storage.from(TEAM_DATA_BUCKET).upload(TEAM_DATA_PATH, buffer, {
    contentType: 'application/json',
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Failed to upload team data: ${uploadError.message}`);
  }

  return normalized;
}

export async function upsertTeamMemberInStorage(
  db: SupabaseClient,
  member: TeamMember
): Promise<TeamMember> {
  const existingMembers = (await readTeamMembersFromStorage(db)) || DEFAULT_TEAM_MEMBERS;
  const normalized = normalizeMember(member);
  const updatedMembers = existingMembers.some(
    (existing) => existing.wallet.toLowerCase() === normalized.wallet.toLowerCase()
  )
    ? existingMembers.map((existing) =>
        existing.wallet.toLowerCase() === normalized.wallet.toLowerCase()
          ? { ...existing, ...normalized }
          : existing
      )
    : [...existingMembers, normalized];

  await writeTeamMembersToStorage(db, updatedMembers);

  return normalized;
}

export async function getTeamMemberFromStorage(db: SupabaseClient, wallet: string) {
  const members = await readTeamMembersFromStorage(db);
  if (!members) {
    return null;
  }

  return members.find((member) => member.wallet.toLowerCase() === wallet.toLowerCase()) || null;
}
