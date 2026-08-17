# BridgeControl — BLACK EDITION

**Keys never leave. Spend never surprises.**

Secret-slussen som tar **3% av all API-trafik**.
Inte en app. Bara röret.

## Layers

| Layer | What |
|-------|------|
| **Weld** | File System Access + AES-GCM on-device. Klartext aldrig i DOM. |
| **Lock** | `navigator.locks` exclusive — en process åt gången. |
| **Kill 2.0** | Budgetgraf · $10k spike · Slack · `/api/kill`. |
| **Proxy** | `/api/proxy/[provider]` + middleware 402/451 · 3% take. |
| **Vacuum** | Sug upp .env / clipboard / mock surfaces. |
| **Trap** | Honeypot `sk_test_trap_*` → 451. |

## Hard rules

1. Plaintext keys stannar i browser under exclusive lock.
2. Proxy meterar trafik och blockas av Kill Switch (`x-bc-killed: 1`).
3. Metadata only till server.

## Stack

Next.js App Router · TypeScript · Tailwind · IndexedDB · WebCrypto · Web Locks · Edge middleware · Vercel PWA

## Try

1. Open production in **Chrome/Edge**
2. Weld `.env`
3. Prove lock
4. **Simulate $10k spike** → KILLED
5. `POST /api/proxy/openai` with `x-bc-killed: 1` → **402**
6. VACUUM · DROP TRAP · trap key → **451**

## Pricing

**BridgeControl Black — $299/mo** + **3%** of proxied API spend.

## Show HN

> We built Datadog + 1Password + ngrok + Stripe for localhost — keys never leave
