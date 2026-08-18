"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BurnCard } from "@/components/BurnCard";
import { GhostCard } from "@/components/GhostCard";
import PayGateCard from "@/components/PayGateCard";
import LogRiverCard from "@/components/LogRiverCard";
import KillSwitchPro from "@/components/KillSwitchPro";
import VacuumTrapPanel from "@/components/VacuumTrapPanel";
import ProxyStatusCard from "@/components/ProxyStatusCard";
import BillingAggregatorCard from "@/components/BillingAggregatorCard";
import RotateAllButton from "@/components/RotateAllButton";
import GhostSonarCard from "@/components/GhostSonarCard";
import WebhookProxyCard from "@/components/WebhookProxyCard";
import RetryTrapCard from "@/components/RetryTrapCard";
import { getAggregatedBill } from "@/lib/billing-aggregator";
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
  listUsage,
  monthSpendCents,
  type RadarConfig,
  type UsageEvent,
} from "@/lib/cost-radar";
import { setAppBadge } from "@/lib/locks";

export default function Home() {
  const [keys, setKeys] = useState<KeyMeta[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const [cfg, setCfg] = useState<RadarConfig | null>(null);
  const [spend, setSpend] = useState(0);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [estBillCents, setEstBillCents] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setKeys(await listKeys());
      const c = await getRadarConfig();
      setCfg(c);
      setSpend(await monthSpendCents());
      setEvents(await listUsage(20));
      void setAppBadge(c.killed ? "KILLED" : null);
    } catch {
      setKeys([]);
    }
  }, []);

  useEffect(() => {
    void registerBridgeSW();
    void refresh();
    try {
      setEstBillCents(getAggregatedBill().totalCents);
    } catch {
      /* ignore */
    }
  }, [refresh]);

  const totalCalls = useMemo(
    () => keys.reduce((n, k) => n + (k.usageCount || 0), 0),
    [keys]
  );

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

  async function onGhostEnv(text: string) {
    setBusy(true);
    setStatus(null);
    try {
      const imported = await importEnvText(text);
      setStatus(`GHOST welded ${imported.length} key(s). Value never shown.`);
      await refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Ghost weld failed");
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

  return (
    <div className="flex flex-col flex-1 bg-black min-h-[100dvh]">
      <header className="border-b border-zinc-900 bg-black/95 backdrop-blur sticky top-0 z-10 safe-top">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
          <div className="font-bold text-lg sm:text-xl tracking-tight text-white">
            Bridge<span className="text-[#00FF88]">Control</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono">
            {cfg?.killed ? (
              <span className="text-[#ff0033] animate-pulse font-bold">KILLED</span>
            ) : (
              <span className="text-zinc-500">
                {totalCalls} · ${(spend / 100).toFixed(2)}
                {estBillCents > 0 && (
                  <span className="text-[#00FF88]/80"> · est ${(estBillCents / 100).toFixed(2)}/mo</span>
                )}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-3 sm:px-4 py-8 sm:py-12 max-w-3xl mx-auto w-full space-y-6 sm:space-y-10">
        <div className="border border-[#00FF88] bg-[#00FF88]/5 text-[#00FF88] text-center text-[10px] sm:text-xs font-mono font-bold tracking-widest py-2.5 uppercase">
          BLACK EDITION · 3% TAKE
        </div>

        <GhostCard onGhostEnv={onGhostEnv} onLog={(m) => setLog(m)} busy={busy} />

        <section className="text-center space-y-3">
          <p className="text-[#00FF88] text-xs sm:text-sm font-semibold font-mono">
            zero-trust · local-first · kill 2.0 · proxy
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Keys never leave.
            <br />
            <span className="text-[#00FF88]">Spend never surprises.</span>
          </h1>
          <p className="text-sm sm:text-lg text-zinc-400 max-w-xl mx-auto">
            Secret-slussen. Weld on-device. Lock exclusive. Kill graphs budget. Proxy meters 3%.
          </p>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
          {[
            { t: "Weld", d: "AES-GCM" },
            { t: "Lock", d: "Web Locks" },
            { t: "Kill 2.0", d: "$10k spike" },
            { t: "Proxy", d: "3% take" },
          ].map((f) => (
            <div key={f.t} className="border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
              <h3 className="font-semibold text-white text-xs sm:text-sm">{f.t}</h3>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5">{f.d}</p>
            </div>
          ))}
        </section>

        <BillingAggregatorCard onTotalChange={setEstBillCents} />

        <KillSwitchPro onLog={(m) => setLog(m)} onRefresh={refresh} />

        <VacuumTrapPanel onLog={(m) => setLog(m)} />

        <ProxyStatusCard />

        <GhostSonarCard />

        <WebhookProxyCard />

        <RetryTrapCard />

        {events.length > 0 && (
          <section className="border border-zinc-900 bg-zinc-950/80 p-3 sm:p-4">
            <h3 className="text-xs font-mono text-zinc-500 mb-2">Recent usage</h3>
            <ul className="space-y-1 max-h-28 overflow-y-auto">
              {events.map((e) => (
                <li key={e.id} className="text-[11px] font-mono text-zinc-500 flex justify-between gap-2">
                  <span className="truncate">{e.provider}{e.note ? ` · ${e.note}` : ""}</span>
                  <span className="shrink-0">~${(e.estimatedCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-white">Weld .env</h2>
            <RotateAllButton keyCount={keys.length || 47} disabled={busy} onDone={() => void refresh()} />
          </div>
          <div className="flex flex-col gap-3 mb-3">
            <button type="button" onClick={onImportFile} disabled={busy} className="min-h-12 w-full px-6 py-3 bg-[#00FF88] text-black font-bold text-sm disabled:opacity-50">
              {busy ? "Working…" : "Import .env"}
            </button>
            <p className="text-zinc-600 text-xs">Chrome / Edge · File System Access · eller klistra nedan</p>
          </div>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"STRIPE_SECRET_KEY=sk_test_...\nOPENAI_API_KEY=sk-..."} className="w-full h-28 bg-black border border-zinc-800 text-zinc-300 text-sm p-3 font-mono focus:outline-none focus:border-[#00FF88]" />
          <button type="button" onClick={onImportPaste} disabled={busy || !paste.trim()} className="mt-3 min-h-11 w-full sm:w-auto px-4 py-2.5 border border-zinc-700 text-zinc-300 text-sm hover:border-[#00FF88] disabled:opacity-40">
            Weld pasted keys
          </button>
          {status && <p className="mt-3 text-sm text-[#00FF88]">{status}</p>}
        </section>

        <section>
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3">Secured keys (this device)</h2>
          {keys.length === 0 ? (
            <p className="text-zinc-500 text-sm">No keys. Weld a .env.</p>
          ) : (
            <ul className="space-y-2">
              {keys.map((k) => (
                <li key={k.id} className="border border-zinc-800 bg-black px-3 sm:px-4 py-3 space-y-2">
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-200 truncate text-sm">{k.name}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">{k.provider} · {k.masked} · {k.usageCount}x</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onProve(k)} disabled={busy || !!cfg?.killed} className="min-h-10 flex-1 sm:flex-none text-xs px-3 py-2 bg-zinc-900 text-[#00FF88] border border-[#00FF88]/30 disabled:opacity-30">Prove lock</button>
                    <BurnCard keyId={k.id} keyName={k.name} disabled={busy} onLog={(m) => setLog(m)} onBurned={(msg) => { setLog(msg); void refresh(); }} />
                    <button type="button" onClick={async () => { await deleteKey(k.id); await refresh(); }} className="min-h-10 text-xs px-3 text-zinc-500 hover:text-red-400">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {log && (
            <pre className="mt-4 text-[11px] text-[#00FF88]/90 bg-zinc-950 border border-zinc-800 p-3 whitespace-pre-wrap font-mono break-words">{log}</pre>
          )}
        </section>

        <section className="border border-zinc-800 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-2 text-center">BridgeControl Black — $299/mo</h2>
          <p className="text-center text-xs sm:text-sm text-zinc-400 mb-4">Infrastructure · <span className="text-[#00FF88]">3% take</span> on proxied spend</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {[
              { name: "Core", price: "Free", d: "Weld · Lock · Kill local" },
              { name: "Black", price: "$299", d: "Proxy · Vacuum · Trap · 3%" },
              { name: "Team", price: "$999 + 3%", d: "org · audit · YubiKey later" },
            ].map((p) => (
              <div key={p.name} className="border border-zinc-800 bg-black p-4 text-center">
                <p className="text-zinc-400 text-xs">{p.name}</p>
                <p className="text-lg font-bold text-[#00FF88] my-1">{p.price}</p>
                <p className="text-[11px] text-zinc-500">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-[#00FF88]/30 pt-6 space-y-4">
          <div className="border border-[#00FF88] bg-[#00FF88]/5 p-3 text-center sm:text-left sm:flex sm:justify-between sm:items-center gap-2">
            <span className="text-[#00FF88] font-bold text-[10px] sm:text-xs tracking-widest block">BRIDGECONTROL BLACK · 3% TAKE</span>
            <span className="text-[#00FF88]/70 text-[10px] sm:text-xs block mt-1 sm:mt-0">/api/proxy · spend_ledger · kill gate</span>
          </div>
          <PayGateCard />
          <LogRiverCard />
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600 px-3">
        BridgeControl · keys never leave · 3% take · embed-ready for fred-platform /core
      </footer>
    </div>
  );
}
