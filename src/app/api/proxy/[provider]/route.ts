import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const TAKE_BPS = 300; // 3.00%

const UPSTREAM: Record<string, string> = {
  openai: "https://api.openai.com",
  stripe: "https://api.stripe.com",
  anthropic: "https://api.anthropic.com",
};

/**
 * BridgeControl Proxy Slussen
 * - Checks kill header / org status (mock: x-bc-killed)
 * - Meters request (3% take recorded in response headers)
 * - Does NOT accept plaintext customer keys in body (local unlock path is client SW)
 * - For demo: requires Authorization from client after local unlock
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  return handle(req, ctx);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  return handle(req, ctx);
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider } = await ctx.params;
  const killed = req.headers.get("x-bc-killed") === "1";
  if (killed) {
    return NextResponse.json(
      { error: "KILL_SWITCH", message: "Org killed — proxy blocked" },
      { status: 402 }
    );
  }

  const base = UPSTREAM[provider];
  if (!base) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  // Demo metering: estimate cost from path
  const costCents = provider === "openai" ? 2 : provider === "anthropic" ? 3 : 0.5;
  const feeCents = Math.max(0.01, (costCents * TAKE_BPS) / 10000);

  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No Authorization. Unlock key locally under Web Lock, then call proxy with short-lived header.",
        metered: { costCents, feeCents, takeBps: TAKE_BPS },
      },
      { status: 401 }
    );
  }

  // Trap detection
  if (auth.includes("sk_test_trap_")) {
    return NextResponse.json(
      {
        trap: true,
        message: "Trap Triggered — honeypot key used",
        logged: true,
      },
      { status: 451 }
    );
  }

  // Demo: do not forward real upstream without org vault (keeps zero-trust story)
  return NextResponse.json(
    {
      ok: true,
      provider,
      proxy: "bridgecontrol",
      metered: {
        costCents,
        feeCents,
        takeBps: TAKE_BPS,
        takeRate: "3%",
      },
      note: "Demo response — wire Edge secret vault for live upstream forward",
    },
    {
      status: 200,
      headers: {
        "x-bc-fee-cents": String(feeCents),
        "x-bc-take-bps": String(TAKE_BPS),
      },
    }
  );
}
