import { NextResponse } from "next/server";
import { sumSpendByProvider } from "@/lib/supabase-server";
import { feeCents } from "@/lib/stripe";

export const runtime = "edge";

/** Aggregated spend from spend_ledger for Billing Aggregator header */
export async function GET() {
  const rows = await sumSpendByProvider("default");
  const totalCents = rows.reduce((s, r) => s + r.cost_cents, 0);
  return NextResponse.json({
    ok: true,
    providers: rows,
    totalCents,
    feeCents: feeCents(totalCents),
    takeBps: 300,
    source: rows.length ? "supabase" : "empty",
  });
}
