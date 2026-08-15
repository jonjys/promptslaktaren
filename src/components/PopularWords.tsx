"use client";

import { getPopularWords } from "@/lib/prompt-template";
import type { Locale } from "@/lib/i18n";

interface PopularWordsProps {
  onSelect: (word: string) => void;
  disabled?: boolean;
  locale: Locale;
  title: string;
}

export function PopularWords({
  onSelect,
  disabled,
  locale,
  title,
}: PopularWordsProps) {
  const words = getPopularWords(locale).slice(0, 64);

  return (
    <div className="w-full max-w-4xl mx-auto mt-10">
      <p className="text-center text-sm text-zinc-500 mb-4">{title}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {words.map((word) => (
          <button
            key={word}
            onClick={() => onSelect(word)}
            disabled={disabled}
            className="px-3 py-1.5 text-sm rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition disabled:opacity-50"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
