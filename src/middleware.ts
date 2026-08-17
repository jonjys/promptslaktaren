import { NextRequest, NextResponse } from "next/server";

/**
 * Edge kill-gate + trap detection for /api/proxy/*
 * Client should send x-bc-killed: 1 when local kill switch is on.
 */
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (!path.startsWith("/api/proxy")) {
    return NextResponse.next();
  }

  // Kill switch from client header (local state → edge gate)
  if (req.headers.get("x-bc-killed") === "1") {
    return NextResponse.json(
      {
        error: "KILL_SWITCH",
        message: "Org killed — proxy blocked by BridgeControl middleware",
      },
      { status: 402 }
    );
  }

  // Honeypot trap in Authorization
  const auth = req.headers.get("authorization") || "";
  if (auth.includes("sk_test_trap_")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    return NextResponse.json(
      {
        trap: true,
        message: "Trap Triggered — honeypot key",
        ip,
        at: new Date().toISOString(),
      },
      { status: 451 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/proxy/:path*"],
};
