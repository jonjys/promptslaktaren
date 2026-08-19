-- security: enable RLS on bridgecontrol production tables
--
-- NOT YET APPLIED — written but not executed. This session has no live
-- Supabase MCP connection (disconnected mid-turn), so nothing here has
-- been run against azcbgxbkbxdmpgschhau. Run it via the SQL Editor, or
-- hand it to a session that has Supabase access.
--
-- Verified before writing this: keys_meta, usage_events, kill_rules,
-- traps, proxy_routes, spend_ledger are read/written exclusively by
-- server-side code (src/lib/supabase-server.ts) using
-- SUPABASE_SERVICE_ROLE_KEY — no client-side/browser code touches these
-- tables directly. Locking them to service_role-only matches how the app
-- already behaves; it should not break anything.
--
-- IMPORTANT — repo has THREE different schema files for these same table
-- names, and they disagree:
--   supabase/migration.sql (undated, oldest) defines keys_meta and
--   usage_events with user_id uuid + per-user RLS already enabled
--   ("keys_meta own", "usage_events own": auth.uid() = user_id).
--   supabase/migrations/20260817_bridgecontrol_infra.sql redefines both
--   with org_id text instead, no RLS.
-- Postgres combines multiple permissive policies on the same command
-- with OR. If the old per-user policies are still live in production,
-- adding "service_role_all" alongside them WITHOUT dropping the old ones
-- means both apply — anyone whose auth.uid() happens to match a row's
-- user_id would still get access, not just service_role. That would
-- silently fail to achieve what this migration is for. So: drop the old
-- policy names by name first (harmless no-op if they were never applied
-- in the first place), and CHECK pg_policies before/after:
--   select schemaname, tablename, policyname, roles, cmd
--   from pg_policies where schemaname = 'public'
--   and tablename in ('kill_rules','traps','proxy_routes','spend_ledger',
--                      'kill_logs','keys_meta','usage_events','bridge_tolls');

alter table public.kill_rules enable row level security;
alter table public.traps enable row level security;
alter table public.proxy_routes enable row level security;
alter table public.spend_ledger enable row level security;
alter table public.kill_logs enable row level security;
alter table public.keys_meta enable row level security;
alter table public.usage_events enable row level security;
alter table public.bridge_tolls enable row level security;

-- Drop conflicting policies from the older per-user schema, if present.
drop policy if exists "keys_meta own" on public.keys_meta;
drop policy if exists "usage_events own" on public.usage_events;

drop policy if exists "service_role_all" on public.kill_rules;
create policy "service_role_all" on public.kill_rules for all using (auth.role() = 'service_role');

drop policy if exists "service_role_all" on public.traps;
create policy "service_role_all" on public.traps for all using (auth.role() = 'service_role');

drop policy if exists "service_role_all" on public.proxy_routes;
create policy "service_role_all" on public.proxy_routes for all using (auth.role() = 'service_role');

drop policy if exists "service_role_all" on public.spend_ledger;
create policy "service_role_all" on public.spend_ledger for all using (auth.role() = 'service_role');

drop policy if exists "service_role_all" on public.kill_logs;
create policy "service_role_all" on public.kill_logs for all using (auth.role() = 'service_role');

drop policy if exists "service_role_all" on public.keys_meta;
create policy "service_role_all" on public.keys_meta for all using (auth.role() = 'service_role');

drop policy if exists "service_role_all" on public.usage_events;
create policy "service_role_all" on public.usage_events for all using (auth.role() = 'service_role');

-- bridge_tolls: public read (rates need to be visible to compute client-
-- side estimates), service_role-only write.
drop policy if exists "public_read_tolls" on public.bridge_tolls;
create policy "public_read_tolls" on public.bridge_tolls for select using (true);

drop policy if exists "service_write_tolls" on public.bridge_tolls;
create policy "service_write_tolls" on public.bridge_tolls for all using (auth.role() = 'service_role');
