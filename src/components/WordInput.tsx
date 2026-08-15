"use client";

import { useState, FormEvent } from "react";

interface WordInputProps {
  onGenerate: (word: string) => void;
  loading?: boolean;
}

export function WordInput({ onGenerate, loading }: WordInputProps) {
  const [word, setWord] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = word.trim();
    if (trimmed.length >= 2) {
      onGenerate(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Skriv ett ord... t.ex. bokning, faktura, chat"
          className="flex-1 px-5 py-4 text-lg rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
          disabled={loading}
          maxLength={40}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || word.trim().length < 2}
          className="px-8 py-4 text-lg font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-600/20"
        >
          {loading ? "Slaktar..." : "SLAKTA FRAM PROMPT"}
        </button>
      </div>
    </form>
  );
}
