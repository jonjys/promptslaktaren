/**
 * CostRadar — local-first spend meter + kill switch.
 * No secrets here. Only counts, budgets, kill state.
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
};

export type RadarConfig = {
  id: "default";
  monthlyBudgetCents: number;
  killed: boolean;
  killedAt: number | null;
  killReason: string | null;
};

const DEFAULT_CFG: RadarConfig = {
  id: "default",
  monthlyBudgetCents: 5000, // $50 default demo budget
  killed: false,
  killedAt: null,
  killReason: null,
};

/** Rough cost estimates per call (demo metering) */
export const COST_CENTS: Record<string, number> = {
  stripe: 0.1,
  openai: 2,
  anthropic: 3,
  supabase: 0.05,
  custom: 0.5,
};

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
  provider: string
): Promise<{ event: UsageEvent; autoKilled: boolean }> {
  const cents = COST_CENTS[provider] ?? COST_CENTS.custom;
  const event: UsageEvent = {
    id: crypto.randomUUID(),
    keyId,
    provider,
    at: Date.now(),
    estimatedCents: cents,
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
