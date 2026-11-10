"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../components/AuthLayout";
import { AuthField, AuthPasswordField, AuthNotice, AuthSubmit } from "../components/AuthControls";
import { authSubmitClassName } from "./authStyles";
import { requireSupabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function RegisterPage() {
  const { t } = useLocale();
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setMismatch(true);
      setError(t("auth.passwordsNoMatch"));
      event.currentTarget.elements.confirmPassword.focus();
      return;
    }
    setBusy(true);
    try {
      const { data, error: authError } = await requireSupabase().auth.signUp({
        email: form.get("email"), password: form.get("password"),
        options: { data: { full_name: form.get("fullName"), role: form.get("role") } },
      });
      if (authError) throw authError;
      if (data.session) router.push(form.get("role") === "landlord" ? "/landlord" : "/");
      else setMessage(t("auth.accountCreatedCheckEmail"));
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return <AuthLayout mode="register" title={t("auth.registerTitle")} landlord={role === "landlord"} showAccountSwitch={!message}>
    {message ? <div className="grid gap-6">
      <AuthNotice success>{message}</AuthNotice>
      <Link href="/login" className={authSubmitClassName}>{t("common.signIn")}<span aria-hidden="true">→</span></Link>
    </div> : <form onSubmit={handleSubmit} aria-busy={busy} onInput={() => { setError(""); setMismatch(false); }}>
      <fieldset disabled={busy} className="grid min-w-0 gap-5 lg:gap-3.5">
        <AuthNotice id="register-error">{error}</AuthNotice>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:gap-3.5">
          <AuthField id="register-fullName" name="fullName" label={t("auth.fullName")} autoComplete="name" required />
          <AuthField id="register-email" name="email" type="email" label={t("auth.emailAddress")} autoComplete="email" required />
        </div>
        <fieldset className="min-w-0">
          <legend className="mb-2 w-full text-left text-xs font-medium leading-4 sm:text-[13px] sm:leading-5">{t("auth.accountType")}</legend>
          <div className="flex flex-wrap justify-start gap-x-8 gap-y-1">
            {["student", "landlord"].map((value) => <label key={value} className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-medium text-muted transition-colors hover:text-ink has-[:checked]:text-ink motion-reduce:transition-none lg:min-h-11">
              <input type="radio" name="role" value={value} required checked={role === value} onChange={() => setRole(value)} className="size-4 shrink-0 accent-ink" />
              {t(`common.role.${value}`)}
            </label>)}
          </div>
        </fieldset>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:gap-3.5">
          <AuthPasswordField id="register-password" name="password" label={t("auth.password")} autoComplete="new-password" required />
          <AuthPasswordField id="register-confirmPassword" name="confirmPassword" label={t("auth.confirmPassword")} autoComplete="new-password" required
            aria-invalid={mismatch || undefined} aria-describedby={mismatch ? "register-error" : undefined} />
        </div>
        <label className="flex min-h-10 cursor-pointer items-start gap-2.5 text-left text-xs leading-5 text-muted sm:min-h-11 sm:gap-3">
          <input type="checkbox" name="terms" required className="mt-0.5 size-4 shrink-0 accent-ink" />
          <span>{t("auth.agreeTerms")}</span>
        </label>
        <AuthSubmit busy={busy}>{t(busy ? "auth.creatingAccount" : "auth.createAccountButton")}</AuthSubmit>
      </fieldset>
    </form>}
  </AuthLayout>;
}
