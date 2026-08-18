"use client";

import { useState } from "react";
import { runGhostSonar, burnGhosts, formatRisk, type SonarResult } from "@/lib/echo-scanner";

export default function GhostSonarCard() {
  const [busy, setBusy] = useState(false);
  const [scanned, setScanned] = useState(0);
  const [result, setResult] = useState<SonarResult | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function scan() {
    setBusy(true);
    setMsg(null);
    setResult(null);
    setScanned(0);
    try {
      const r = await runGhostSonar(setScanned);
      setResult(r);
      setMsg(
        `${r.ghosts.length} ghost keys from history · ${r.liveCount} still work · ${formatRisk(r.riskCents)} at risk`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sonar failed");
    } finally {
      setBusy(false);
    }
  }

  function onBurn() {
    const n = burnGhosts();
    setResult((prev) => (prev ? { ...prev, ghosts: [], liveCount: 0, riskCents: 0 } : prev));
    setMsg(`BURNED ${n} ghost traces · 0 residual on device`);
  }

  return (
    <section className="border border-[#00FF88]/30 bg-black p-4 sm:p-5 space-y-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -right-8 -top-8 w-32 h-32 rounded-full border border-[#00FF88]/20 animate-pulse" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-2 relative">
        <div>
          <h2 className="text-[#00FF88] font-bold text-sm font-mono tracking-wide">GHOST SONAR</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">Local history scan · WebGPU-ready · never uploads blobs</p>
        </div>
        <button type="button" disabled={busy} onClick={() => void scan()} className="min-h-10 px-4 py-2 border border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88] text-xs font-mono font-bold disabled:opacity-40">
          {busy ? `Scanning ${scanned}…` : "Ping sonar"}
        </button>
      </div>
      {busy && (
        <div className="h-1 bg-[#111] overflow-hidden">
          <div className="h-full bg-[#00FF88] transition-all duration-200" style={{ width: `${Math.min(100, (scanned / 280) * 100)}%` }} />
        </div>
      )}
      {msg && <p className="text-xs font-mono text-zinc-300 border border-[#111] bg-[#050505] p-3">{msg}</p>}
      {result && result.ghosts.length > 0 && (
        <>
          <ul className="max-h-40 overflow-y-auto space-y-1 text-[10px] font-mono text-zinc-500">
            {result.ghosts.slice(0, 8).map((g) => (
              <li key={g.id} className="flex justify-between gap-2 border-b border-[#111] py-1">
                <span>{g.pattern} · {g.year}</span>
                <span className={g.stillWorks ? "text-[#ff0033]" : "text-zinc-600"}>{g.stillWorks ? `LIVE ${formatRisk(g.riskCents)}` : "dead"}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={onBurn} className="w-full min-h-11 border border-[#ff0033] bg-[#ff0033]/15 text-[#ff0033] text-xs font-mono font-bold">BURN GHOSTS</button>
        </>
      )}
    </section>
  );
}
