import { NextRequest, NextResponse } from "next/server";
import { feeCents, TAKE_BPS, meterHeaders } from "@/lib/stripe";

export const runtime = "edge";

const UPSTREAM: Record<string, string> = {
  openai: "https://api.openai.com",
  stripe: "https://api.stripe.com",
  anthropic: "https://api.anthropic.com",
};

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

  if (req.headers.get("x-bc-killed") === "1") {
    return NextResponse.json(
      { error: "KILL_SWITCH", message: "Org killed — proxy blocked" },
      { status: 402 }
    );
  }

  const base = UPSTREAM[provider];
  if (!base) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const costCents =
    provider === "openai" ? 2 : provider === "anthropic" ? 3 : 0.5;
  const fee = feeCents(costCents);

  const auth = req.headers.get("authorization") || "";
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

  if (!auth) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No Authorization. Unlock key locally under Web Lock, then call proxy.",
        metered: { costCents, feeCents: fee, takeBps: TAKE_BPS },
      },
      { status: 401, headers: meterHeaders(costCents) }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      provider,
      proxy: "bridgecontrol",
      metered: {
        costCents,
        feeCents: fee,
        takeBps: TAKE_BPS,
        takeRate: "3%",
      },
      note: "Demo response — Edge secret vault for live upstream next",
    },
    { status: 200, headers: meterHeaders(costCents) }
  );
}
