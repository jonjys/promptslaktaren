"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listRetryQueue,
  enqueueRetry,
  processDueRetries,
  clearRetry,
  pendingCount,
  type RetryEvent,
} from "@/lib/retry-trap";

export default function RetryTrapCard() {
  const [queue, setQueue] = useState<RetryEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setQueue(listRetryQueue());
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  async function seedDemo() {
    enqueueRetry({
      provider: "stripe",
      path: "/api/proxy/webhook",
      status: 502,
      reason: "upstream_5xx",
      maxAttempts: 5,
    });
    enqueueRetry({
      provider: "openai",
      path: "/api/proxy/openai",
      status: 451,
      reason: "trap",
      trapKey: "sk_test_trap_demo",
      maxAttempts: 1,
    });
    enqueueRetry({
      provider: "openai",
      path: "/api/proxy/openai",
      status: 402,
      reason: "kill",
      maxAttempts: 3,
    });
    setMsg(`Queued demo failures · pending ${pendingCount()}`);
    refresh();
  }

  async function runRetries() {
    setBusy(true);
    setMsg(null);
    try {
      const n = await processDueRetries(5);
      setMsg(n ? `Processed ${n} retry(s)` : "No due retries");
      refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  }

  const pending = queue.filter((e) => e.attempts < e.maxAttempts).length;

  return (
    <section className="border border-[#ff0033]/40 bg-black p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[#ff0033] font-bold text-sm font-mono tracking-wide">
            RETRY-TRAP
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Failed proxy/webhook queue · trap never re-fires · Background Sync
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {pending} pending
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={seedDemo}
          className="min-h-11 border border-[#333] text-zinc-400 text-xs font-mono"
        >
          Seed demo fails
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runRetries()}
          className="min-h-11 border border-[#ff0033]/50 bg-[#ff0033]/10 text-[#ff0033] text-xs font-mono font-bold disabled:opacity-40"
        >
          {busy ? "Retrying…" : "Process due"}
        </button>
        <button
          type="button"
          onClick={() => {
            clearRetry();
            refresh();
            setMsg("Queue cleared");
          }}
          className="min-h-11 border border-[#333] text-zinc-500 text-xs font-mono"
        >
          Clear queue
        </button>
      </div>
      {msg && (
        <p className="text-[11px] font-mono text-zinc-300 border border-[#111] bg-[#050505] p-2">
          {msg}
        </p>
      )}
      {queue.length > 0 && (
        <ul className="max-h-36 overflow-y-auto space-y-1 text-[10px] font-mono text-zinc-500">
          {queue.slice(0, 12).map((e) => (
            <li
              key={e.id}
              className="flex justify-between gap-2 border-b border-[#111] py-1"
            >
              <span>
                {e.provider} · {e.reason} · {e.status}
              </span>
              <span
                className={
                  e.attempts >= e.maxAttempts
                    ? "text-[#ff0033]"
                    : "text-[#00FF88]"
                }
              >
                {e.attempts}/{e.maxAttempts}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
