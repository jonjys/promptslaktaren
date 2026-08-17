import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "drop") {
    const id = crypto.randomUUID().slice(0, 8);
    const honeypotKey = `sk_test_trap_${id}_${Math.random().toString(36).slice(2, 10)}`;
    return NextResponse.json({
      ok: true,
      trap: {
        id,
        honeypotKey,
        provider: body.provider || "openai",
        note: "Plant this in a decoy .env / repo. Calls hit /api/proxy and return 451.",
      },
    });
  }

  if (action === "trigger") {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    return NextResponse.json({
      ok: true,
      triggered: true,
      ip,
      at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ error: "action=drop|trigger required" }, { status: 400 });
}
