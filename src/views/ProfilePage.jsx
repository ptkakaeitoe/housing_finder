"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, requireSupabase } from "../lib/supabase";
import HomePage from "./HomePage";
import StudentPage from "./StudentPage";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { if (!supabase) return; (async () => { const { data: { user: current } } = await supabase.auth.getUser(); setUser(current); if (current) { const { data } = await supabase.from("profiles").select("full_name,role").eq("id", current.id).single(); setName(data?.full_name ?? ""); setRole(data?.role ?? ""); } })(); }, []);
  async function save(event) { event.preventDefault(); const { error } = await requireSupabase().from("profiles").update({ full_name: name.trim() }).eq("id", user.id); setMessage(error?.message ?? "Profile saved."); }
  async function signOut() { await requireSupabase().auth.signOut(); router.push("/"); router.refresh(); }
  return <main><section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12"><h1 className="text-4xl font-semibold tracking-tight text-ink">Profile</h1>{!user ? <p className="mt-8 border-t border-line py-6 text-muted">Please <Link href="/login" className="font-semibold text-accent">sign in</Link> to see your profile.</p> : <form onSubmit={save} className="mt-8 grid max-w-xl gap-5 border-t border-line pt-6"><p className="text-sm text-muted">{user.email} · {role}</p><label className="text-sm font-semibold text-ink">Full name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base" /></label>{message && <p role="status" className="text-sm text-accent">{message}</p>}<div className="flex flex-wrap items-center gap-5"><button className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas">Save changes</button><button type="button" onClick={signOut} className="text-sm font-semibold text-muted hover:text-accent">Sign out</button></div></form>}</section>{role === "student" && <StudentPage />}{user && <HomePage />}</main>;
}
