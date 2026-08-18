"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAggregatedBill,
  addProviderSpend,
  hydrateFromApi,
  formatUsd,
  type AggregatedBill,
  type ProviderId,
} from "@/lib/billing-aggregator";

type Props = {
  onTotalChange?: (totalCents: number) => void;
};

export default function BillingAggregatorCard({ onTotalChange }: Props) {
  const [bill, setBill] = useState<AggregatedBill | null>(null);

  const refresh = useCallback(() => {
    void (async () => {
      const remote = await hydrateFromApi();
      const b = remote || getAggregatedBill();
      setBill(b);
      onTotalChange?.(b.totalCents);
    })();
  }, [onTotalChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function bump(id: ProviderId, delta: number) {
    const b = addProviderSpend(id, delta);
    setBill(b);
    onTotalChange?.(b.totalCents);
  }

  if (!bill) return null;

  return (
    <section className="border border-[#00FF88]/40 bg-black p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[#00FF88] font-bold text-sm font-mono tracking-wide">
            BILLING AGGREGATOR
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Stripe · OpenAI · AWS · Vercel → one number · 3% take
          </p>
        </div>
        <div className="text-right font-mono">
          <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
            {formatUsd(bill.totalCents)}
            <span className="text-xs text-zinc-500 font-normal"> /mo est</span>
          </div>
          <div className="text-[11px] text-[#00FF88]">
            fee {formatUsd(bill.feeCents)} · {(bill.takeBps / 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {bill.providers.map((p) => (
          <div
            key={p.id}
            className="border border-[#222] bg-[#050505] p-3 space-y-2"
          >
            <div className="text-[10px] text-zinc-500 font-mono uppercase">
              {p.label}
            </div>
            <div className="text-sm font-bold text-white font-mono tabular-nums">
              {formatUsd(p.cents)}
            </div>
            <div className="text-[9px] text-zinc-600">{p.source}</div>
            <button
              type="button"
              onClick={() => bump(p.id, 100)}
              className="w-full min-h-8 text-[10px] border border-[#333] text-zinc-400 font-mono hover:border-[#00FF88] hover:text-[#00FF88]"
            >
              +$1
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
