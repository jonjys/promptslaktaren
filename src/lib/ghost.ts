export async function checkGhostClipboard(): Promise<string|null>{
  try{
    const t = await navigator.clipboard.readText();
    if(t.includes("OPENAI_API_KEY=") || t.includes("SUPABASE_") || t.includes("sk-")) return t;
  }catch{}
  return null;
}
