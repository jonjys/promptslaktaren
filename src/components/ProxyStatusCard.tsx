"use client";

import { useState } from "react";

export default function ProxyStatusCard() {
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function test(kind: "ok" | "kill" | "trap") {
    setBusy(true);
    setOut(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (kind === "kill") headers["x-bc-killed"] = "1";
      if (kind === "trap") headers["Authorization"] = "Bearer sk_test_trap_demo_phone";
      if (kind === "ok") headers["Authorization"] = "Bearer sk-demo-local";

      const res = await fetch("/api/proxy/openai", {
        method: "POST",
        headers,
        body: "{}",
      });
      const json = await res.json().catch(() => ({}));
      setOut(`${res.status} · ${JSON.stringify(json).slice(0, 180)}`);
    } catch (e) {
      setOut(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-[#00FF88]/30 bg-black p-4 space-y-3">
      <div>
        <h2 className="text-[#00FF88] font-bold text-sm font-mono">PROXY · 3% TAKE</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          /api/proxy/[provider] · kill 402 · trap 451
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => test("ok")}
          className="min-h-11 px-3 py-2 border border-[#00FF88]/40 text-[#00FF88] text-xs font-mono font-bold disabled:opacity-40"
        >
          Test proxy
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => test("kill")}
          className="min-h-11 px-3 py-2 border border-[#ff0033]/50 text-[#ff0033] text-xs font-mono font-bold disabled:opacity-40"
        >
          Test kill → 402
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => test("trap")}
          className="min-h-11 px-3 py-2 border border-[#ff00ff]/50 text-[#ff00ff] text-xs font-mono font-bold disabled:opacity-40"
        >
          Test trap → 451
        </button>
      </div>
      {out && (
        <pre className="text-[10px] font-mono text-zinc-400 bg-[#050505] border border-[#111] p-2 overflow-x-auto whitespace-pre-wrap break-all">
          {out}
        </pre>
      )}
    </section>
  );
}
