"use client";

import { useState, useEffect } from "react";
import { WordInput } from "@/components/WordInput";
import { PromptDisplay } from "@/components/PromptDisplay";
import { PopularWords } from "@/components/PopularWords";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export default function Home() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const d = t(locale);

  useEffect(() => {
    const saved = localStorage.getItem("ps-locale") as Locale | null;
    if (saved === "en" || saved === "sv") setLocale(saved);
  }, []);

  function changeLocale(next: Locale) {
    setLocale(next);
    localStorage.setItem("ps-locale", next);
  }

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
        setError(json.error || d.errorGeneric);
        return;
      }
      setPrompt(json.data.prompt);
    } catch {
      setError(d.errorFetch);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="font-bold text-xl tracking-tight">
            Prompt<span className="text-emerald-600">Slaktaren</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} onChange={changeLocale} />
            <a
              href="https://fredcast.se"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline text-sm text-zinc-500 hover:text-emerald-600 transition"
            >
              {d.fredLink}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 sm:py-20">
        <section className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
            {d.heroTitle1}
            <br />
            <span className="text-emerald-600">{d.heroTitle2}</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {d.heroSub}
          </p>
        </section>

        <WordInput
          onGenerate={handleGenerate}
          loading={loading}
          placeholder={d.placeholder}
          cta={d.cta}
          ctaLoading={d.ctaLoading}
        />

        {error && <p className="text-center text-red-500 mt-4">{error}</p>}

        {!prompt && (
          <PopularWords
            onSelect={handleGenerate}
            disabled={loading}
            locale={locale}
            title={d.popularTitle}
          />
        )}

        {prompt && (
          <PromptDisplay
            prompt={prompt}
            word={word}
            promptForLabel={d.promptFor}
            copyAllLabel={d.copyAll}
            copiedLabel={d.copied}
            copyPointLabel={d.copyPoint}
          />
        )}

        {!prompt && (
          <section className="max-w-4xl mx-auto mt-20 grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xl flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h3 className="font-semibold mb-1">{d.step1Title}</h3>
              <p className="text-sm text-zinc-500">{d.step1Desc}</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xl flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h3 className="font-semibold mb-1">{d.step2Title}</h3>
              <p className="text-sm text-zinc-500">{d.step2Desc}</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xl flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h3 className="font-semibold mb-1">{d.step3Title}</h3>
              <p className="text-sm text-zinc-500">{d.step3Desc}</p>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-sm text-zinc-500">
        <p>
          {d.footerBuilt}{" "}
          <a
            href="https://fredcast.se"
            className="text-emerald-600 hover:underline"
          >
            Fred-platform
          </a>{" "}
          {d.footerProfit}
        </p>
        <p className="mt-2">{d.footerV1}</p>
      </footer>
    </div>
  );
}
