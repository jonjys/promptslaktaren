"use client";
import PayGateCard from "@/components/PayGateCard"
import LogRiverCard from "@/components/LogRiverCard"
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  pickAndImportEnv,
  importEnvText,
  listKeys,
  deleteKey,
  type KeyMeta,
} from "@/lib/secure-store";
import { registerBridgeSW, proveLock } from "@/lib/bridge-client";
import {
  getRadarConfig,
  setMonthlyBudget,
  armKillSwitch,
  disarmKillSwitch,
  listUsage,
  monthSpendCents,
  type RadarConfig,
  type UsageEvent,
} from "@/lib/cost-radar";

export default function Home() {
  const [keys, setKeys] = useState<KeyMeta[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const [cfg, setCfg] = useState<RadarConfig | null>(null);
  const [spend, setSpend] = useState(0);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [budgetInput, setBudgetInput] = useState("50");

  const refresh = useCallback(async () => {
    try {
      setKeys(await listKeys());
      const c = await getRadarConfig();
      setCfg(c);
      setBudgetInput(String(c.monthlyBudgetCents / 100));
      setSpend(await monthSpendCents());
      setEvents(await listUsage(20));
    } catch {
      setKeys([]);
    }
  }, []);

  useEffect(() => {
    void registerBridgeSW();
    void refresh();
  }, [refresh]);

  const totalCalls = useMemo(
    () => keys.reduce((n, k) => n + (k.usageCount || 0), 0),
    [keys]
  );

  const budgetPct = cfg
    ? Math.min(100, (spend / Math.max(1, cfg.monthlyBudgetCents)) * 100)
    : 0;

  async function onImportFile() {
    setBusy(true);
    setStatus(null);
    try {
      const imported = await pickAndImportEnv();
      setStatus(`Welded ${imported.length} key(s). Never left this device.`);
      await refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function onImportPaste() {
    if (!paste.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const imported = await importEnvText(paste);
      setStatus(`Welded ${imported.length} key(s). Never left this device.`);
      setPaste("");
      await refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function onProve(k: KeyMeta) {
    setLog(null);
    setBusy(true);
    try {
      const r = await proveLock(k.id);
      setLog(
        r.autoKilled
          ? "AUTO-KILL · budget exceeded after this use"
          : `LOCKED OK · ${k.name} · ${r.ms}ms · len ${r.len} (hidden) · usage+1`
      );
      await refresh();
    } catch (e) {
      setLog(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveBudget() {
    const dollars = Number(budgetInput);
    if (Number.isNaN(dollars) || dollars < 0) return;
    await setMonthlyBudget(Math.round(dollars * 100));
    await refresh();
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="font-bold text-xl tracking-tight text-white">
            Bridge<span className="text-emerald-400">Control</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            {cfg?.killed ? (
              <span className="text-red-400 animate-pulse">KILL SWITCH ON</span>
            ) : (
              <span className="text-zinc-500">
                {totalCalls} uses · est ${(spend / 100).toFixed(2)}/mo
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full space-y-12">
        <section className="text-center">
          <p className="text-emerald-400 text-sm font-semibold mb-3">
            zero-trust · local-first · kill-switch
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Keys never leave.
            <br />
            <span className="text-emerald-400">Spend never surprises.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Weld every .env into an encrypted on-device store. Web Locks for
            exclusive use. CostRadar kills traffic when budget is hit. No secret
            on our servers.
          </p>
        </section>

        <section className="grid sm:grid-cols-3 gap-3 text-center">
          {[
            { t: "Weld", d: "Import .env to AES-GCM. Masked only." },
            { t: "Lock", d: "Web Locks. One process. ~50ms plaintext." },
            { t: "Kill", d: "Budget hit then all keys blocked locally." },
          ].map((f) => (
            <div
              key={f.t}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <h3 className="font-semibold text-white mb-1">{f.t}</h3>
              <p className="text-sm text-zinc-500">{f.d}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">CostRadar</h2>
            {cfg?.killed ? (
              <button
                type="button"
                onClick={async () => {
                  await disarmKillSwitch();
                  await refresh();
                  setLog("Kill switch disarmed");
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40"
              >
                Disarm kill switch
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await armKillSwitch("Manual arm");
                  await refresh();
                  setLog("Kill switch ARMED");
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-400"
              >
                Arm kill switch
              </button>
            )}
          </div>

          <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-white">
                ${(spend / 100).toFixed(2)}
                <span className="text-sm font-normal text-zinc-500">
                  {" "}/ ${(cfg?.monthlyBudgetCents || 0) / 100} budget
                </span>
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Local estimate meter. Card billing later.
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-zinc-500">$</span>
              <input
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-white"
              />
              <button
                type="button"
                onClick={onSaveBudget}
                className="text-xs px-2 py-1 rounded-lg bg-zinc-800 text-emerald-400"
              >
                Set
              </button>
            </div>
          </div>

          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all ${
                budgetPct >= 100
                  ? "bg-red-500"
                  : budgetPct >= 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>

          {cfg?.killed && (
            <p className="mt-3 text-sm text-red-400">
              {cfg.killReason || "Kill switch active"}
            </p>
          )}

          {events.length > 0 && (
            <ul className="mt-4 space-y-1 max-h-32 overflow-y-auto">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="text-xs font-mono text-zinc-500 flex justify-between gap-2"
                >
                  <span>
                    {e.provider} · {new Date(e.at).toLocaleTimeString()}
                  </span>
                  <span>~${(e.estimatedCents / 100).toFixed(3)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Weld .env in 10 seconds
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              type="button"
              onClick={onImportFile}
              disabled={busy}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold disabled:opacity-50"
            >
              {busy ? "Working…" : "Import .env"}
            </button>
            <span className="text-zinc-600 text-sm self-center">
              Chrome / Edge · File System Access
            </span>
          </div>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={"STRIPE_SECRET_KEY=sk_test_...\nOPENAI_API_KEY=sk-..."}
            className="w-full h-24 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm p-3 font-mono focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={onImportPaste}
            disabled={busy || !paste.trim()}
            className="mt-3 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-emerald-500 disabled:opacity-40"
          >
            Weld pasted keys
          </button>
          {status && <p className="mt-3 text-sm text-emerald-400">{status}</p>}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            Secured keys (this device only)
          </h2>
          {keys.length === 0 ? (
            <p className="text-zinc-500 text-sm">No keys. Weld a .env.</p>
          ) : (
            <ul className="space-y-2">
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-200 truncate">
                      {k.name}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                      {k.provider} · {k.masked} · {k.usageCount}x
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onProve(k)}
                      disabled={busy || !!cfg?.killed}
                      className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-emerald-400 disabled:opacity-30"
                    >
                      Prove lock
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteKey(k.id);
                        await refresh();
                      }}
                      className="text-xs text-zinc-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {log && (
            <pre className="mt-4 text-xs text-emerald-400/90 bg-zinc-900 border border-zinc-800 rounded-xl p-3 whitespace-pre-wrap">
              {log}
            </pre>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 text-center">
            Pricing (coming online)
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { name: "Indie", price: "99 kr", d: "5 keys · local radar" },
              {
                name: "Startup",
                price: "999 kr",
                d: "50 keys · audit · kill policies",
              },
              {
                name: "Enterprise",
                price: "9999 kr",
                d: "Unlimited · 2% take on proxied traffic",
              },
            ].map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-center"
              >
                <p className="text-zinc-400 text-sm">{p.name}</p>
                <p className="text-xl font-bold text-white my-1">{p.price}</p>
                <p className="text-xs text-zinc-500">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center text-xs text-zinc-600 pb-8">
          <p>
            Show HN: We stopped API key leaks by never letting the key leave the
            machine (Web Locks + File System Access + kill switch)
          </p>
        </section>
{/* BLACK EDITION */}
<div className="mt-8 border-t border-[#00FF88]/30 pt-6">
  <div className="border border-[#00FF88] bg-[#00FF88]/5 p-3 mb-4 flex justify-between items-center">
    <span className="text-[#00FF88] font-bold text-xs tracking-widest">BRIDGECONTROL BLACK - $299/MO</span>
    <span className="text- text-[#00FF88]/70">Includes Weld, Lock, Kill, Burn, Ghost, PayGate, River - 2% take</span>
  </div>
  <PayGateCard />
  <LogRiverCard />
</div>
      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-600">
        BridgeControl · Keys never leave · Spend never surprises
      </footer>
    </div>
  );
}
