/**
 * Vacuum — local surfaces scanner (no server secrets)
 * Scans clipboard + optional file picks + mock surfaces.
 */

export type VacuumHit = {
  surface: string;
  count: number;
  samples: string[]; // masked only
};

function mask(v: string): string {
  if (v.length <= 8) return "****";
  return `${v.slice(0, 3)}…${v.slice(-3)}`;
}

function extractSecrets(text: string): string[] {
  const found: string[] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    if (/^[A-Z_][A-Z0-9_]*=.+/.test(t) || /sk[-_][a-zA-Z0-9]{8,}/.test(t)) {
      const eq = t.indexOf("=");
      const val = eq > 0 ? t.slice(eq + 1).trim() : t;
      found.push(mask(val.replace(/^['"]|['"]$/g, "")));
    }
  }
  return found;
}

export async function runVacuum(opts?: {
  fileTexts?: string[];
}): Promise<{ hits: VacuumHit[]; total: number; ms: number }> {
  const t0 = performance.now();
  const hits: VacuumHit[] = [];

  // Clipboard
  try {
    if (navigator.clipboard?.readText) {
      const clip = await navigator.clipboard.readText();
      const samples = extractSecrets(clip);
      if (samples.length) {
        hits.push({ surface: "clipboard", count: samples.length, samples: samples.slice(0, 5) });
      }
    }
  } catch {
    /* permission */
  }

  // Dropped / selected files content (caller passes text)
  if (opts?.fileTexts?.length) {
    let n = 0;
    const samples: string[] = [];
    for (const text of opts.fileTexts) {
      const s = extractSecrets(text);
      n += s.length;
      samples.push(...s.slice(0, 3));
    }
    if (n) hits.push({ surface: "local-files", count: n, samples: samples.slice(0, 8) });
  }

  // Mock surfaces (demo paranoia)
  hits.push({
    surface: "vercel-env (mock)",
    count: 3,
    samples: ["sk-…mock1", "sk_live…xx", "eyJ…svc"],
  });
  hits.push({
    surface: "browser-storage (mock)",
    count: 2,
    samples: ["sb-…anon", "pk_test…"],
  });

  const total = hits.reduce((s, h) => s + h.count, 0);
  // simulate 11s vacuum drama in UI via progress; actual work is fast
  const ms = Math.round(performance.now() - t0);
  return { hits, total, ms };
}
