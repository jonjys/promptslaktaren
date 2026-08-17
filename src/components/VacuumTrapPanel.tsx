"use client";

import { useState } from "react";
import { runVacuum, type VacuumHit } from "@/lib/vacuum";
import { dropTrap, listTraps, type TrapRecord } from "@/lib/traps";

type Props = { onLog?: (m: string) => void };

export default function VacuumTrapPanel({ onLog }: Props) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hits, setHits] = useState<VacuumHit[] | null>(null);
  const [total, setTotal] = useState(0);
  const [traps, setTraps] = useState<TrapRecord[]>(() =>
    typeof window !== "undefined" ? listTraps() : []
  );

  async function onVacuum() {
    setRunning(true);
    setProgress(0);
    setHits(null);
    onLog?.("VACUUM started — scanning surfaces…");
    // dramatic 11s progress
    const start = Date.now();
    const timer = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / 11000) * 100);
      setProgress(p);
    }, 200);
    await new Promise((r) => setTimeout(r, 1100)); // snappier demo than full 11s
    const result = await runVacuum();
    clearInterval(timer);
    setProgress(100);
    setHits(result.hits);
    setTotal(result.total);
    setRunning(false);
    onLog?.(`VACUUM done — Found ${result.total} secrets in ${result.hits.length} surfaces`);
  }

  async function onDropTrap() {
    const local = dropTrap("openai");
    try {
      await fetch("/api/trap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "drop", provider: "openai" }),
      });
    } catch {
      /* offline ok */
    }
    setTraps(listTraps());
    onLog?.(`TRAP dropped · ${local.honeypotKey.slice(0, 22)}…`);
  }

  return (
    <section className="border border-[#333] bg-black p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[#00FF88] font-bold text-sm font-mono tracking-wide">
            VACUUM + TRAP
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Dammsugare · honeypot fälla · paranoia mode
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={running}
            onClick={onVacuum}
            className="text-xs px-3 py-1.5 border border-[#00FF88] bg-[#00FF88]/10 text-[#00FF88] font-mono font-bold disabled:opacity-40"
          >
            {running ? `VACUUM ${progress.toFixed(0)}%` : "VACUUM"}
          </button>
          <button
            type="button"
            onClick={onDropTrap}
            className="text-xs px-3 py-1.5 border border-[#ff00ff]/50 text-[#ff00ff] font-mono font-bold"
          >
            DROP TRAP
          </button>
        </div>
      </div>

      {running && (
        <div className="h-1.5 bg-[#111] overflow-hidden">
          <div
            className="h-full bg-[#00FF88] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {hits && (
        <div className="text-xs font-mono space-y-2">
          <p className="text-[#00FF88]">
            Found {total} secrets in {hits.length} surfaces
          </p>
          <ul className="space-y-1 max-h-36 overflow-y-auto">
            {hits.map((h) => (
              <li key={h.surface} className="text-zinc-400 flex justify-between gap-2">
                <span>{h.surface}</span>
                <span className="text-zinc-500">{h.count} · {h.samples.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {traps.length > 0 && (
        <div className="border-t border-[#111] pt-3">
          <p className="text-[11px] text-zinc-500 font-mono mb-1">Active traps</p>
          <ul className="space-y-1 text-xs font-mono">
            {traps.slice(0, 5).map((t) => (
              <li key={t.id} className="text-zinc-400 flex justify-between gap-2">
                <span className="truncate">{t.honeypotKey}</span>
                <span className={t.triggered ? "text-[#ff0033]" : "text-zinc-600"}>
                  {t.triggered ? `TRIGGERED ${t.triggeredIp}` : "armed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
