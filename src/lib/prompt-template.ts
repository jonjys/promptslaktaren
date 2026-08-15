export function generate15PointPrompt(word: string): string {
  const W = word.toLowerCase().trim().replace(/\s+/g, "-");
  const capitalized = W.charAt(0).toUpperCase() + W.slice(1);
  const slug = `${W}-app-prompt`;
  
  return `PROMPT FOR: ${capitalized} - Copy this into Claude / Grok / Meta AI / Venice AI

1. ROLE: You are a senior full-stack engineer. Build a complete ${W} app in Next.js 14 App Router, TypeScript, Supabase, Stripe, Tailwind + shadcn. No other stack.

2. CORE VALUE: The app does ONE thing: ${W}. User understands in 3 seconds. No feature creep. One happy path.

3. ARCHITECTURE: Layer 1 = deterministic pure TypeScript functions (no AI, no I/O) for all numbers, VAT, status. Layer 2 = AI only explains risk / extracts stated values. AI never invents numbers or final status. Zod validates everything.

4. DATABASE: Supabase tables: profiles (id, email, subscription_status), ${W}_items (id, user_id, title, status, data JSONB, created_at), ${W}_logs. Enable RLS: user can only read own rows. Provide SQL migration.

5. API: /api/${W}/create (POST, Zod: title, data), /api/${W}/list (GET), /api/${W}/[id] (GET/PATCH/DELETE). All return {ok:true,data} or {ok:false,error}. Rate limit 10 req/min.

6. UI: /${W} page. Left: Form (2 fields max for v1: title + description). Right: List of ${W}_items with status badge. EmptyState if no data. Use shadcn Card, Button, Input, Badge. Mobile-first.

7. AUTH: Supabase Auth, Google + email. middleware.ts protects /${W} and /dashboard. If no session redirect /login. Profile created on signup.

8. STRIPE: One product ${capitalized} Pro. Price 79 SEK/mo OR 149 SEK engång (choose one). Create price_id. Checkout in /api/stripe/checkout. Webhook /api/stripe/webhook updates profiles.subscription_status. Free = 3 ${W} items.

9. FILE UPLOAD (if relevant for ${W}): Supabase Storage bucket ${W}-uploads. Accept PDF, images. Parse with pdf-parse. Never trust file content as numbers - extract as text only.

10. AI PROMPT (if ${W} needs AI): Claude prompt: "Extract only stated values from this text, never invent. Return JSON matching Zod schema: {title, amount, date}. Temperature 0. If value not stated, return null."

11. VERDICT/LOGIC: Deterministic function resolve${capitalized}Status(metrics) => 'active' | 'pending' | 'done'. Pure function, unit-testable. No AI in verdict.

12. EDGE CASES: Empty list, duplicate title, file >10MB, Supabase offline, Stripe failed, rate limit hit, user not auth, Zod validation fail.

13. TESTING: Vitest for Layer1. Test happy path + fail path. Test file: lib/${W}/engine.test.ts

14. DEPLOY: Vercel. Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE, STRIPE_SECRET, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PRO_PRICE_ID. next.config.mjs clean, no experimental.

15. MOAT & V1 SKIP: V1 skips: iOS app, team invites, RBAC, email notifications, real-time. Moat: You own the data model + RLS + Stripe that others copy badly. Footer on app: "Built with PromptSlaktaren - Is this ${W} app profitable? Check fredcast.se"

BUILD IT NOW. No explanation. Only code. Start with SQL migration, then lib/${W}/engine.ts, then API routes, then UI.
---
SEO FOOTER FOR GENERATED APP: Title: "${capitalized} App Prompt for Claude, Grok, Meta AI - Build in seconds | PromptSlaktaren" Description: "Get perfect 15-point prompt to build ${W} app in Next.js, Supabase, Stripe. Works in Claude, Grok, Meta AI, Venice AI. Copy-paste and ship."
`;
}

export function generateSeoTitle(word: string): string {
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return `${capitalized} App Prompt for Claude, Grok, Meta AI - Build ${capitalized} App in Seconds | PromptSlaktaren`;
}

export function generateSeoDescription(word: string): string {
  const W = word.toLowerCase();
  return `Get the perfect 15-point prompt to build a ${W} app in Next.js, Supabase, Stripe. Copy-paste into Claude, Grok, Meta AI, Venice AI. Free.`;
}

export const POPULAR_WORDS = [
  "bokning",
  "faktura",
  "booking",
  "invoice",
  "chat",
  "dashboard",
  "scanner",
  "crm",
  "todo",
  "kalender",
  "calendar",
  "betalning",
  "payment",
  "shop",
  "store",
  "blog",
  "portfolio",
  "kund",
  "kundhantering",
  "tidrapport",
  "time-tracker",
  "lager",
  "inventory",
  "offert",
  "quote",
  "projekt",
  "project",
  "task",
  "habit",
  "noter",
  "notes",
  "kanban",
  "pipeline",
  "lead",
  "sälj",
  "sales",
  "support",
  "ticket",
  "bokföring",
  "accounting",
  "budget",
  "expense",
  "kvitto",
  "receipt",
  "kontrakt",
  "contract",
  "signering",
  "signature",
  "formulär",
  "form",
  "survey",
  "enkäter",
  "event",
  "evenemang",
  "anmälan",
  "registration",
  "medlemskap",
  "membership",
  "prenumeration",
  "subscription",
  "nyhetsbrev",
  "newsletter",
  "podd",
  "podcast",
  "video",
  "kurs",
  "course",
  "lms",
  "learning",
  "quiz",
  "test",
  "certifikat",
  "certificate",
  "cv",
  "resume",
  "jobb",
  "job",
  "rekrytering",
  "recruitment",
  "hr",
  "lön",
  "payroll",
  "tidrapportering",
  "timesheet",
  "schema",
  "schedule",
  "bokningssystem",
  "reservation",
  "hotel",
  "restaurang",
  "restaurant",
  "meny",
  "menu",
  "beställning",
  "order",
  "leverans",
  "delivery",
  "frakt",
  "shipping",
  "lagerstyrning",
  "wms",
  "ecommerce",
  "e-handel",
  "webshop",
  "checkout",
  "kassa",
  "pos",
  "kassaapparat",
  "inventering",
  "stocktaking",
];
