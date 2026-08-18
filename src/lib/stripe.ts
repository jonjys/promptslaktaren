/**
 * Stripe metered helpers — local ledger + server header contract.
 * Live STRIPE_SECRET_KEY is set in Vercel env by operator (not in repo).
 */

export const TAKE_BPS = 300; // 3%

export function feeCents(costCents: number): number {
  return Math.round((costCents * TAKE_BPS) / 10_000);
}

export type MeterRecord = {
  provider: string;
  costCents: number;
  feeCents: number;
  takeBps: number;
  at: number;
};

const KEY = "bc-stripe-meter";

export function recordMeterLocal(provider: string, costCents: number): MeterRecord {
  const rec: MeterRecord = {
    provider,
    costCents,
    feeCents: feeCents(costCents),
    takeBps: TAKE_BPS,
    at: Date.now(),
  };
  if (typeof window === "undefined") return rec;
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) || "[]") as MeterRecord[];
    prev.unshift(rec);
    localStorage.setItem(KEY, JSON.stringify(prev.slice(0, 200)));
  } catch {
    /* ignore */
  }
  return rec;
}

export function listMeterLocal(): MeterRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as MeterRecord[];
  } catch {
    return [];
  }
}

export function meterHeaders(costCents: number): HeadersInit {
  const fee = feeCents(costCents);
  return {
    "x-bc-cost-cents": String(costCents),
    "x-bc-fee-cents": String(fee),
    "x-bc-take-bps": String(TAKE_BPS),
  };
}

export type UsageRecordPayload = {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: "increment" | "set";
};

export function buildUsageRecordBody(p: UsageRecordPayload): Record<string, string> {
  return {
    quantity: String(p.quantity),
    timestamp: String(p.timestamp ?? Math.floor(Date.now() / 1000)),
    action: p.action || "increment",
  };
}

export function billingPortalHint(): string {
  return "/api/billing/portal";
}
