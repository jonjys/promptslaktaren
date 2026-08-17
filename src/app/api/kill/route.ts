import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Kill Switch control plane (metadata).
 * Client also keeps local IndexedDB kill state; this endpoint logs org-level events.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string; // arm | disarm | spike
  const budgetCents = Number(body.budgetCents) || 5000;
  const reason = (body.reason as string) || "manual";

  if (action === "spike") {
    const spendCents = 1_000_000; // $10k
    const killed = spendCents >= budgetCents;
    return NextResponse.json({
      ok: true,
      action: "spike",
      spendCents,
      budgetCents,
      status: killed ? "KILLED" : "ARMED",
      reason: killed
        ? `Budget $${(budgetCents / 100).toFixed(0)} hit by $10k spike`
        : reason,
      slack: { queued: true, mock: true },
    });
  }

  if (action === "disarm") {
    return NextResponse.json({
      ok: true,
      status: "DISARMED",
      slack: { queued: false },
    });
  }

  if (action === "arm") {
    return NextResponse.json({
      ok: true,
      status: "ARMED",
      reason,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({
    service: "bridgecontrol-kill",
    status: "ok",
  });
}
