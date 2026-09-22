"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { requireSupabase } from "../../lib/supabase";
import { useLocale } from "../../lib/i18n/LocaleContext";
export default function UpdatePasswordPage() {
  const { t } = useLocale();
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
  return <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-5"><h1 className="text-4xl font-semibold tracking-tight text-ink">{t("updatePassword.heading")}</h1><form onSubmit={submit} className="mt-8 grid gap-5 border-t border-line pt-6"><label className="text-sm font-semibold text-ink">{t("updatePassword.heading")}<input name="password" type="password" minLength="8" required className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base" /></label>{message && <p role="alert" className="text-accent">{message}</p>}<button className="min-h-12 rounded-full bg-ink font-bold text-canvas">{t("updatePassword.save")}</button></form><p className="mt-8 text-center"><Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-[.02em] text-muted transition-colors hover:text-accent">{t("auth.exploreAsGuest")}<span aria-hidden="true">→</span></Link></p></main>;
}
