"use client";

import Link from "next/link";
import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import { AuthField, AuthNotice, AuthSubmit } from "../components/AuthControls";
import { authSubmitClassName } from "./authStyles";
import { requireSupabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const email = new FormData(event.currentTarget).get("email");
    setError("");
    setBusy(true);
    try {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/update-password` });
      if (error) throw error;
      setSent(true);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return <AuthLayout mode="reset" title={t("forgotPassword.heading")} description={!sent && t("forgotPassword.subheading")} showAccountSwitch={!sent}>
    {sent ? <div className="grid gap-6">
      <AuthNotice success>{t("forgotPassword.resetLinkSent")}</AuthNotice>
      <Link href="/login" className={authSubmitClassName}>{t("common.signIn")}<span aria-hidden="true">→</span></Link>
    </div> : <form onSubmit={submit} aria-busy={busy} onInput={() => setError("")}>
      <fieldset disabled={busy} className="grid gap-5">
        <AuthNotice>{error}</AuthNotice>
        <AuthField id="reset-email" name="email" type="email" label={t("auth.emailAddress")} autoComplete="email" required />
        <AuthSubmit busy={busy}>{t(busy ? "auth.sendingLink" : "forgotPassword.sendResetLink")}</AuthSubmit>
      </fieldset>
    </form>}
  </AuthLayout>;
}
