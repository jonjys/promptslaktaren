/**
 * Ghost – clipboard detection for env secrets.
 * Never returns or logs the secret value to the UI layer beyond opaque handling.
 */

export async function checkGhostClipboard(): Promise<string | null> {
  try {
    if (!navigator.clipboard?.readText) return null;
    const t = await navigator.clipboard.readText();
    if (!t || t.length < 12 || t.length > 20000) return null;
    if (
      t.includes("OPENAI_API_KEY=") ||
      t.includes("SUPABASE_") ||
      t.includes("ANTHROPIC_") ||
      t.includes("STRIPE_") ||
      t.includes("sk-") ||
      t.includes("sk_live") ||
      t.includes("sk_test") ||
      /^[A-Z_][A-Z0-9_]*=.+/m.test(t)
    ) {
      return t;
    }
  } catch {
    // permission / focus – silent
  }
  return null;
}

export function looksLikeEnv(text: string): boolean {
  return (
    /(?:API_KEY|SECRET|TOKEN|PASSWORD)\s*=/i.test(text) ||
    /^[A-Z_][A-Z0-9_]*=.+/m.test(text)
  );
}
