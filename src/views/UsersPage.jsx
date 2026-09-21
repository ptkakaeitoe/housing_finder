"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
export default function UsersPage() {
  const admin = useAdmin();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { if (!admin) return; supabase.from("profiles").select("id,full_name,role,created_at").order("created_at", { ascending: false }).then(({ data, error: queryError }) => { setUsers(data ?? []); setError(queryError?.message ?? ""); }); }, [admin]);
  return <><main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-semibold tracking-tight text-ink">Users</h1>{admin === false && <p className="mt-8 text-muted">Admin access required.</p>}{error && <p role="alert" className="mt-5 text-accent">{error}</p>}{admin && <div className="mt-8 border-t border-line">{users.length === 0 && <p className="py-8 text-muted">No users yet.</p>}{users.map((user) => <div key={user.id} className="flex flex-wrap justify-between gap-3 border-b border-line py-5"><div><strong className="text-ink">{user.full_name || "Unnamed user"}</strong><p className="mt-1 text-xs text-muted">Joined {new Date(user.created_at).toLocaleDateString()}</p></div><span className="text-xs font-bold text-accent uppercase">{user.role}</span></div>)}</div>}</main></>;
}
