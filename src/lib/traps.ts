/**
 * Trap / honeypot keys — local + optional API register
 */

export type TrapRecord = {
  id: string;
  honeypotKey: string;
  provider: string;
  triggered: boolean;
  triggeredIp?: string;
  createdAt: number;
};

const KEY = "bc-traps";

function load(): TrapRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as TrapRecord[];
  } catch {
    return [];
  }
}

function save(rows: TrapRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 50)));
}

export function listTraps(): TrapRecord[] {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

export function dropTrap(provider = "openai"): TrapRecord {
  const id = crypto.randomUUID().slice(0, 8);
  const honeypotKey = `sk_test_trap_${id}_${Math.random().toString(36).slice(2, 10)}`;
  const rec: TrapRecord = {
    id,
    honeypotKey,
    provider,
    triggered: false,
    createdAt: Date.now(),
  };
  const all = load();
  all.unshift(rec);
  save(all);
  return rec;
}

export function markTrapTriggered(honeypotKey: string, ip = "local"): TrapRecord | null {
  const all = load();
  const idx = all.findIndex((t) => t.honeypotKey === honeypotKey);
  if (idx < 0) return null;
  all[idx] = {
    ...all[idx],
    triggered: true,
    triggeredIp: ip,
  };
  save(all);
  return all[idx];
}
