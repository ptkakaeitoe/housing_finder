"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export function useListings({ owner = false } = {}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");
  async function refresh() {
    if (!supabase) return;
    setLoading(true);
    let query = supabase.from("listings").select("*").order("created_at", { ascending: false });
    if (owner) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setListings([]); setLoading(false); return; }
      query = query.eq("landlord_id", user.id);
    } else query = query.eq("status", "published");
    const { data, error: queryError } = await query;
    setListings(data ?? []);
    setError(queryError?.message ?? "");
    setLoading(false);
  }
  useEffect(() => { refresh(); }, [owner]);
  return { listings, loading, error, refresh };
}
