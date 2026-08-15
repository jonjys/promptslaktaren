import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "PromptSlaktaren is dead. Use BridgeControl." },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Gone" },
    { status: 410 }
  );
}
