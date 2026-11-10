"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../components/AuthLayout";
import { AuthField, AuthPasswordField, AuthNotice, AuthSubmit } from "../components/AuthControls";
import { requireSupabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function LoginPage() {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const client = requireSupabase();
      const { data, error: authError } = await client.auth.signInWithPassword({ email: form.get("email"), password: form.get("password") });
      if (authError) throw authError;
      const { data: profile } = await client.from("profiles").select("role").eq("id", data.user.id).single();
      router.push(profile?.role === "landlord" ? "/landlord" : profile?.role === "admin" ? "/admin" : "/");
      router.refresh();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return <AuthLayout mode="login" title={t("auth.loginTitle")}>
    <form onSubmit={handleSubmit} aria-busy={busy} onInput={() => setError("")}>
      <fieldset disabled={busy} className="grid min-w-0 gap-5">
        <AuthNotice id="login-error">{error}</AuthNotice>
        <AuthField id="login-email" name="email" type="email" label={t("auth.emailAddress")} autoComplete="email" required />
        <div>
          <AuthPasswordField id="login-password" name="password" label={t("auth.password")} autoComplete="current-password" required />
          <div className="flex justify-center sm:justify-end">
            <Link href="/forgot-password" className="inline-flex min-h-8 items-center text-xs text-muted underline-offset-4 transition-colors hover:text-ink hover:underline sm:text-[13px] lg:min-h-11">{t("auth.forgotPassword")}</Link>
          </div>
        </div>
        <AuthSubmit busy={busy}>{t(busy ? "auth.signingIn" : "auth.signInButton")}</AuthSubmit>
      </fieldset>
    </form>
  </AuthLayout>;
}
