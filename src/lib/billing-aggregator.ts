/**
 * Billing Aggregator — normalize Stripe + OpenAI + AWS + Vercel spend
 * into one live number. 3% take on volume (demo uses local estimates).
 */

export type ProviderId = "stripe" | "openai" | "aws" | "vercel";

export type ProviderSpend = {
  id: ProviderId;
  label: string;
  cents: number;
  source: "meter" | "estimate" | "local";
};

export type AggregatedBill = {
  providers: ProviderSpend[];
  totalCents: number;
  feeCents: number;
  takeBps: number;
  at: number;
};

const TAKE_BPS = 300; // 3%
const KEY = "bc-billing-agg";

const DEFAULTS: ProviderSpend[] = [
  { id: "stripe", label: "Stripe", cents: 0, source: "local" },
  { id: "openai", label: "OpenAI", cents: 0, source: "local" },
  { id: "aws", label: "AWS", cents: 0, source: "estimate" },
  { id: "vercel", label: "Vercel", cents: 0, source: "estimate" },
];

function feeFrom(totalCents: number): number {
  return Math.round((totalCents * TAKE_BPS) / 10_000);
}

export function getAggregatedBill(): AggregatedBill {
  if (typeof window === "undefined") {
    return {
      providers: DEFAULTS,
      totalCents: 0,
      feeCents: 0,
      takeBps: TAKE_BPS,
      at: Date.now(),
    };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AggregatedBill;
      if (parsed?.providers?.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  const providers: ProviderSpend[] = [
    { id: "stripe", label: "Stripe", cents: 420, source: "estimate" },
    { id: "openai", label: "OpenAI", cents: 1850, source: "meter" },
    { id: "aws", label: "AWS", cents: 960, source: "estimate" },
    { id: "vercel", label: "Vercel", cents: 310, source: "estimate" },
  ];
  const totalCents = providers.reduce((s, p) => s + p.cents, 0);
  const bill: AggregatedBill = {
    providers,
    totalCents,
    feeCents: feeFrom(totalCents),
    takeBps: TAKE_BPS,
    at: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(bill));
  } catch {
    /* ignore */
  }
  return bill;
}

export function setProviderSpend(id: ProviderId, cents: number): AggregatedBill {
  const cur = getAggregatedBill();
  const providers = cur.providers.map((p) =>
    p.id === id ? { ...p, cents: Math.max(0, Math.round(cents)), source: "local" as const } : p
  );
  const totalCents = providers.reduce((s, p) => s + p.cents, 0);
  const bill: AggregatedBill = {
    providers,
    totalCents,
    feeCents: feeFrom(totalCents),
    takeBps: TAKE_BPS,
    at: Date.now(),
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(bill));
    } catch {
      /* ignore */
    }
  }
  return bill;
}

export function addProviderSpend(id: ProviderId, deltaCents: number): AggregatedBill {
  const cur = getAggregatedBill();
  const p = cur.providers.find((x) => x.id === id);
  return setProviderSpend(id, (p?.cents || 0) + deltaCents);
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export { TAKE_BPS };

export async function hydrateFromApi(): Promise<AggregatedBill | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/spend");
    if (!res.ok) return null;
    const json = (await res.json()) as {
      totalCents?: number;
      feeCents?: number;
      providers?: { provider: string; cost_cents: number }[];
      source?: string;
    };
    if (!json.providers || json.source === "empty") return null;
    const map: Record<string, ProviderId> = {
      stripe: "stripe",
      openai: "openai",
      aws: "aws",
      vercel: "vercel",
    };
    const base = getAggregatedBill();
    const providers = base.providers.map((p) => {
      const row = json.providers!.find((r) => map[r.provider] === p.id || r.provider === p.id);
      return row
        ? { ...p, cents: Math.round(Number(row.cost_cents)), source: "meter" as const }
        : p;
    });
    const totalCents = providers.reduce((s, x) => s + x.cents, 0);
    const bill: AggregatedBill = {
      providers,
      totalCents: totalCents || Number(json.totalCents) || 0,
      feeCents: Math.round((totalCents * TAKE_BPS) / 10_000),
      takeBps: TAKE_BPS,
      at: Date.now(),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(bill));
    } catch {
      /* ignore */
    }
    return bill;
  } catch {
    return null;
  }
}
