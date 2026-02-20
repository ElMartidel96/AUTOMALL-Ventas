-- Team members configuration table for editable team cards
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  name text not null,
  role text not null,
  description text not null,
  image_url text,
  socials jsonb default '{}'::jsonb,
  stats jsonb default '{}'::jsonb,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.team_members is 'Editable team member cards for landing/docs.';
