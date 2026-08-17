"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getRadarConfig,
  monthSpendCents,
  getCostSeries,
  simulateTenKSpike,
  armKillSwitch,
  disarmKillSwitch,
  setMonthlyBudget,
  getSlackWebhook,
  setSlackWebhook,
  type RadarConfig,
  type CostPoint,
} from "@/lib/cost-radar";

type Props = {
  onLog?: (msg: string) => void;
  onRefresh?: () => void;
};

export default function KillSwitchPro({ onLog, onRefresh }: Props) {
  const [cfg, setCfg] = useState<RadarConfig | null>(null);
  const [spend, setSpend] = useState(0);
  const [series, setSeries] = useState<CostPoint[]>([]);
  const [budgetInput, setBudgetInput] = useState("50");
  const [slack, setSlack] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const c = await getRadarConfig();
      setCfg(c);
      setBudgetInput(String(c.monthlyBudgetCents / 100));
      setSpend(await monthSpendCents());
      setSeries(await getCostSeries(48));
      setSlack(getSlackWebhook());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 4000);
    return () => clearInterval(t);
  }, [refresh]);

  const budget = cfg?.monthlyBudgetCents ?? 5000;
  const pct = Math.min(100, (spend / Math.max(1, budget)) * 100);
  const killed = !!cfg?.killed;

  const chart = useMemo(() => {
    const w = 320;
    const h = 96;
    const pad = 8;
    if (series.length < 2) {
      return { path: "", zoneY: h - pad, w, h, maxY: budget };
    }
    const maxY = Math.max(budget, ...series.map((p) => p.cumulativeCents), 1);
    const minT = series[0].at;
    const maxT = series[series.length - 1].at || minT + 1;
    const pts = series.map((p) => {
      const x = pad + ((p.at - minT) / (maxT - minT || 1)) * (w - pad * 2);
      const y = h - pad - (p.cumulativeCents / maxY) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const zoneY = h - pad - (budget / maxY) * (h - pad * 2);
    return { path: `M ${pts.join(" L ")}`, zoneY, w, h, maxY };
  }, [series, budget]);

  async function onSpike() {
    setBusy(true);
    try {
      const r = await simulateTenKSpike();
      try {
        await fetch("/api/kill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "spike",
            budgetCents: budget,
            reason: "$10k spike",
          }),
        });
      } catch {
        /* offline ok — local kill still applied */
      }
      onLog?.(
        r.autoKilled
          ? `SPIKE $10k → KILL SWITCH TRIPPED · spend $${(r.spendCents / 100).toFixed(2)} · proxy blocked`
          : `SPIKE $10k recorded · spend $${(r.spendCents / 100).toFixed(2)}`
      );
      await refresh();
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  }

  async function onSaveBudget() {
    const d = Number(budgetInput);
    if (Number.isNaN(d) || d < 0) return;
    await setMonthlyBudget(Math.round(d * 100));
    onLog?.(`Budget set to $${d}`);
    await refresh();
    onRefresh?.();
  }

  function onSaveSlack() {
    setSlackWebhook(slack);
    onLog?.(slack ? "Slack webhook saved (local only)" : "Slack webhook cleared");
  }

  return (
    <section className="border border-[#00FF88]/40 bg-black p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[#00FF88] font-bold text-sm tracking-wide font-mono">
            KILL SWITCH 2.0
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Cost over time · red zone · $10k spike · Slack · /api/kill
          </p>
        </div>
        {killed ? (
          <button
            type="button"
            onClick={async () => {
              await disarmKillSwitch();
              try {
                await fetch("/api/kill", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "disarm" }),
                });
              } catch {
                /* */
              }
              onLog?.("Kill switch DISARMED");
              await refresh();
              onRefresh?.();
            }}
            className="text-xs px-3 py-1.5 border border-red-500/50 bg-red-500/20 text-red-300 font-mono animate-pulse"
          >
            DISARM
          </button>
        ) : (
          <button
            type="button"
            onClick={async () => {
              await armKillSwitch("Manual arm from Kill Switch 2.0");
              try {
                await fetch("/api/kill", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "arm" }),
                });
              } catch {
                /* */
              }
              onLog?.("Kill switch ARMED");
              await refresh();
              onRefresh?.();
            }}
            className="text-xs px-3 py-1.5 border border-zinc-700 text-zinc-400 font-mono hover:border-red-500 hover:text-red-400"
          >
            ARM
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-bold tabular-nums text-white font-mono">
            ${(spend / 100).toFixed(2)}
            <span className="text-sm font-normal text-zinc-500">
              {" "}
              / ${(budget / 100).toFixed(0)}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {pct.toFixed(0)}% of budget
            {killed ? " · KILLED" : pct >= 80 ? " · RED ZONE" : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-zinc-500">$</span>
          <input
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            className="w-20 bg-[#111] border border-[#333] px-2 py-1 text-sm text-white font-mono"
          />
          <button
            type="button"
            onClick={onSaveBudget}
            className="text-xs px-2 py-1 border border-[#00FF88]/40 text-[#00FF88] font-mono"
          >
            Set
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onSpike}
            className="text-xs px-3 py-1.5 border border-[#ff0033] bg-[#ff0033]/15 text-[#ff0033] font-mono font-bold hover:bg-[#ff0033]/30 disabled:opacity-40"
          >
            Simulate $10k spike
          </button>
        </div>
      </div>

      <div className="relative border border-[#111] bg-[#050505] p-2">
        <svg
          viewBox={`0 0 ${chart.w} ${chart.h}`}
          className="w-full h-24"
          preserveAspectRatio="none"
        >
          <rect
            x={0}
            y={0}
            width={chart.w}
            height={Math.max(0, chart.zoneY)}
            fill="#ff0033"
            opacity={0.08}
          />
          <line
            x1={0}
            y1={chart.zoneY}
            x2={chart.w}
            y2={chart.zoneY}
            stroke="#ff0033"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.7}
          />
          {chart.path && (
            <path
              d={chart.path}
              fill="none"
              stroke={killed || pct >= 100 ? "#ff0033" : "#00FF88"}
              strokeWidth={2}
            />
          )}
        </svg>
        <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-600">
          budget line
        </div>
        {series.length < 2 && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-zinc-600 font-mono">
            Prove lock or spike to seed the graph
          </div>
        )}
      </div>

      <div className="h-1.5 bg-[#111] overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            killed || pct >= 100
              ? "bg-[#ff0033]"
              : pct >= 80
                ? "bg-amber-500"
                : "bg-[#00FF88]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {killed && (
        <p className="text-sm text-[#ff0033] font-mono">
          {cfg?.killReason || "Kill switch active — unlocks + proxy blocked"}
        </p>
      )}

      <div className="border-t border-[#111] pt-3 space-y-2">
        <label className="text-[11px] text-zinc-500 font-mono block">
          Slack webhook (optional · stored only in this browser)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={slack}
            onChange={(e) => setSlack(e.target.value)}
            className="flex-1 bg-[#111] border border-[#333] px-2 py-1.5 text-xs text-white font-mono"
          />
          <button
            type="button"
            onClick={onSaveSlack}
            className="text-xs px-3 py-1.5 border border-[#333] text-zinc-400 font-mono hover:border-[#00FF88] hover:text-[#00FF88]"
          >
            Save
          </button>
        </div>
      </div>
    </section>
  );
}
