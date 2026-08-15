"use client";

import { useState } from "react";

interface PromptDisplayProps {
  prompt: string;
  word: string;
  promptForLabel: string;
  copyAllLabel: string;
  copiedLabel: string;
  copyPointLabel: string;
}

export function PromptDisplay({
  prompt,
  word,
  promptForLabel,
  copyAllLabel,
  copiedLabel,
  copyPointLabel,
}: PromptDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const points = prompt
    .split("\n")
    .filter((line) => /^\d+\./.test(line.trim()));

  async function copyAll() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyPoint(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold">
          {promptForLabel}{" "}
          <span className="text-emerald-500">{word}</span>
        </h2>
        <button
          onClick={copyAll}
          className="px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:opacity-90 transition shrink-0"
        >
          {copied ? copiedLabel : copyAllLabel}
        </button>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-zinc-800 dark:text-zinc-200">
          {prompt}
        </pre>
      </div>

      {points.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400">
            {copyPointLabel}
          </h3>
          {points.map((point, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              <button
                onClick={() => copyPoint(point, i)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition"
              >
                {copiedIndex === i ? "\u2713" : copyPointLabel}
              </button>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{point}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
