"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

// Tracks the current student's saved listing ids so cards can show a filled
// heart without each one querying Supabase separately.
export function useSavedListings() {
  const [savedIds, setSavedIds] = useState(new Set());
  const [userId, setUserId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (!user) { setReady(true); return; }
      const { data } = await supabase.from("saved_listings").select("listing_id").eq("student_id", user.id);
      setSavedIds(new Set((data ?? []).map((row) => row.listing_id)));
      setReady(true);
    });
  }, []);

  const toggle = useCallback(async (listingId) => {
    if (!supabase || !userId) return;
    const wasSaved = savedIds.has(listingId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      wasSaved ? next.delete(listingId) : next.add(listingId);
      return next;
    });
    const query = wasSaved
      ? supabase.from("saved_listings").delete().eq("listing_id", listingId).eq("student_id", userId)
      : supabase.from("saved_listings").insert({ listing_id: listingId, student_id: userId });
    const { error } = await query;
    if (error) setSavedIds((prev) => {
      const next = new Set(prev);
      wasSaved ? next.add(listingId) : next.delete(listingId);
      return next;
    });
  }, [savedIds, userId]);

  return { savedIds, toggle, ready, userId, signedIn: Boolean(userId) };
}
