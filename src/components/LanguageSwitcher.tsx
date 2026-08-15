"use client";

import { Locale, LOCALES } from "@/lib/i18n";

interface Props {
  locale: Locale;
  onChange: (locale: Locale) => void;
}

export function LanguageSwitcher({ locale, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
            locale === l.code
              ? "bg-emerald-600 text-white"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
          aria-label={l.label}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}
