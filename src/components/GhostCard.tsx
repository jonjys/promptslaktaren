"use client";

import { useEffect, useState } from "react";
import { checkGhostClipboard } from "@/lib/ghost";

type Props = {
  onGhostEnv: (text: string) => Promise<void> | void;
  onLog?: (msg: string) => void;
  busy?: boolean;
};

export function GhostCard({ onGhostEnv, onLog, busy }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let lastHash = "";
    let cancelled = false;
    const id = setInterval(async () => {
      if (cancelled || busy || pending) return;
      const text = await checkGhostClipboard();
      if (!text) return;
      const hash = text.slice(0, 64) + ":" + text.length;
      if (hash === lastHash) return;
      lastHash = hash;
      setPending(text);
      setToast("GHOST detected .env in clipboard");
      onLog?.("GHOST: env-like content detected (value never shown)");
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [busy, pending, onLog]);

  async function handleInject() {
    if (!pending) return;
    try {
      await onGhostEnv(pending);
      setPending(null);
      setToast(null);
      onLog?.("GHOST welded silently – value never displayed");
    } catch (err) {
      onLog?.("Ghost inject failed: " + String(err));
    }
  }

  function handleDismiss() {
    setPending(null);
    setToast(null);
    onLog?.("GHOST dismissed");
  }

  if (!toast) return null;

  return (
    <div className="border border-[#ff00ff] bg-[#ff00ff]/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-[#ff00ff] font-mono font-medium">{toast}</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleInject}
          disabled={busy}
          className="px-3 py-1.5 border border-[#ff00ff] bg-[#ff00ff] text-black text-xs font-mono font-bold disabled:opacity-50"
        >
          Inject Ghost .env
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1.5 border border-zinc-700 text-xs text-zinc-400 font-mono"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
