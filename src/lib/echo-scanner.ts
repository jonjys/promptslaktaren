/**
 * Ghost Sonar — local scan for leaked keys (seeded demo; WebGPU-ready).
 */

export type GhostHit = {
  id: string;
  pattern: string;
  year: number;
  stillWorks: boolean;
  riskCents: number;
  source: string;
};

export type SonarResult = {
  scanned: number;
  ghosts: GhostHit[];
  liveCount: number;
  riskCents: number;
  at: number;
};

const SEED: GhostHit[] = [
  { id: "g1", pattern: "sk_live_…a3f2", year: 2023, stillWorks: true, riskCents: 120000, source: "git blob .env.prod" },
  { id: "g2", pattern: "sk-proj-…9Kx1", year: 2023, stillWorks: true, riskCents: 84000, source: "commit 4f2a…" },
  { id: "g3", pattern: "AKIA…W9P2", year: 2022, stillWorks: false, riskCents: 0, source: "ci secret scan miss" },
  { id: "g4", pattern: "sk_live_…b771", year: 2024, stillWorks: true, riskCents: 36000, source: "Slack paste archive" },
  { id: "g5", pattern: "ghp_…xx91", year: 2023, stillWorks: false, riskCents: 0, source: "repo fork" },
  { id: "g6", pattern: "sk_test_…dead", year: 2021, stillWorks: false, riskCents: 0, source: "old README" },
  { id: "g7", pattern: "xoxb-…991", year: 2023, stillWorks: true, riskCents: 12000, source: "export dump" },
  { id: "g8", pattern: "sk_live_…c0ff", year: 2020, stillWorks: false, riskCents: 0, source: "s3 public" },
  { id: "g9", pattern: "AIza…m2", year: 2023, stillWorks: false, riskCents: 0, source: "mobile APK" },
  { id: "g10", pattern: "sk-…legacy", year: 2019, stillWorks: false, riskCents: 0, source: "notebook" },
  { id: "g11", pattern: "rk_live_…11", year: 2023, stillWorks: true, riskCents: 18000, source: "stripe export" },
  { id: "g12", pattern: "sgp_…44", year: 2022, stillWorks: false, riskCents: 0, source: "email" },
  { id: "g13", pattern: "whsec_…zz", year: 2023, stillWorks: true, riskCents: 5000, source: "ngrok log" },
  { id: "g14", pattern: "sk_live_…99aa", year: 2023, stillWorks: true, riskCents: 45000, source: "docker layer" },
];

const BURNED_KEY = "bc-ghost-burned";

function burnedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(BURNED_KEY) || "[]") as string[]);
  } catch {
    return new Set();
  }
}

export async function runGhostSonar(onTick?: (n: number) => void): Promise<SonarResult> {
  const burned = burnedIds();
  let scanned = 0;
  const target = 240 + Math.floor(Math.random() * 40);
  for (let i = 0; i < 12; i++) {
    scanned = Math.min(target, scanned + Math.floor(target / 12));
    onTick?.(scanned);
    await new Promise((r) => setTimeout(r, 35));
  }
  scanned = target;
  onTick?.(scanned);
  const ghosts = SEED.filter((g) => !burned.has(g.id));
  const live = ghosts.filter((g) => g.stillWorks);
  return {
    scanned,
    ghosts,
    liveCount: live.length,
    riskCents: live.reduce((s, g) => s + g.riskCents, 0),
    at: Date.now(),
  };
}

export function burnGhosts(ids?: string[]): number {
  if (typeof window === "undefined") return 0;
  const burned = burnedIds();
  const toBurn = ids?.length ? ids : SEED.map((g) => g.id);
  toBurn.forEach((id) => burned.add(id));
  try {
    localStorage.setItem(BURNED_KEY, JSON.stringify([...burned]));
  } catch {
    /* ignore */
  }
  return toBurn.length;
}

export function formatRisk(cents: number): string {
  if (cents >= 100000) return `$${(cents / 100000).toFixed(1)}k`;
  return `$${(cents / 100).toFixed(0)}`;
}
