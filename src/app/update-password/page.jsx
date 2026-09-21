"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requireSupabase } from "../../lib/supabase";
export default function UpdatePasswordPage() {
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(event) {
    event.preventDefault();
    try {
      const password = new FormData(event.currentTarget).get("password");
      const { error } = await requireSupabase().auth.updateUser({ password });
      if (error) throw error;
      router.push("/profile");
    } catch (cause) { setMessage(cause.message); }
  }
  return <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-5"><h1 className="text-4xl font-semibold tracking-tight text-ink">New password</h1><form onSubmit={submit} className="mt-8 grid gap-5 border-t border-line pt-6"><label className="text-sm font-semibold text-ink">New password<input name="password" type="password" minLength="8" required className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base" /></label>{message && <p role="alert" className="text-accent">{message}</p>}<button className="min-h-12 rounded-full bg-ink font-bold text-canvas">Save password</button></form></main>;
}
