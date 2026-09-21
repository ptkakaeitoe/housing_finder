"use client";
import { useState } from "react";
import Link from "next/link";
import { requireSupabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    try {
      const email = new FormData(event.currentTarget).get("email");
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/update-password` });
      if (error) throw error;
      setMessage("If this account exists, a reset link is on its way.");
    } catch (cause) { setMessage(cause.message); }
  }
  return <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-5 py-12"><Link href="/" className="text-sm font-bold text-accent">← HousingFinder</Link><h1 className="mt-8 text-4xl font-semibold tracking-tight text-ink">Reset your password</h1><p className="mt-3 text-muted">We’ll email you a reset link.</p><form onSubmit={submit} className="mt-8 grid gap-5 border-t border-line pt-6"><label className="text-sm font-semibold text-ink">Email address<input name="email" type="email" required className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base" /></label>{message && <p role="status" className="text-sm text-accent">{message}</p>}<button className="min-h-12 rounded-full bg-ink font-bold text-canvas">Send reset link</button></form></main>;
}
