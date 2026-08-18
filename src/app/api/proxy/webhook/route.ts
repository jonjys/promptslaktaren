import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Webhook Proxy Provider
 * Accepts Stripe / Clerk / Resend (and friends) → dedupe by event_id
 * → fee header 2%. Retry queue is client Background Sync in real deploy.
 */

const FEE_BPS = 200; // 2%
const seen = new Map<string, number>();

function prune() {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [k, t] of seen) {
    if (t < cutoff) seen.delete(k);
  }
}

export async function POST(req: NextRequest) {
  prune();
  const provider =
    req.headers.get("x-bc-webhook-provider") ||
    req.headers.get("x-provider") ||
    "unknown";

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const eventId =
    (body.id as string) ||
    (body.event_id as string) ||
    req.headers.get("x-event-id") ||
    `anon-${Date.now()}`;

  if (seen.has(eventId)) {
    return NextResponse.json(
      {
        ok: true,
        deduped: true,
        eventId,
        provider,
        message: "Duplicate event_id — dropped by BridgeControl",
      },
      {
        status: 200,
        headers: {
          "X-BridgeControl-Fee": "2%",
          "X-BridgeControl-Dedupe": "1",
          "x-bc-fee-bps": String(FEE_BPS),
        },
      }
    );
  }

  seen.set(eventId, Date.now());

  return NextResponse.json(
    {
      ok: true,
      accepted: true,
      provider,
      eventId,
      feeBps: FEE_BPS,
      retry: { backgroundSync: true, maxAttempts: 5 },
      note: "Webhook accepted · 2% take · exclusive dedupe · retry-trap ready",
      retryTrap: true,
    },
    {
      status: 202,
      headers: {
        "X-BridgeControl-Fee": "2%",
        "x-bc-fee-bps": String(FEE_BPS),
        "x-bc-provider": provider,
      },
    }
  );
}

export async function GET() {
  return NextResponse.json({
    service: "bridgecontrol-webhook-proxy",
    fee: "2%",
    providers: ["stripe", "clerk", "resend", "github", "linear", "supabase", "custom"],
  });
}
