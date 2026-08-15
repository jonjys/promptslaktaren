"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  pickAndImportEnv,
  importEnvText,
  listKeys,
  deleteKey,
  type KeyMeta,
} from "@/lib/secure-store";
import { registerBridgeSW, proxyUrl } from "@/lib/bridge-client";

export default function Home() {
  const [keys, setKeys] = useState<KeyMeta[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [proxyLog, setProxyLog] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setKeys(await listKeys());
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
      setStatus(`Imported ${imported.length} key(s). Values stay on this device.`);
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
      setStatus(`Imported ${imported.length} key(s). Values stay on this device.`);
      setPaste("");
      await refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    await deleteKey(id);
    await refresh();
  }

  async function onTestProxy(k: KeyMeta) {
    setProxyLog(null);
    setBusy(true);
    try {
      // Stripe balance is a cheap authenticated read when key is valid
      const path =
        k.provider === "stripe"
          ? "v1/balance"
          : k.provider === "openai"
            ? "v1/models"
            : "";
      if (!path) {
        setProxyLog("No demo path for this provider yet.");
        return;
      }
      const url = proxyUrl(k.provider, k.id, path);
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      setProxyLog(
        `${k.provider} → ${res.status} · ${text.slice(0, 180)}${text.length > 180 ? "…" : ""}`
      );
      await refresh();
    } catch (e) {
      setProxyLog(e instanceof Error ? e.message : "Proxy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-white">
            Bridge<span className="text-emerald-400">Control</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {totalCalls} proxied calls · local only
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 py-16 max-w-3xl mx-auto w-full">
        <section className="text-center mb-14">
          <p className="text-emerald-400 text-sm font-semibold tracking-wide mb-3">
            🔒 + 🌉
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Your .env file is a liability.
            <br />
            <span className="text-emerald-400">We fixed it.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Your API keys never leave your machine. Zero-trust local proxy with
            Web Locks + File System Access. Usage metered. No key on our servers.
          </p>
        </section>

        <section className="grid sm:grid-cols-3 gap-4 mb-12 text-center">
          {[
            { t: "Zero-leak", d: "Encrypted on-device. Never uploaded." },
            { t: "Locked use", d: "Web Locks: one process per key." },
            {
              t: "Usage meter",
              d:
                totalCalls > 0
                  ? `${totalCalls} calls on this device`
                  : "See cost before the bill hits.",
            },
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

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            Connect .env in 10 seconds
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={onImportFile}
              disabled={busy}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold disabled:opacity-50 transition"
            >
              {busy ? "Working…" : "Import .env"}
            </button>
            <span className="text-zinc-600 text-sm self-center">
              Chrome / Edge · File System Access API
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-2">
            Or paste .env content (fallback):
          </p>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={"STRIPE_SECRET_KEY=sk_test_...\nOPENAI_API_KEY=sk-..."}
            className="w-full h-28 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm p-3 font-mono focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={onImportPaste}
            disabled={busy || !paste.trim()}
            className="mt-3 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-emerald-500 disabled:opacity-40"
          >
            Import pasted keys
          </button>
          {status && (
            <p className="mt-3 text-sm text-emerald-400/90">{status}</p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            Secured keys on this device
          </h2>
          {keys.length === 0 ? (
            <p className="text-zinc-500 text-sm">No keys yet. Import a .env.</p>
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
                      {k.provider} · {k.masked} · used {k.usageCount}×
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {(k.provider === "stripe" || k.provider === "openai") && (
                      <button
                        onClick={() => onTestProxy(k)}
                        disabled={busy}
                        className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-emerald-400 hover:bg-zinc-700 disabled:opacity-40"
                      >
                        Test proxy
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(k.id)}
                      className="text-xs text-zinc-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {proxyLog && (
            <pre className="mt-4 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
              {proxyLog}
            </pre>
          )}
          <p className="mt-4 text-xs text-zinc-600">
            Plaintext values are never shown. Decrypt happens only under Web Lock
            for a single proxied request. Network tab should show no secret on our
            origin — only Authorization to the upstream host via SW.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-600">
        BridgeControl · Your API keys never leave your machine.
      </footer>
    </div>
  );
}
