"use client";

import { unlockKeyValue, bumpUsage, listKeys } from "./secure-store";
import { isKilled, recordUsage } from "./cost-radar";

let swRegistered = false;

export async function registerBridgeSW(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (swRegistered) return;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    swRegistered = true;

    navigator.serviceWorker.addEventListener("message", async (event) => {
      const data = event.data || {};
      if (data.type === "NEED_AUTH") {
        const { requestId, keyId } = data;
        try {
          if (await isKilled()) {
            navigator.serviceWorker.controller?.postMessage({
              type: "PROXY_AUTH",
              requestId,
              authorization: null,
            });
            return;
          }
          await navigator.locks.request(
            `bc-key-${keyId}`,
            { mode: "exclusive" },
            async () => {
              const value = await unlockKeyValue(keyId);
              const authorization = value.startsWith("Bearer ")
                ? value
                : `Bearer ${value}`;
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
        const keys = await listKeys();
        const k = keys.find((x) => x.id === data.keyId);
        await recordUsage(data.keyId, k?.provider || "custom");
      }
    });
    void reg;
  } catch {
    // SW optional in dev
  }
}

export function proxyUrl(provider: string, keyId: string, path: string): string {
  const clean = path.replace(/^\//, "");
  return `/api/proxy/${provider}/${keyId}/${clean}`;
}

export async function proveLock(keyId: string): Promise<{
  ok: boolean;
  ms: number;
  len: number;
  autoKilled: boolean;
}> {
  if (await isKilled()) {
    throw new Error("KILL SWITCH ARMED — all key use blocked on this device");
  }
  const t0 = performance.now();
  let len = 0;
  let provider = "custom";
  await navigator.locks.request(
    `bc-key-${keyId}`,
    { mode: "exclusive" },
    async () => {
      const value = await unlockKeyValue(keyId);
      len = value.length;
    }
  );
  await bumpUsage(keyId);
  const keys = await listKeys();
  provider = keys.find((k) => k.id === keyId)?.provider || "custom";
  const { autoKilled } = await recordUsage(keyId, provider);
  return {
    ok: true,
    ms: Math.round(performance.now() - t0),
    len,
    autoKilled,
  };
}
