import { NextResponse } from "next/server";
import { hasSupabase } from "@/lib/supabase-server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "bridgecontrol",
    product: "BridgeControl BLACK",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    supabase: hasSupabase(),
    features: [
      "weld",
      "lock",
      "kill2",
      "proxy",
      "vacuum",
      "trap",
      "retry-trap",
      "webhook-proxy",
      "billing-aggregator",
      "ghost-sonar",
      "rotate-all",
    ],
    embed: {
      frameAncestors: [
        "https://fred-platform.vercel.app",
        "https://*.vercel.app",
      ],
    },
    at: new Date().toISOString(),
  });
}
