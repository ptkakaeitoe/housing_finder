"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, requireSupabase } from "../lib/supabase";
import { publicPageClassName, publicPageHeadingClassName } from "../components/layoutStyles";
import LandlordVerificationSection from "../components/LandlordVerificationSection";
import { Picker } from "../components/Picker";
import { LOCALES, LOCALE_LABELS } from "../lib/i18n/config";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function ProfilePage() {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const [user, setUser] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const languageItems = LOCALES.map((code) => ({ value: code, label: LOCALE_LABELS[code] }));

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!supabase) throw new Error(t("profile.accountUnavailableError"));
        const { data: { user: current }, error: authError } = await supabase.auth.getUser();
        if (!active) return;
        if (authError && authError.name !== "AuthSessionMissingError") throw authError;
        setUser(current);
        if (!current) return;
        const { data, error: profileError } = await supabase.from("profiles").select("full_name,role").eq("id", current.id).single();
        if (!active) return;
        if (profileError) throw profileError;
        setName(data.full_name ?? "");
        setSavedName(data.full_name ?? "");
        setRole(data.role ?? "");
        setProfileLoaded(true);
      } catch (cause) { if (active) setError(cause.message); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    const nextName = name.trim();
    if (!editingName || !user || !profileLoaded || busy || nextName === savedName) return;
    if (!nextName) { setError(t("profile.enterFullNameError")); return; }
    setBusy("save"); setError(""); setMessage("");
    try {
      const { data, error: saveError } = await requireSupabase().from("profiles").update({ full_name: nextName }).eq("id", user.id).select("full_name").single();
      if (saveError) throw saveError;
      setName(data.full_name); setSavedName(data.full_name);
      setMessage(t("profile.nameUpdated"));
      setEditingName(false);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(""); }
  }

  async function signOut() {
    if (busy) return;
    setBusy("signout"); setError(""); setMessage("");
    try {
      const { error: signOutError } = await requireSupabase().auth.signOut();
      if (signOutError) throw signOutError;
      router.push("/"); router.refresh();
    } catch (cause) { setError(cause.message); setBusy(""); }
  }

  const initials = savedName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";
  const changed = name.trim() !== savedName;

  return <main className={`${publicPageClassName} text-ink`}>
    <h1 className={publicPageHeadingClassName}>{t("profile.heading")}</h1>
    {error && <p role="alert" className="mt-6 max-w-2xl text-sm leading-6 break-words text-accent">{error}</p>}
    {loading ? <p role="status" className="mt-10 text-sm text-muted">{t("profile.loadingProfile")}</p>
    : !user ? <section className="mt-10 max-w-md">
      <h2 className="text-lg font-semibold">{t("profile.signInHeading")}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{t("profile.signInBody")}</p>
      <Link href="/login" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-6 text-sm font-medium text-canvas hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">{t("common.signIn")}</Link>
    </section> : <section aria-label={t("profile.accountDetailsAria")} className="mt-8 grid min-w-0 gap-8 sm:mt-10 lg:max-w-5xl lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
      <div className="flex min-w-0 items-center gap-4 self-start lg:flex-col lg:items-start lg:gap-5">
        <div aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-lg font-semibold sm:size-16 sm:text-xl">{initials}</div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-7 break-words">{savedName || t("profile.yourProfileFallback")}</h2>
          <p className="mt-1 text-sm leading-5 text-muted">{role ? t(`common.role.${role}`) : t("profile.unavailable")}</p>
        </div>
      </div>
      <div className="min-w-0">
        <form onSubmit={save} aria-labelledby="personal-details-heading" className="pb-6">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <h2 id="personal-details-heading" className="text-base font-semibold">{t("profile.personalDetails")}</h2>
            {!editingName && <button type="button" disabled={!profileLoaded || Boolean(busy)} onClick={() => { setName(savedName); setEditingName(true); setError(""); setMessage(""); }} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true"><path d="m16 3 5 5M4 15 15 4a2 2 0 0 1 3 0l2 2a2 2 0 0 1 0 3L9 20l-6 1 1-6Z" /></svg>
              {t("profile.edit")}
            </button>}
          </div>
          <div className="mt-5">
            {editingName ? <>
              <label htmlFor="profile-name" className="mb-2 block text-xs font-medium text-muted">{t("profile.fullName")}</label>
              <input id="profile-name" autoFocus name="fullName" autoComplete="name" required disabled={!profileLoaded || Boolean(busy)} value={name} onChange={(event) => { setName(event.target.value); setMessage(""); }} className="min-h-12 w-full min-w-0 rounded-md border border-line bg-transparent px-3 py-2.5 text-left text-base text-ink transition-colors outline-none focus:border-ink focus:ring-1 focus:ring-ink disabled:opacity-60" />
            </> : <dl><dt className="text-xs font-medium text-muted">{t("profile.fullName")}</dt><dd className="mt-2 text-sm leading-6 break-words">{savedName || t("common.notSpecified")}</dd></dl>}
          </div>
          <dl className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2">
            <div className="min-w-0"><dt className="text-xs font-medium text-muted">{t("auth.emailAddress")}</dt><dd className="mt-2 text-sm leading-6 [overflow-wrap:anywhere]">{user.email}</dd></div>
            <div className="min-w-0"><dt className="text-xs font-medium text-muted">{t("profile.accountType")}</dt><dd className="mt-2 text-sm leading-6">{role ? t(`common.role.${role}`) : t("profile.unavailable")}</dd></div>
          </dl>
          {editingName && <div className="mt-6 flex flex-wrap items-center gap-2">
            <button type="submit" disabled={!profileLoaded || !changed || !name.trim() || Boolean(busy)} className="min-h-12 rounded-lg bg-ink px-5 py-2 text-sm font-medium text-canvas enabled:hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40">{busy === "save" ? t("profile.saving") : t("profile.saveChanges")}</button>
            <button type="button" disabled={Boolean(busy)} onClick={() => { setName(savedName); setEditingName(false); setError(""); setMessage(""); }} className="min-h-12 rounded-lg px-4 text-sm font-medium text-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-50">{t("profile.cancel")}</button>
          </div>}
          <p role="status" className={message ? "mt-4 text-sm leading-6 text-muted" : "sr-only"}>{message}</p>
        </form>
        {profileLoaded && role === "landlord" && <LandlordVerificationSection />}
        <section aria-labelledby="profile-preferences-heading" className="pt-2 pb-6">
          <h2 id="profile-preferences-heading" className="text-base font-semibold">{t("profile.preferences")}</h2>
          <div className="mt-5 w-full max-w-xs">
            <span className="mb-2 block text-xs font-medium text-muted">{t("profile.language")}</span>
            <Picker heading={t("profile.language")} value={locale} onChange={setLocale} items={languageItems} placeholder={LOCALE_LABELS.en} variant="plain" panelWidth="14rem" />
          </div>
        </section>
        <div className="pt-2">
          <button type="button" onClick={signOut} disabled={Boolean(busy)} className="inline-flex min-h-12 items-center gap-2.5 rounded-md pr-4 text-sm font-medium text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:opacity-50">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M9 5H5v14h4m7-11 4 4-4 4M9 12h11" /></svg>
            {busy === "signout" ? t("profile.signingOut") : t("profile.signOut")}
          </button>
        </div>
      </div>
    </section>}
  </main>;
}
