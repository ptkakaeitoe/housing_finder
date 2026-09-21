"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
export function useAdmin() {
  const [admin, setAdmin] = useState(null);
  useEffect(() => {
    if (!supabase) { setAdmin(false); return; }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAdmin(false); return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setAdmin(data?.role === "admin");
    })();
  }, []);
  return admin;
}
