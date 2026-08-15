-- BridgeControl schema
-- RULE: never store secret key material. Metadata only.

create table if not exists public.keys_meta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  local_key_id text not null, -- id from client IndexedDB
  name text not null,
  provider text not null,
  masked text not null,
  usage_count bigint default 0,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  local_key_id text not null,
  provider text not null,
  status int,
  bytes int default 0,
  cost_estimate_cents numeric(12, 4) default 0,
  created_at timestamptz default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member', -- owner | member | auditor
  created_at timestamptz default now()
);

alter table public.keys_meta enable row level security;
alter table public.usage_events enable row level security;
alter table public.team_members enable row level security;

create policy "keys_meta own" on public.keys_meta
  for all using (auth.uid() = user_id);

create policy "usage_events own" on public.usage_events
  for all using (auth.uid() = user_id);

create policy "team_members own" on public.team_members
  for all using (auth.uid() = user_id);

create index if not exists usage_events_user_created
  on public.usage_events (user_id, created_at desc);
