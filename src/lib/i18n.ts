export type Locale = "en" | "sv";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "EN" },
  { code: "sv", label: "Svenska", flag: "SV" },
];

export const DEFAULT_LOCALE: Locale = "en";

type Dict = {
  brand: string;
  tagline: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSub: string;
  placeholder: string;
  cta: string;
  ctaLoading: string;
  popularTitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  copyAll: string;
  copied: string;
  copyPoint: string;
  promptFor: string;
  fredLink: string;
  footerBuilt: string;
  footerProfit: string;
  footerV1: string;
  errorGeneric: string;
  errorFetch: string;
  errorWordLength: string;
  generateNew: string;
  showPrompt: string;
  alsoTry: string;
  whyWorks: string;
  whyWorksList: string[];
  dbSchema: string;
  dbSchemaDesc: string;
  home: string;
};

export const dict: Record<Locale, Dict> = {
  en: {
    brand: "PromptSlaktaren",
    tagline: "Write one word. Get a perfect app prompt.",
    heroTitle1: "Write one word.",
    heroTitle2: "Get an app.",
    heroSub:
      "One word \u2192 15-point prompt that works in Claude, Grok, Meta AI & Venice AI. Built for Next.js + Supabase + Stripe. Copy-paste and ship.",
    placeholder: "Type a word... e.g. booking, invoice, chat",
    cta: "GENERATE PROMPT",
    ctaLoading: "Generating...",
    popularTitle: "Popular words \u2014 click to generate",
    step1Title: "Write the word",
    step1Desc: "booking, invoice, chat, scanner...",
    step2Title: "Copy 15 points",
    step2Desc: "A perfect prompt for every AI",
    step3Title: "Paste & ship",
    step3Desc: "Claude / Grok / Meta AI / Venice AI",
    copyAll: "Copy full prompt",
    copied: "\u2713 Copied!",
    copyPoint: "Copy",
    promptFor: "15-point prompt for",
    fredLink: "Is your app idea profitable? \u2192 fredcast.se",
    footerBuilt: "Built for",
    footerProfit: "\u2014 Is your app idea profitable?",
    footerV1: "PromptSlaktaren \u00b7 V1 \u00b7 EN/SV \u00b7 Free tier coming",
    errorGeneric: "Something went wrong",
    errorFetch: "Could not generate prompt. Try again.",
    errorWordLength: "Word must be 2\u201340 characters",
    generateNew: "\u2190 Generate another word",
    showPrompt: "Show prompt",
    alsoTry: "Also try",
    whyWorks: "Why this prompt works in all AIs",
    whyWorksList: [
      "Forces the same stack: Next.js 14 + Supabase + Stripe + shadcn",
      "Layer 1 / Layer 2 separation \u2014 AI never invents numbers",
      "Zod validation everywhere",
      "RLS and security built in from day one",
      "Strict V1 scope so you actually ship instead of feature-creeping",
    ],
    dbSchema: "Database schema for",
    dbSchemaDesc:
      "The prompt includes a ready SQL migration with RLS. Tables: profiles, {word}_items, {word}_logs.",
    home: "Home",
  },
  sv: {
    brand: "PromptSlaktaren",
    tagline: "Skriv ett ord. F\u00e5 en prompt som bygger appen.",
    heroTitle1: "Skriv ett ord.",
    heroTitle2: "F\u00e5 en app.",
    heroSub:
      "Ett ord \u2192 15-punkts prompt som funkar i Claude, Grok, Meta AI & Venice AI. Byggd f\u00f6r Next.js + Supabase + Stripe. Copy-paste och shippa.",
    placeholder: "Skriv ett ord... t.ex. bokning, faktura, chat",
    cta: "SLAKTA FRAM PROMPT",
    ctaLoading: "Slaktar...",
    popularTitle: "Popul\u00e4ra ord \u2013 klicka f\u00f6r att generera",
    step1Title: "Skriv ordet",
    step1Desc: "bokning, faktura, chat, scanner...",
    step2Title: "Kopiera 15 punkter",
    step2Desc: "En perfekt prompt f\u00f6r alla AI:er",
    step3Title: "Klistra in & shippa",
    step3Desc: "Claude / Grok / Meta AI / Venice AI",
    copyAll: "Kopiera hela prompten",
    copied: "\u2713 Kopierad!",
    copyPoint: "Kopiera",
    promptFor: "15-punkts prompt f\u00f6r",
    fredLink: "\u00c4r din app-id\u00e9 l\u00f6nsam? \u2192 fredcast.se",
    footerBuilt: "Byggd f\u00f6r",
    footerProfit: "\u2013 \u00c4r din app-id\u00e9 l\u00f6nsam?",
    footerV1: "PromptSlaktaren \u00b7 V1 \u00b7 EN/SV \u00b7 Free 3 ord/dag (kommer)",
    errorGeneric: "N\u00e5got gick fel",
    errorFetch: "Kunde inte generera prompt. F\u00f6rs\u00f6k igen.",
    errorWordLength: "Ord m\u00e5ste vara 2\u201340 tecken",
    generateNew: "\u2190 Generera nytt ord",
    showPrompt: "Visa prompten",
    alsoTry: "Prova ocks\u00e5",
    whyWorks: "Varf\u00f6r denna prompt funkar i alla AI:er",
    whyWorksList: [
      "Tvingar samma stack: Next.js 14 + Supabase + Stripe + shadcn",
      "Layer 1 / Layer 2-separation \u2013 AI f\u00e5r inte hitta p\u00e5 siffror",
      "Zod-validering \u00f6verallt",
      "RLS och s\u00e4kerhet inbyggd fr\u00e5n start",
      "Strikt V1-scope s\u00e5 du faktiskt shippar ist\u00e4llet f\u00f6r att feature-creepa",
    ],
    dbSchema: "Databasschema f\u00f6r",
    dbSchemaDesc:
      "Prompten inkluderar f\u00e4rdig SQL-migration med RLS. Tabeller: profiles, {word}_items, {word}_logs.",
    home: "Hem",
  },
};

export function t(locale: Locale): Dict {
  return dict[locale] ?? dict.en;
}
