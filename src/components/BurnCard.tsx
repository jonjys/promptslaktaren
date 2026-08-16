"use client";

import { useState } from "react";
import { burnKey } from "@/lib/secure-store";

type Props = {
  keyId: string;
  keyName: string;
  disabled?: boolean;
  onBurned: (msg: string) => void;
  onLog?: (msg: string) => void;
};

export function BurnCard({ keyId, keyName, disabled, onBurned, onLog }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleBurn() {
    if (
      !confirm(
        `BURN "${keyName}" forever?\n\nOne-time decrypt under exclusive lock, then permanent delete from IndexedDB.\nZero residual ciphertext. No undo.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await burnKey(keyId);
      const ts = new Date(res.burnedAt).toLocaleTimeString();
      const msg = `Key burned at ${ts} - 0 trace`;
      onLog?.(`BURN ${keyName} · ${msg} (${res.tookMs}ms)`);
      onBurned(msg);
    } catch (err) {
      onLog?.("Burn failed: " + String(err));
      onBurned("Burn failed: " + String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBurn}
      disabled={disabled || busy}
      title="One-time use. Key deleted after."
      className="px-3 py-1.5 border border-[#ff0033] bg-[#ff0033]/15 text-[#ff0033] text-xs font-mono font-medium hover:bg-[#ff0033]/30 disabled:opacity-40 transition"
    >
      {busy ? "Burning…" : "Burn"}
    </button>
  );
}
