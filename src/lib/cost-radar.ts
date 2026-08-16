/**
 * CostRadar — local-first spend meter + kill switch 2.0
 * No secrets on server. Counts, budgets, kill state, optional Slack webhook URL in localStorage only.
 */

const DB = "bridgecontrol";
const STORE = "usage_events";
const CFG = "radar_cfg";

export type UsageEvent = {
  id: string;
  keyId: string;
  provider: string;
  at: number;
  estimatedCents: number;
  note?: string;
};

export type RadarConfig = {
  id: "default";
  monthlyBudgetCents: number;
  killed: boolean;
  killedAt: number | null;
  killReason: string | null;
};

export type CostPoint = {
  at: number;
  cumulativeCents: number;
  label: string;
};

const DEFAULT_CFG: RadarConfig = {
  id: "default",
  monthlyBudgetCents: 5000,
  killed: false,
  killedAt: null,
  killReason: null,
};

export const COST_CENTS: Record<string, number> = {
  stripe: 0.1,
  openai: 2,
  anthropic: 3,
  supabase: 0.05,
  custom: 0.5,
  spike: 10000, // $100 per synthetic spike unit — simulateSpike multiplies
};

const SLACK_KEY = "bc-slack-webhook";

export function getSlackWebhook(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SLACK_KEY) || "";
}

export function setSlackWebhook(url: string): void {
  if (typeof window === "undefined") return;
  if (!url) localStorage.removeItem(SLACK_KEY);
  else localStorage.setItem(SLACK_KEY, url.trim());
}

async function fireSlackAlert(text: string): Promise<void> {
  const url = getSlackWebhook();
  if (!url || !url.startsWith("https://hooks.slack.com/")) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 BridgeControl Kill Switch\n${text}`,
      }),
    });
  } catch {
    // webhook optional — never block kill path
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("at", "at");
      }
      if (!db.objectStoreNames.contains(CFG)) {
        db.createObjectStore(CFG, { keyPath: "id" });
      }
    };
  });
}

export async function getRadarConfig(): Promise<RadarConfig> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CFG, "readonly");
    const req = tx.objectStore(CFG).get("default");
    req.onsuccess = () => resolve((req.result as RadarConfig) || DEFAULT_CFG);
    req.onerror = () => reject(req.error);
  });
}

export async function setMonthlyBudget(cents: number): Promise<void> {
  const cfg = await getRadarConfig();
  cfg.monthlyBudgetCents = Math.max(0, cents);
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CFG, "readwrite");
    tx.objectStore(CFG).put(cfg);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function armKillSwitch(reason: string): Promise<void> {
  const cfg = await getRadarConfig();
  cfg.killed = true;
  cfg.killedAt = Date.now();
  cfg.killReason = reason;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CFG, "readwrite");
    tx.objectStore(CFG).put(cfg);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  void fireSlackAlert(reason);
}

export async function disarmKillSwitch(): Promise<void> {
  const cfg = await getRadarConfig();
  cfg.killed = false;
  cfg.killedAt = null;
  cfg.killReason = null;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(CFG, "readwrite");
    tx.objectStore(CFG).put(cfg);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function isKilled(): Promise<boolean> {
  const cfg = await getRadarConfig();
  return cfg.killed;
}

export async function recordUsage(
  keyId: string,
  provider: string,
  overrideCents?: number,
  note?: string
): Promise<{ event: UsageEvent; autoKilled: boolean }> {
  const cents =
    overrideCents ?? COST_CENTS[provider] ?? COST_CENTS.custom;
  const event: UsageEvent = {
    id: crypto.randomUUID(),
    keyId,
    provider,
    at: Date.now(),
    estimatedCents: cents,
    note,
  };
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(event);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  const monthSpend = await monthSpendCents();
  const cfg = await getRadarConfig();
  let autoKilled = false;
  if (!cfg.killed && monthSpend >= cfg.monthlyBudgetCents) {
    await armKillSwitch(
      `Budget $${(cfg.monthlyBudgetCents / 100).toFixed(0)} hit (est. $${(monthSpend / 100).toFixed(2)})`
    );
    autoKilled = true;
  }
  return { event, autoKilled };
}

/** Simulate a $10k API bill spike — forces kill if budget is lower */
export async function simulateTenKSpike(): Promise<{
  spendCents: number;
  autoKilled: boolean;
}> {
  const { autoKilled } = await recordUsage(
    "spike-sim",
    "spike",
    1_000_000, // $10,000.00
    "$10k spike simulation"
  );
  const spendCents = await monthSpendCents();
  return { spendCents, autoKilled };
}

export async function listUsage(limit = 50): Promise<UsageEvent[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as UsageEvent[]).sort((a, b) => b.at - a.at);
      resolve(rows.slice(0, limit));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function monthSpendCents(): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  const events = await listUsage(5000);
  return events
    .filter((e) => e.at >= t0)
    .reduce((s, e) => s + e.estimatedCents, 0);
}

/** Cumulative spend series for chart (oldest → newest) */
export async function getCostSeries(limit = 40): Promise<CostPoint[]> {
  const events = await listUsage(500);
  const chrono = [...events].sort((a, b) => a.at - b.at).slice(-limit);
  let cum = 0;
  return chrono.map((e) => {
    cum += e.estimatedCents;
    return {
      at: e.at,
      cumulativeCents: cum,
      label: new Date(e.at).toLocaleTimeString(),
    };
  });
}
