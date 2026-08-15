/* BridgeControl Service Worker
 * Intercepts /api/proxy/* and coordinates with the page over postMessage.
 * The actual secret is NEVER stored in the SW. Page holds Web Lock,
 * decrypts for ~50ms, sends Authorization header to SW for one hop.
 */

const CACHE = "bc-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** Pending proxy requests waiting for key material from a client */
const pending = new Map();

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "PROXY_AUTH" && data.requestId && pending.has(data.requestId)) {
    const { resolve } = pending.get(data.requestId);
    pending.delete(data.requestId);
    resolve(data.authorization || null);
  }
});

function askClientForAuth(requestId, keyId, provider) {
  return new Promise(async (resolve) => {
    pending.set(requestId, { resolve });
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({
        type: "NEED_AUTH",
        requestId,
        keyId,
        provider,
      });
    }
    // Timeout: never hang forever
    setTimeout(() => {
      if (pending.has(requestId)) {
        pending.delete(requestId);
        resolve(null);
      }
    }, 8000);
  });
}

const PROVIDER_HOST = {
  stripe: "https://api.stripe.com",
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
};

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith("/api/proxy/")) return;

  event.respondWith(handleProxy(event.request, url));
});

async function handleProxy(request, url) {
  // /api/proxy/:provider/:keyId/...path
  const parts = url.pathname.split("/").filter(Boolean);
  // ["api", "proxy", provider, keyId, ...rest]
  const provider = parts[2];
  const keyId = parts[3];
  const rest = parts.slice(4).join("/");
  const base = PROVIDER_HOST[provider];
  if (!base || !keyId) {
    return new Response(JSON.stringify({ ok: false, error: "Unknown provider or key" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const requestId = crypto.randomUUID();
  const authorization = await askClientForAuth(requestId, keyId, provider);
  if (!authorization) {
    return new Response(JSON.stringify({ ok: false, error: "Key unlock failed or timed out" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const target = `${base}/${rest}${url.search}`;
  const headers = new Headers(request.headers);
  headers.set("Authorization", authorization);
  headers.delete("Host");

  const init = {
    method: request.method,
    headers,
    redirect: "follow",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    // Notify client of usage (metadata only)
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) {
      client.postMessage({
        type: "USAGE",
        keyId,
        provider,
        status: upstream.status,
        bytes: Number(upstream.headers.get("content-length") || 0),
      });
    }
    return upstream;
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
