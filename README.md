# BridgeControl

**Keys never leave. Spend never surprises.**

Zero-trust local-first API key gateway + CostRadar kill-switch.

Fusion of: SvetsSecret / CostGate / CostRadar / BridgeControl.

## What shipped (overnight MVP)

| Layer | What |
|-------|------|
| **Weld** | Import `.env` via File System Access or paste → AES-GCM in IndexedDB |
| **Lock** | Web Locks exclusive use · prove-lock decrypts ~50ms then discards |
| **Kill** | CostRadar budget + manual/auto kill switch blocks all key use |
| **Meter** | Local usage events + estimated spend (demo rates) |
| **Proxy** | Service Worker `/api/proxy/:provider/:keyId/...` (CORS-limited upstream) |

**Hard rule:** secret values never hit our server. Metadata only.

## Stack

Next.js · TypeScript · Tailwind · IndexedDB · WebCrypto · Web Locks · Service Worker · Vercel

## Try

1. Open https://promptslaktaren.vercel.app in Chrome/Edge  
2. Paste `OPENAI_API_KEY=sk-test-demo123456` → Weld  
3. **Prove lock** → usage + meter  
4. Set budget to `$0.01` → prove again → **AUTO-KILL**  
5. Arm/disarm kill switch manually  

## Pricing (UI live, Stripe later)

- Indie 99 kr · Startup 999 kr · Enterprise 9999 kr + 2% take on proxied traffic

## Show HN

> We stopped API key leaks by never letting the key leave the machine (Web Locks + File System Access + kill switch)

## Not in v1

YubiKey/WebUSB · real Stripe metered · multi-device sync · full upstream CORS bypass (needs extension)
