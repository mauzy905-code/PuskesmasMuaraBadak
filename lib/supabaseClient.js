import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../supabase.config.js";

let cached = null;

export async function getSupabase() {
  const url = String(SUPABASE_URL || "").trim();
  const key = String(SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) return null;
  if (cached) return cached;

  const mod = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  cached = mod.createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return cached;
}
