"use client";

import { unlockKeyValue, bumpUsage } from "./secure-store";

let swRegistered = false;

export async function registerBridgeSW(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (swRegistered) return;
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  swRegistered = true;

  navigator.serviceWorker.addEventListener("message", async (event) => {
    const data = event.data || {};
    if (data.type === "NEED_AUTH") {
      const { requestId, keyId } = data;
      try {
        await navigator.locks.request(
          `bc-key-${keyId}`,
          { mode: "exclusive" },
          async () => {
            const value = await unlockKeyValue(keyId);
            // Stripe secret keys use Basic base64(sk:)
            let authorization: string;
            if (value.startsWith("sk_") && !value.includes(" ")) {
              authorization = `Bearer ${value}`;
            } else if (value.startsWith("Bearer ")) {
              authorization = value;
            } else {
              authorization = `Bearer ${value}`;
            }
            navigator.serviceWorker.controller?.postMessage({
              type: "PROXY_AUTH",
              requestId,
              authorization,
            });
          }
        );
      } catch {
        navigator.serviceWorker.controller?.postMessage({
          type: "PROXY_AUTH",
          requestId,
          authorization: null,
        });
      }
    }
    if (data.type === "USAGE" && data.keyId) {
      await bumpUsage(data.keyId);
    }
  });

  void reg;
}

export function proxyUrl(provider: string, keyId: string, path: string): string {
  const clean = path.replace(/^\//, "");
  return `/api/proxy/${provider}/${keyId}/${clean}`;
}

/**
 * Prove zero-trust unlock path without upstream CORS.
 * Holds exclusive Web Lock, decrypts, discards plaintext, bumps usage.
 */
export async function proveLock(keyId: string): Promise<{
  ok: boolean;
  ms: number;
  len: number;
}> {
  const t0 = performance.now();
  let len = 0;
  await navigator.locks.request(
    `bc-key-${keyId}`,
    { mode: "exclusive" },
    async () => {
      const value = await unlockKeyValue(keyId);
      len = value.length;
      // intentional: value goes out of scope — never logged, never sent
    }
  );
  await bumpUsage(keyId);
  return { ok: true, ms: Math.round(performance.now() - t0), len };
}
