"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BurnCard } from "@/components/BurnCard";
import { GhostCard } from "@/components/GhostCard";
import PayGateCard from "@/components/PayGateCard";
import LogRiverCard from "@/components/LogRiverCard";
import KillSwitchPro from "@/components/KillSwitchPro";
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

export default function Home() {
  const [keys, setKeys] = useState<KeyMeta[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const [cfg, setCfg] = useState<RadarConfig | null>(null);
  const [spend, setSpend] = useState(0);
  const [events, setEvents] = useState<UsageEvent[]>([]);

  const refresh = useCallback(async () => {
    try {
      setKeys(await listKeys());
      const c = await getRadarConfig();
      setCfg(c);
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
    <div className="flex flex-col flex-1 bg-black">
      <header className="border-b border-zinc-900 bg-black/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="font-bold text-xl tracking-tight text-white">
            Bridge<span className="text-[#00FF88]">Control</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            {cfg?.killed ? (
              <span className="text-[#ff0033] animate-pulse">KILL SWITCH ON</span>
            ) : (
              <span className="text-zinc-500">
                {totalCalls} uses · est ${(spend / 100).toFixed(2)}/mo
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full space-y-10">
        <div className="border border-[#00FF88] bg-[#00FF88]/5 text-[#00FF88] text-center text-xs font-mono font-bold tracking-widest py-2 uppercase">
          BLACK EDITION — KILL SWITCH 2.0
        </div>

        <GhostCard onGhostEnv={onGhostEnv} onLog={(m) => setLog(m)} busy={busy} />

        <section className="text-center">
          <p className="text-[#00FF88] text-sm font-semibold mb-3 font-mono">
            zero-trust · local-first · kill-switch 2.0
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Keys never leave.
            <br />
            <span className="text-[#00FF88]">Spend never surprises.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Weld every .env into an encrypted on-device store. Web Locks for
            exclusive use. Kill Switch 2.0 graphs cost and blocks at budget —
            including a $10k spike simulator.
          </p>
        </section>

        <section className="grid sm:grid-cols-3 gap-3 text-center">
          {[
            { t: "Weld", d: "Import .env to AES-GCM. Masked only." },
            { t: "Lock", d: "Web Locks. One process. ~50ms plaintext." },
            { t: "Kill 2.0", d: "Chart · $10k spike · Slack alert." },
          ].map((f) => (
            <div
              key={f.t}
              className="border border-zinc-800 bg-zinc-950 p-5"
            >
              <h3 className="font-semibold text-white mb-1">{f.t}</h3>
              <p className="text-sm text-zinc-500">{f.d}</p>
            </div>
          ))}
        </section>

        <KillSwitchPro onLog={(m) => setLog(m)} onRefresh={refresh} />

        {events.length > 0 && (
          <section className="border border-zinc-900 bg-zinc-950/80 p-4">
            <h3 className="text-xs font-mono text-zinc-500 mb-2">Recent usage</h3>
            <ul className="space-y-1 max-h-28 overflow-y-auto">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="text-xs font-mono text-zinc-500 flex justify-between gap-2"
                >
                  <span>
                    {e.provider}
                    {e.note ? ` · ${e.note}` : ""} ·{" "}
                    {new Date(e.at).toLocaleTimeString()}
                  </span>
                  <span>~${(e.estimatedCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Weld .env in 10 seconds
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              type="button"
              onClick={onImportFile}
              disabled={busy}
              className="px-6 py-3 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black font-bold disabled:opacity-50"
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
            className="w-full h-24 bg-black border border-zinc-800 text-zinc-300 text-sm p-3 font-mono focus:outline-none focus:border-[#00FF88]"
          />
          <button
            type="button"
            onClick={onImportPaste}
            disabled={busy || !paste.trim()}
            className="mt-3 px-4 py-2 border border-zinc-700 text-zinc-300 text-sm hover:border-[#00FF88] disabled:opacity-40"
          >
            Weld pasted keys
          </button>
          {status && <p className="mt-3 text-sm text-[#00FF88]">{status}</p>}
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-zinc-800 bg-black px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-200 truncate">
                      {k.name}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                      {k.provider} · {k.masked} · {k.usageCount}x
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onProve(k)}
                      disabled={busy || !!cfg?.killed}
                      className="text-xs px-3 py-1.5 bg-zinc-900 text-[#00FF88] border border-[#00FF88]/30 disabled:opacity-30"
                    >
                      Prove lock
                    </button>
                    <BurnCard
                      keyId={k.id}
                      keyName={k.name}
                      disabled={busy}
                      onLog={(m) => setLog(m)}
                      onBurned={(msg) => {
                        setLog(msg);
                        void refresh();
                      }}
                    />
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
            <pre className="mt-4 text-xs text-[#00FF88]/90 bg-zinc-950 border border-zinc-800 p-3 whitespace-pre-wrap font-mono">
              {log}
            </pre>
          )}
        </section>

        <section className="border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 text-center">
            BridgeControl Black — $299/mo
          </h2>
          <p className="text-center text-sm text-zinc-400 mb-4">
            Includes Weld, Lock, Kill 2.0, Burn, Ghost, PayGate, River — 2% take
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { name: "Core", price: "Free", d: "Weld · Lock · Kill · local only" },
              {
                name: "Black",
                price: "$299",
                d: "Burn · Ghost · PayGate · River · Kill 2.0",
              },
              {
                name: "Team",
                price: "$999 + 2%",
                d: "metadata share · audit · YubiKey later",
              },
            ].map((p) => (
              <div
                key={p.name}
                className="border border-zinc-800 bg-black p-4 text-center"
              >
                <p className="text-zinc-400 text-sm">{p.name}</p>
                <p className="text-xl font-bold text-[#00FF88] my-1">{p.price}</p>
                <p className="text-xs text-zinc-500">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center text-xs text-zinc-600 pb-4">
          <p>
            Show HN: We built Datadog + 1Password + ngrok + Stripe for localhost
            — keys never leave
          </p>
        </section>

        <div className="mt-4 border-t border-[#00FF88]/30 pt-6">
          <div className="border border-[#00FF88] bg-[#00FF88]/5 p-3 mb-4 flex flex-wrap justify-between items-center gap-2">
            <span className="text-[#00FF88] font-bold text-xs tracking-widest">
              BRIDGECONTROL BLACK - $299/MO
            </span>
            <span className="text-[#00FF88]/70 text-xs">
              Weld, Lock, Kill 2.0, Burn, Ghost, PayGate, River — 2% take
            </span>
          </div>
          <PayGateCard />
          <LogRiverCard />
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-8 text-center text-sm text-zinc-600">
        BridgeControl Black · Kill Switch 2.0 · Keys never leave
      </footer>
    </div>
  );
}
