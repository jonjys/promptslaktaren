# PromptSlaktaren

**Skriv ett ord. Få en 15-punkts prompt som bygger appen åt dig.**

Works in Claude, Grok, Meta AI, Venice AI.

Stack: Next.js (App Router) + TypeScript + Tailwind + deterministic prompt template.

## V1 features

- Word → 15-point prompt (deterministic template)
- SEO pages for 100+ popular words (`/bokning-app-prompt` etc.)
- Copy buttons
- Mobile-first landing
- Sitemap + robots.txt

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Push to GitHub → import in Vercel.

## Coming V2

- Supabase Auth + daily limit
- Stripe Pro 49 kr/mån
- Save prompts
- Claude-powered variation (optional)

Built as top-of-funnel for [fredcast.se](https://fredcast.se).
