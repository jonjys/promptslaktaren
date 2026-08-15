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
        // Exclusive lock per key — only one concurrent use
        await navigator.locks.request(
          `bc-key-${keyId}`,
          { mode: "exclusive" },
          async () => {
            const value = await unlockKeyValue(keyId);
            const authorization = value.startsWith("Bearer ")
              ? value
              : `Bearer ${value}`;
            // Stripe expects Bearer for secret keys in some flows;
            // for Stripe secret key Basic auth is also common — keep Bearer default.
            const sw = navigator.serviceWorker.controller;
            sw?.postMessage({
              type: "PROXY_AUTH",
              requestId,
              authorization,
            });
            // Key plaintext only lived in this closure
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

/** Call an upstream provider through the local SW proxy. Key never hits our server. */
export function proxyUrl(provider: string, keyId: string, path: string): string {
  const clean = path.replace(/^\//, "");
  return `/api/proxy/${provider}/${keyId}/${clean}`;
}
