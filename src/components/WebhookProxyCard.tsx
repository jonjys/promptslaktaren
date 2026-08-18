"use client";

import { useState } from "react";

const PROVIDERS = ["stripe", "clerk", "resend", "github", "linear", "supabase", "custom"] as const;

export default function WebhookProxyCard() {
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("stripe");
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [eventId, setEventId] = useState(() => `evt_demo_${Date.now()}`);

  async function fire(dedupe: boolean) {
    setBusy(true);
    setOut(null);
    try {
      const id = dedupe ? eventId : `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      if (!dedupe) setEventId(id);
      const res = await fetch("/api/proxy/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bc-webhook-provider": provider,
          "x-event-id": id,
        },
        body: JSON.stringify({ id, type: `${provider}.test`, data: { mock: true } }),
      });
      const json = await res.json().catch(() => ({}));
      const fee = res.headers.get("X-BridgeControl-Fee") || "?";
      setOut(`${res.status} · fee ${fee} · ${JSON.stringify(json).slice(0, 220)}`);
    } catch (e) {
      setOut(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-[#333] bg-black p-4 space-y-3">
      <div>
        <h2 className="text-[#00FF88] font-bold text-sm font-mono">WEBHOOK PROXY</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">7 providers → one endpoint · dedupe · 2% fee · retry-ready</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {PROVIDERS.map((p) => (
          <button key={p} type="button" onClick={() => setProvider(p)} className={`text-[10px] px-2 py-1 font-mono border ${provider === p ? "border-[#00FF88] text-[#00FF88]" : "border-[#333] text-zinc-500"}`}>{p}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={() => void fire(false)} className="min-h-11 border border-[#00FF88]/40 text-[#00FF88] text-xs font-mono font-bold disabled:opacity-40">Send event</button>
        <button type="button" disabled={busy} onClick={() => void fire(true)} className="min-h-11 border border-[#333] text-zinc-400 text-xs font-mono disabled:opacity-40">Resend same id (dedupe)</button>
      </div>
      {out && <pre className="text-[10px] font-mono text-zinc-400 bg-[#050505] border border-[#111] p-2 overflow-x-auto whitespace-pre-wrap break-all">{out}</pre>}
    </section>
  );
}
