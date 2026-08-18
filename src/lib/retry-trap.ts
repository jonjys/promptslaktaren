/**
 * RETRY-TRAP — failed proxy/webhook events queue with trap awareness.
 * Local-first queue + optional Background Sync. Never stores plaintext keys.
 */

export type RetryEvent = {
  id: string;
  provider: string;
  path: string;
  status: number;
  reason: "upstream_5xx" | "timeout" | "trap" | "kill" | "network";
  attempts: number;
  maxAttempts: number;
  trapKey?: string;
  at: number;
  nextAt: number;
};

const KEY = "bc-retry-queue";
const MAX = 50;

function load(): RetryEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as RetryEvent[];
  } catch {
    return [];
  }
}

function save(q: RetryEvent[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(q.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function listRetryQueue(): RetryEvent[] {
  return load().sort((a, b) => b.at - a.at);
}

export function enqueueRetry(partial: Omit<RetryEvent, "id" | "at" | "nextAt" | "attempts"> & { attempts?: number }): RetryEvent {
  const q = load();
  const ev: RetryEvent = {
    id: `rt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    attempts: partial.attempts ?? 0,
    maxAttempts: partial.maxAttempts ?? 5,
    at: Date.now(),
    nextAt: Date.now() + 2_000,
    provider: partial.provider,
    path: partial.path,
    status: partial.status,
    reason: partial.reason,
    trapKey: partial.trapKey,
  };
  q.unshift(ev);
  save(q);
  void registerRetrySync();
  return ev;
}

export function markAttempt(id: string, ok: boolean, status?: number): RetryEvent | null {
  const q = load();
  const i = q.findIndex((e) => e.id === id);
  if (i < 0) return null;
  if (ok) {
    const [done] = q.splice(i, 1);
    save(q);
    return { ...done, attempts: done.attempts + 1, status: status ?? 200 };
  }
  q[i] = {
    ...q[i],
    attempts: q[i].attempts + 1,
    status: status ?? q[i].status,
    nextAt: Date.now() + Math.min(60_000, 2_000 * 2 ** q[i].attempts),
  };
  if (q[i].attempts >= q[i].maxAttempts) {
    q[i].nextAt = Date.now() + 3600_000;
  }
  save(q);
  return q[i];
}

export function clearRetry(id?: string) {
  if (!id) {
    save([]);
    return;
  }
  save(load().filter((e) => e.id !== id));
}

export function pendingCount(): number {
  return load().filter((e) => e.attempts < e.maxAttempts).length;
}

async function registerRetrySync() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    const sync = (reg as ServiceWorkerRegistration & { sync?: { register: (t: string) => Promise<void> } })?.sync;
    await sync?.register?.("bc-retry-trap");
  } catch {
    /* optional */
  }
}

/** Fire one due retry against /api/proxy or webhook */
export async function processOneRetry(): Promise<RetryEvent | null> {
  const due = load()
    .filter((e) => e.attempts < e.maxAttempts && e.nextAt <= Date.now())
    .sort((a, b) => a.nextAt - b.nextAt)[0];
  if (!due) return null;

  if (due.reason === "trap") {
    return markAttempt(due.id, false, 451);
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-bc-retry": "1",
      "x-bc-retry-id": due.id,
    };
    if (due.reason === "kill") headers["x-bc-killed"] = "0";
    const res = await fetch(due.path || `/api/proxy/${due.provider}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ retry: true, id: due.id }),
    });
    if (res.status === 451) {
      return markAttempt(due.id, false, 451);
    }
    if (res.ok || res.status === 401) {
      return markAttempt(due.id, true, res.status);
    }
    return markAttempt(due.id, false, res.status);
  } catch {
    return markAttempt(due.id, false, 0);
  }
}

export async function processDueRetries(limit = 5): Promise<number> {
  let n = 0;
  for (let i = 0; i < limit; i++) {
    const r = await processOneRetry();
    if (!r) break;
    n += 1;
  }
  return n;
}
