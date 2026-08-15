"use client";

import { POPULAR_WORDS } from "@/lib/prompt-template";

interface PopularWordsProps {
  onSelect: (word: string) => void;
  disabled?: boolean;
}

export function PopularWords({ onSelect, disabled }: PopularWordsProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mt-10">
      <p className="text-center text-sm text-zinc-500 mb-4">
        Populära ord – klicka för att generera
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {POPULAR_WORDS.slice(0, 60).map((word) => (
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
