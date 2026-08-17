import { NextResponse } from "next/server";

export const runtime = "edge";

/** Vacuum is primarily client-side; this endpoint acknowledges scan metadata only */
export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Vacuum runs on-device. Server stores only aggregate counts if configured.",
    surfaces: ["clipboard", "local-files", "vercel-env(mock)", "browser-storage(mock)"],
  });
}
