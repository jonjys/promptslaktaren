/**
 * Server Supabase via PostgREST fetch — no extra client dependency.
 * Metadata only. Never store plaintext secrets.
 */

type Json = Record<string, unknown>;

function envUrl(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).replace(/\/$/, "");
}

function envKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  );
}

export function hasSupabase(): boolean {
  return Boolean(envUrl() && envKey());
}

async function sbFetch(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const base = envUrl();
  const key = envKey();
  if (!base || !key) return { ok: false, status: 0, data: null };

  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(init.prefer ? { Prefer: init.prefer } : {}),
  };

  try {
    const res = await fetch(`${base}/rest/v1/${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string>) },
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error("supabase fetch", e);
    return { ok: false, status: 0, data: null };
  }
}

export type KillStatus = "armed" | "killed" | "disarmed";

export async function getKillRule(id = "default") {
  const { ok, data } = await sbFetch(
    `kill_rules?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );
  if (!ok || !Array.isArray(data) || !data[0]) return null;
  return data[0] as {
    id: string;
    budget_cents: number;
    status: KillStatus;
    kill_reason: string | null;
    killed_at: string | null;
  };
}

export async function upsertKillRule(input: {
  id?: string;
  budget_cents?: number;
  status: KillStatus;
  kill_reason?: string | null;
}) {
  if (!hasSupabase()) return { ok: false as const, reason: "no_supabase" };
  const id = input.id || "default";
  const row: Json = {
    id,
    budget_cents: input.budget_cents ?? 5000,
    status: input.status,
    kill_reason: input.kill_reason ?? null,
    killed_at: input.status === "killed" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  const { ok, data, status } = await sbFetch("kill_rules", {
    method: "POST",
    body: JSON.stringify(row),
    prefer: "resolution=merge-duplicates,return=representation",
  });
  await sbFetch("kill_logs", {
    method: "POST",
    body: JSON.stringify({
      org_id: id,
      status: input.status,
      reason: input.kill_reason || input.status,
    }),
    prefer: "return=minimal",
  });
  return ok
    ? { ok: true as const, row: Array.isArray(data) ? data[0] : row }
    : { ok: false as const, reason: `http_${status}` };
}

export async function insertSpendLedger(input: {
  org_id?: string;
  provider: string;
  cost_cents: number;
  fee_cents: number;
  path?: string;
}) {
  if (!hasSupabase()) return null;
  const { ok, data } = await sbFetch("spend_ledger", {
    method: "POST",
    body: JSON.stringify({
      org_id: input.org_id || "default",
      provider: input.provider,
      cost_cents: input.cost_cents,
      fee_cents: input.fee_cents,
      path: input.path || null,
    }),
    prefer: "return=representation",
  });
  if (!ok) return null;
  return Array.isArray(data) ? data[0] : data;
}

export async function insertUsageEvent(input: {
  org_id?: string;
  key_id?: string;
  provider: string;
  estimated_cents: number;
  note?: string;
}) {
  if (!hasSupabase()) return false;
  const { ok } = await sbFetch("usage_events", {
    method: "POST",
    body: JSON.stringify({
      org_id: input.org_id || "default",
      key_id: input.key_id || null,
      provider: input.provider,
      estimated_cents: input.estimated_cents,
      note: input.note || null,
    }),
    prefer: "return=minimal",
  });
  return ok;
}

export async function sumSpendByProvider(orgId = "default") {
  if (!hasSupabase()) return [] as { provider: string; cost_cents: number }[];
  const { ok, data } = await sbFetch(
    `spend_ledger?org_id=eq.${encodeURIComponent(orgId)}&select=provider,cost_cents&limit=2000`
  );
  if (!ok || !Array.isArray(data)) return [];
  const map = new Map<string, number>();
  for (const row of data as { provider: string; cost_cents: number }[]) {
    const p = String(row.provider);
    map.set(p, (map.get(p) || 0) + Number(row.cost_cents || 0));
  }
  return [...map.entries()].map(([provider, cost_cents]) => ({
    provider,
    cost_cents,
  }));
}

export async function logTrapTrigger(honeypot: string, ip: string) {
  if (!hasSupabase()) return;
  await sbFetch(`traps?honeypot_key=eq.${encodeURIComponent(honeypot)}`, {
    method: "PATCH",
    body: JSON.stringify({
      triggered: true,
      triggered_ip: ip,
      triggered_at: new Date().toISOString(),
    }),
    prefer: "return=minimal",
  });
}

export async function insertTrap(honeypot_key: string, provider = "openai") {
  if (!hasSupabase()) return null;
  const { ok, data } = await sbFetch("traps", {
    method: "POST",
    body: JSON.stringify({ honeypot_key, provider, triggered: false }),
    prefer: "return=representation",
  });
  if (!ok) return null;
  return Array.isArray(data) ? data[0] : data;
}

export async function listProxyRoutes() {
  if (!hasSupabase()) return [];
  const { ok, data } = await sbFetch(
    "proxy_routes?active=eq.true&select=provider,target,take_bps"
  );
  if (!ok || !Array.isArray(data)) return [];
  return data as { provider: string; target: string; take_bps: number }[];
}
