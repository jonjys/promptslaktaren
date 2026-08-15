"use client";

import { useState } from "react";
import { WordInput } from "@/components/WordInput";
import { PromptDisplay } from "@/components/PromptDisplay";
import { PopularWords } from "@/components/PopularWords";

export default function Home() {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(inputWord: string) {
    setLoading(true);
    setError(null);
    setPrompt(null);
    setWord(inputWord);

    try {
      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: inputWord }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Något gick fel");
        return;
      }
      setPrompt(json.data.prompt);
    } catch {
      setError("Kunde inte generera prompt. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight">
            Prompt<span className="text-emerald-600">Slaktaren</span>
          </div>
          <a
            href="https://fredcast.se"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-emerald-600 transition"
          >
            Är din app lönsam? → fredcast.se
          </a>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 sm:py-20">
        <section className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            Skriv ett ord.
            <br />
            <span className="text-emerald-600">Få en app.</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Ett ord → 15-punkts prompt som funkar i Claude, Grok, Meta AI & Venice
            AI. Byggd för Next.js + Supabase + Stripe. Copy-paste och shippa.
          </p>
        </section>

        <WordInput onGenerate={handleGenerate} loading={loading} />

        {error && (
          <p className="text-center text-red-500 mt-4">{error}</p>
        )}

        {!prompt && (
          <PopularWords onSelect={handleGenerate} disabled={loading} />
        )}

        {prompt && <PromptDisplay prompt={prompt} word={word} />}

        {!prompt && (
          <section className="max-w-4xl mx-auto mt-20 grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xl flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h3 className="font-semibold mb-1">Skriv ordet</h3>
              <p className="text-sm text-zinc-500">
                bokning, faktura, chat, scanner...
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xl flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h3 className="font-semibold mb-1">Kopiera 15 punkter</h3>
              <p className="text-sm text-zinc-500">
                En perfekt prompt för alla AI:er
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xl flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h3 className="font-semibold mb-1">Klistra in & shippa</h3>
              <p className="text-sm text-zinc-500">
                Claude / Grok / Meta AI / Venice AI
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-sm text-zinc-500">
        <p>
          Byggd för{" "}
          <a
            href="https://fredcast.se"
            className="text-emerald-600 hover:underline"
          >
            Fred-platform
          </a>{" "}
          – Är din app-idé lönsam?
        </p>
        <p className="mt-2">
          PromptSlaktaren · V1 · Deterministic template · Free 3 ord/dag
          (kommer)
        </p>
      </footer>
    </div>
  );
}
