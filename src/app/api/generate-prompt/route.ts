import { NextResponse } from "next/server";

/** Dead route — PromptSlaktaren killed */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Gone. This is BridgeControl now." },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Gone. BridgeControl BLACK EDITION." },
    { status: 410 }
  );
}
