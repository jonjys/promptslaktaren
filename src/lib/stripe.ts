/**
 * BridgeControl Stripe metering helpers (demo / local-first).
 * Real Stripe metered billing wires via STRIPE_SECRET_KEY on Edge later.
 */

export const TAKE_BPS = 300; // 3.00%

export function feeCents(costCents: number, takeBps = TAKE_BPS): number {
  return Math.max(0.01, (costCents * takeBps) / 10000);
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

/** Server-side response helper for proxy routes */
export function meterHeaders(costCents: number): HeadersInit {
  const fee = feeCents(costCents);
  return {
    "x-bc-cost-cents": String(costCents),
    "x-bc-fee-cents": String(fee),
    "x-bc-take-bps": String(TAKE_BPS),
  };
}
