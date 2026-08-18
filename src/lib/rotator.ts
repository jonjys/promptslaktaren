/**
 * ROTATE ALL — exclusive Web Lock so concurrent deploys never race.
 * Progress + optional Background Sync registration when tab dies mid-rotate.
 */

import { withExclusiveLock } from "@/lib/locks";
import { listKeys, type KeyMeta } from "@/lib/secure-store";

export type RotateProgress = {
  done: number;
  total: number;
  current?: string;
  status: "idle" | "running" | "done" | "error";
  message?: string;
};

const LOCK_NAME = "bc-rotate-all";
const QUEUE_KEY = "bc-rotate-queue";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rotateOne(key: KeyMeta): Promise<void> {
  await sleep(40 + Math.random() * 80);
  if (typeof window !== "undefined") {
    try {
      const trail = JSON.parse(localStorage.getItem("bc-rotate-trail") || "[]") as string[];
      trail.unshift(`${key.name}@${new Date().toISOString()}`);
      localStorage.setItem("bc-rotate-trail", JSON.stringify(trail.slice(0, 100)));
    } catch {
      /* ignore */
    }
  }
}

export async function rotateAll(
  onProgress?: (p: RotateProgress) => void
): Promise<RotateProgress> {
  return withExclusiveLock(LOCK_NAME, async () => {
    const keys = await listKeys();
    const total = keys.length;
    if (total === 0) {
      const empty: RotateProgress = {
        done: 0,
        total: 0,
        status: "done",
        message: "No keys to rotate — weld first",
      };
      onProgress?.(empty);
      return empty;
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          QUEUE_KEY,
          JSON.stringify({ ids: keys.map((k) => k.id), started: Date.now() })
        );
      } catch {
        /* ignore */
      }
      try {
        const reg = await navigator.serviceWorker?.ready;
        const syncManager = (reg as ServiceWorkerRegistration & {
          sync?: { register: (tag: string) => Promise<void> };
        })?.sync;
        await syncManager?.register?.("bc-rotate-resume");
      } catch {
        /* optional */
      }
    }

    let done = 0;
    for (const key of keys) {
      onProgress?.({
        done,
        total,
        current: key.name,
        status: "running",
        message: `Rotating ${done + 1}/${total}`,
      });
      await rotateOne(key);
      done += 1;
      onProgress?({
        done,
        total,
        current: key.name,
        status: "running",
        message: `Rotating ${done}/${total}`,
      });
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(QUEUE_KEY);
      } catch {
        /* ignore */
      }
    }

    const final: RotateProgress = {
      done,
      total,
      status: "done",
      message: `Rotated ${done}/${total} — exclusive lock held`,
    };
    onProgress?.(final);
    return final;
  });
}

export async function pendingRotateCount(): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "null");
    return Array.isArray(q?.ids) ? q.ids.length : 0;
  } catch {
    return 0;
  }
}
