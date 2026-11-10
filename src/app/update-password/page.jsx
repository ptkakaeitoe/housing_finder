"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../../components/AuthLayout";
import { AuthPasswordField, AuthNotice, AuthSubmit } from "../../components/AuthControls";
import { requireSupabase } from "../../lib/supabase";
import { useLocale } from "../../lib/i18n/LocaleContext";

export default function UpdatePasswordPage() {
  const { t } = useLocale();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const password = new FormData(event.currentTarget).get("password");
    setBusy(true);
    setError("");
    try {
      const { error } = await requireSupabase().auth.updateUser({ password });
      if (error) throw error;
      router.push("/profile");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return <AuthLayout mode="update" title={t("updatePassword.heading")}>
    <form onSubmit={submit} aria-busy={busy} onInput={() => setError("")}>
      <fieldset disabled={busy} className="grid gap-5">
        <AuthNotice>{error}</AuthNotice>
        <AuthPasswordField id="new-password" name="password" label={t("auth.password")} autoComplete="new-password" minLength={8} required />
        <AuthSubmit busy={busy}>{t(busy ? "auth.savingPassword" : "updatePassword.save")}</AuthSubmit>
      </fieldset>
    </form>
  </AuthLayout>;
}
