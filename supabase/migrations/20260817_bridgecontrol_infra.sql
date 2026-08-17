-- BridgeControl infrastructure tables (metadata only — no plaintext secrets)

create table if not exists public.keys_meta (
  id uuid primary key default gen_random_uuid(),
  org_id text,
  provider text not null,
  name text not null,
  masked text not null,
  risk_score int default 0,
  created_at timestamptz default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id text,
  key_id text,
  provider text,
  estimated_cents numeric default 0,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.kill_rules (
  id text primary key default 'default',
  org_id text,
  budget_cents int not null default 5000,
  status text not null default 'armed' check (status in ('armed','killed','disarmed')),
  kill_reason text,
  killed_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.traps (
  id uuid primary key default gen_random_uuid(),
  honeypot_key text not null unique,
  provider text default 'openai',
  triggered boolean default false,
  triggered_ip text,
  triggered_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.proxy_routes (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  target text not null,
  active boolean default true,
  take_bps int default 300 -- 3.00%
);

create table if not exists public.spend_ledger (
  id uuid primary key default gen_random_uuid(),
  org_id text,
  provider text not null,
  cost_cents numeric not null,
  fee_cents numeric not null,
  path text,
  created_at timestamptz default now()
);

insert into public.proxy_routes (provider, target, active, take_bps) values
  ('openai', 'https://api.openai.com', true, 300),
  ('stripe', 'https://api.stripe.com', true, 300),
  ('anthropic', 'https://api.anthropic.com', true, 300),
  ('supabase', 'https://*.supabase.co', true, 300)
on conflict (provider) do nothing;
