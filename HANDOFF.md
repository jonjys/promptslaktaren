# BridgeControl HANDOFF (Fred)

**Live:** https://promptslaktaren.vercel.app  
**Repo:** https://github.com/jonjys/promptslaktaren  
**Product name:** BridgeControl BLACK EDITION  
**Tagline:** Keys never leave. Spend never surprises.

## Status when you left phone mode

Production is **GREEN** on commit around `863ae29` (locks fix).  
Later commits (`cc220bc` mobile polish, `156d9af` trigger, this HANDOFF) may sit on `main` if **Vercel Git webhook stalled**.

### If production looks “old” (no ProxyStatus / weak mobile)

**One click:**
1. Open [Vercel → promptslaktaren → Deployments](https://vercel.com/feffelito-s-projects/promptslaktaren)
2. If latest commit is missing → **Redeploy** latest Ready, or disconnect/reconnect Git
3. Or: Settings → Git → ensure GitHub app still connected to `jonjys/promptslaktaren`

Optional CLI:
```bash
cd bridgecontrol   # or clone repo
vercel --prod
```

## What is already built (code on main)

| Layer | Status |
|-------|--------|
| Weld | AES-GCM + IndexedDB + File System Access / paste |
| Lock | Web Locks exclusive + prove lock |
| Kill 2.0 | Chart, $10k spike, Slack local, ARM/DISARM, `/api/kill` |
| Burn | One-time decrypt + delete |
| Ghost | Clipboard scan → silent weld |
| Vacuum + Trap | Surfaces scan + honeypot keys |
| Proxy | `/api/proxy/[provider]` + middleware 402/451 + 3% headers |
| PayGate / LogRiver | UI cards (demo) |
| Mobile polish | Larger touch targets, ProxyStatus test buttons |

## What you still need for “real money”

1. **Supabase** — run `supabase/migrations/20260817_bridgecontrol_infra.sql`
2. **Stripe metered** — real `STRIPE_SECRET_KEY` + usage records (helpers in `src/lib/stripe.ts`)
3. **Domain rename** — Vercel project/domain still `promptslaktaren.*` (cosmetic; product is BridgeControl)
4. **Repo rename** optional: GitHub Settings → Rename → `bridgecontrol`

## Phone test checklist

1. Open site in Chrome (best)  
2. Paste `OPENAI_API_KEY=sk-test-demo123` → Weld  
3. Prove lock  
4. Simulate $10k spike → KILLED  
5. VACUUM / DROP TRAP  
6. If ProxyStatus card visible: Test kill → 402, Test trap → 451  

## Hard rules (do not break)

- Plaintext keys stay on device under Web Lock  
- Server gets metadata only  
- Proxy inject of customer secrets = product pivot (document before shipping)

— Grok overnight / phone mode
