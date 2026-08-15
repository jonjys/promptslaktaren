import { Metadata } from "next";
import Link from "next/link";
import {
  generate15PointPrompt,
  generateSeoTitle,
  generateSeoDescription,
  POPULAR_WORDS,
} from "@/lib/prompt-template";

type Props = {
  params: Promise<{ word: string }>;
};

export async function generateStaticParams() {
  return POPULAR_WORDS.map((word) => ({
    word: `${word}-app-prompt`,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { word: raw } = await params;
  const word = raw.replace(/-app-prompt$/, "").replace(/-/g, " ");
  return {
    title: generateSeoTitle(word),
    description: generateSeoDescription(word),
    openGraph: {
      title: generateSeoTitle(word),
      description: generateSeoDescription(word),
    },
  };
}

export default async function WordPage({ params }: Props) {
  const { word: raw } = await params;
  const word = raw.replace(/-app-prompt$/, "").replace(/-/g, " ");
  const prompt = generate15PointPrompt(word);
  const title = generateSeoTitle(word);

  const related = POPULAR_WORDS.filter(
    (w) => w.toLowerCase() !== word.toLowerCase()
  ).slice(0, 8);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight">
            Prompt<span className="text-emerald-600">Slaktaren</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-emerald-600 hover:underline"
          >
            ← Generera nytt ord
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <nav className="text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-emerald-600">
            Hem
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-800 dark:text-zinc-200">{word} app prompt</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
          {word.charAt(0).toUpperCase() + word.slice(1)} App Prompt
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Perfekt 15-punkts prompt för Claude, Grok, Meta AI och Venice AI.
          Copy-paste och bygg en {word}-app i Next.js + Supabase + Stripe.
        </p>

        <div className="flex gap-3 mb-8">
          <a
            href={`#prompt`}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition"
          >
            Visa prompten
          </a>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 font-medium hover:border-emerald-500 transition"
          >
            Generera annat ord
          </Link>
        </div>

        <section id="prompt" className="mb-12">
          <h2 className="text-xl font-bold mb-4">
            Copy-paste prompt for Claude, Grok, Meta AI
          </h2>
          <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-zinc-800 dark:text-zinc-200">
              {prompt}
            </pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-3">
            Why this prompt works in all AIs
          </h2>
          <ul className="list-disc list-inside space-y-2 text-zinc-700 dark:text-zinc-300">
            <li>Tvingar samma stack: Next.js 14 + Supabase + Stripe + shadcn</li>
            <li>Layer 1 / Layer 2 separation – AI får inte hitta på siffror</li>
            <li>Zod-validering överallt</li>
            <li>RLS och säkerhet inbyggd från start</li>
            <li>V1-scope så du faktiskt shippar istället för att feature-creepa</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-3">
            Database schema for {word} app
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-3">
            Prompten inkluderar färdig SQL-migration med RLS. Tabeller:
            profiles, {word}_items, {word}_logs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Also try</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((w) => (
              <Link
                key={w}
                href={`/${w}-app-prompt`}
                className="px-3 py-1.5 text-sm rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 hover:text-emerald-600 transition"
              >
                {w} prompt
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-sm text-zinc-500">
        <p>
          {title}
        </p>
        <p className="mt-2">
          <Link href="/" className="text-emerald-600 hover:underline">
            PromptSlaktaren
          </Link>{" "}
          · Är din app lönsam?{" "}
          <a
            href="https://fredcast.se"
            className="text-emerald-600 hover:underline"
          >
            fredcast.se
          </a>
        </p>
      </footer>
    </div>
  );
}
