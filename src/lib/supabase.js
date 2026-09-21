import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);
export const supabase = isSupabaseConfigured ? createClient(url, key) : null;

export function requireSupabase() {
  if (!supabase) throw new Error("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.");
  return supabase;
}

export function listingImageUrl(path) {
  if (path?.startsWith("/images/")) return path;
  if (!path || !supabase) return "/images/housing-placeholder.jpg";
  return supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
}
