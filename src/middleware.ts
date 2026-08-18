import { NextRequest, NextResponse } from "next/server";

/**
 * Edge kill-gate + trap + rate limit for /api/proxy/*
 * Client sends x-bc-killed: 1 when local kill switch is on.
 * Rate limit: 100 req/min per IP (edge memory — demo; production = KV).
 */

const RATE_LIMIT = 100;
const WINDOW_MS = 60_000;
const buckets = new Map<string, { n: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || now > b.reset) {
    b = { n: 0, reset: now + WINDOW_MS };
    buckets.set(ip, b);
  }
  b.n += 1;
  return b.n > RATE_LIMIT;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (!path.startsWith("/api/proxy")) {
    return NextResponse.next();
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      {
        error: "RATE_LIMIT",
        message: "BridgeControl edge: 100 req/min exceeded",
        ip,
      },
      {
        status: 429,
        headers: { "Retry-After": "60", "X-BridgeControl-Limit": "100/min" },
      }
    );
  }

  if (req.headers.get("x-bc-killed") === "1") {
    return NextResponse.json(
      {
        error: "KILL_SWITCH",
        message: "Org killed — proxy blocked by BridgeControl middleware",
      },
      { status: 402 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  if (auth.includes("sk_test_trap_")) {
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
