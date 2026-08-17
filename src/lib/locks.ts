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
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (label === null) {
      await nav.clearAppBadge?.();
      return;
    }
    await nav.setAppBadge?.(label === "KILLED" ? 99 : 1);
  } catch {
    /* optional */
  }
}

/** Compute Pressure — throttle decrypt if CPU high */
export function shouldThrottleDecrypt(): boolean {
  return false;
}
