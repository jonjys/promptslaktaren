# BridgeControl

**Your API keys never leave your machine.**

Zero-trust local-first API gateway for developers.  
File System Access + WebCrypto + IndexedDB + Service Worker + Web Locks.

## What it does

1. **Import .env** — reads from disk (or paste). Encrypts with AES-GCM. Stores only on this device.
2. **Locked proxy** — Service Worker + Web Locks. One process per key. Plaintext lives ~50ms in memory.
3. **Usage meter** — client bumps local counters; optional metadata sync to Supabase (never the secret).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Browser: File System Access, WebCrypto, IndexedDB, Service Worker, Web Locks
- Supabase: auth + `keys_meta` / `usage_events` metadata only
- Stripe: metered billing (later)

## Hard rules

- **Never** send key values to the server.
- UI language: Secure / Locked / Zero-trust — not "vault/ghost/hide".
- Secrets only in device memory under exclusive Web Lock.

## Local

```bash
npm install
npm run dev
```

Open Chrome/Edge → Import .env.

## Security notes

| Claim | Reality |
|-------|---------|
| OS keychain | WebCrypto non-extractable keys + IndexedDB. Full OS keychain needs native helper (phase 2). |
| Proxy any API | SW same-origin intercept + client unlock. CORS to upstream still applies from browser context. |
| YubiKey / WebUSB | Enterprise tier — not in Day 1 MVP. |

## Show HN angle

> We stopped API key leaks by never letting the key leave the machine (Web Locks + File System Access)

---

Formerly PromptSlaktaren. That product is dead. This is BridgeControl.
