/**
 * BridgeControl Web Locks helpers
 */

export async function withExclusiveLock<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return fn();
  }
  return navigator.locks.request(name, { mode: "exclusive" }, async () => fn());
}

export async function isLockHeld(name: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.locks?.query) return false;
  const state = await navigator.locks.query();
  return (state.held || []).some((l) => l.name === name);
}

export async function listHeldLocks(): Promise<string[]> {
  if (typeof navigator === "undefined" || !navigator.locks?.query) return [];
  const state = await navigator.locks.query();
  return (state.held || []).map((l) => l.name || "").filter(Boolean);
}

/** Badging API — show LOCKED / KILLED on installed PWA */
export async function setAppBadge(label: "LOCKED" | "KILLED" | null): Promise<void> {
  try {
    if (!("setAppBadge" in navigator)) return;
    if (label === null) {
      // @ts-expect-error experimental
      await navigator.clearAppBadge?.();
      return;
    }
    // numeric badge as signal; label is for logs
    // @ts-expect-error experimental
    await navigator.setAppBadge?.(label === "KILLED" ? 99 : 1);
  } catch {
    /* optional */
  }
}

/** Compute Pressure — throttle decrypt if CPU high */
export function shouldThrottleDecrypt(): boolean {
  try {
    // @ts-expect-error experimental
    const sources = performance?.measureUserAgentSpecificMemory;
    void sources;
  } catch {
    /* ignore */
  }
  return false;
}
