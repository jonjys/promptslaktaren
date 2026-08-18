"use client";

import { useState } from "react";
import { rotateAll, type RotateProgress } from "@/lib/rotator";

type Props = {
  keyCount: number;
  disabled?: boolean;
  onDone?: () => void;
};

export default function RotateAllButton({ keyCount, disabled, onDone }: Props) {
  const [prog, setProg] = useState<RotateProgress | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    setProg({ done: 0, total: keyCount, status: "running", message: "Acquiring lock\u2026" });
    try {
      const r = await rotateAll(setProg);
      setProg(r);
      onDone?.();
    } catch (e) {
      setProg({
        done: 0,
        total: keyCount,
        status: "error",
        message: e instanceof Error ? e.message : "Rotate failed",
      });
    } finally {
      setBusy(false);
    }
  }

  const label =
    prog?.status === "running"
      ? `Rotating ${prog.done}/${prog.total}`
      : `ROTATE ALL ${keyCount || 47}`;

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void run()}
        className="min-h-11 w-full sm:w-auto px-4 py-2.5 border border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88] text-xs font-mono font-bold disabled:opacity-40"
      >
        {label}
      </button>
      {prog && (
        <p
          className={`text-[11px] font-mono ${
            prog.status === "error"
              ? "text-[#ff0033]"
              : prog.status === "done"
                ? "text-[#00FF88]"
                : "text-zinc-400"
          }`}
        >
          {prog.message}
          {prog.current ? ` \u00b7 ${prog.current}` : ""}
        </p>
      )}
    </div>
  );
}
