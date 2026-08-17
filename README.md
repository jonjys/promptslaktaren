# BridgeControl — BLACK EDITION

**Keys never leave. Spend never surprises.**

Secret-slussen som tar **3% av all API-trafik**.
Inte en app. Bara röret.

## Layers

| Layer | What |
|-------|------|
| **Weld** | File System Access + AES-GCM on-device. Klartext aldrig i DOM. |
| **Lock** | `navigator.locks` exclusive — en process åt gången. |
| **Kill 2.0** | Budgetgraf · $10k spike · Slack alert · blockar proxy. |
| **Proxy** | `/api/proxy/[provider]` — gateway, spend_ledger, 3% take. |
| **Vacuum** | Sug upp .env / clipboard / mock surfaces på ~11s. |
| **Trap** | Honeypot keys. Anrop → Trap Triggered + IP. |

## Hard rules

1. Plaintext keys stannar i browser under exclusive lock (Weld/Lock path).
2. Proxy path meterar trafik och kan blockas av Kill Switch.
3. Metadata only till server (masked, spend, kill status).

## Stack

Next.js App Router · TypeScript · Tailwind · IndexedDB · WebCrypto · Web Locks · Service Worker · Vercel PWA

## Try

1. Open production URL in **Chrome/Edge**
2. Weld a `.env` (paste or file)
3. Prove lock
4. Kill Switch 2.0 → **Simulate $10k spike** → KILLED
5. Vacuum · Drop Trap

## Pricing

**BridgeControl Black — $299/mo** + **3%** of proxied API spend.

## Show HN

> We built Datadog + 1Password + ngrok + Stripe for localhost — keys never leave
