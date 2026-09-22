"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, requireSupabase } from "../lib/supabase";
import { publicContainerClassName } from "../components/layoutStyles";
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

  return <main className={`${publicContainerClassName} py-8 pb-32 text-ink sm:py-12 sm:pb-40`}>
    <div className="mx-auto max-w-3xl">
      {error && <p role="alert" className="mb-5 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-accent">{error}</p>}
      {loading ? <div className="rounded-2xl border border-line bg-surface">
        <div className="p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">{t("profile.yourAccount")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t("profile.heading")}</h1>
        </div>
        <div role="status" className="border-t border-line p-5 text-sm text-muted sm:p-7">{t("profile.loadingProfile")}</div>
      </div> : !user ? <section className="rounded-2xl border border-line bg-surface">
        <div className="p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">{t("profile.yourAccount")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t("profile.heading")}</h1>
        </div>
        <div className="border-t border-line p-5 sm:p-7">
          <h2 className="text-xl font-semibold">{t("profile.signInHeading")}</h2>
          <p className="mt-2 text-sm text-muted">{t("profile.signInBody")}</p>
          <Link href="/login" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-canvas hover:bg-accent">{t("common.signIn")}</Link>
        </div>
      </section> : <section aria-label={t("profile.accountDetailsAria")} className="rounded-2xl border border-line bg-surface">
        <div className="p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">{t("profile.yourAccount")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t("profile.heading")}</h1>
        </div>
        <div className="flex items-center gap-4 border-t border-b border-line p-5 sm:p-7">
          <div aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-lg font-semibold">{initials}</div>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold">{savedName || t("profile.yourProfileFallback")}</h2>
          </div>
        </div>
        <form onSubmit={save} className="p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">{t("profile.personalDetails")}</h3>
            {!editingName && <button type="button" disabled={!profileLoaded || Boolean(busy)} onClick={() => { setName(savedName); setEditingName(true); setError(""); setMessage(""); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:border-accent hover:text-accent disabled:opacity-50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true"><path d="m16 3 5 5M4 15 15 4a2 2 0 0 1 3 0l2 2a2 2 0 0 1 0 3L9 20l-6 1 1-6Z" /></svg>
              {t("profile.edit")}
            </button>}
          </div>
          <div className="mt-5">
            {editingName ? <>
            <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold">{t("profile.fullName")}</label>
            <input id="profile-name" autoFocus name="fullName" autoComplete="name" required disabled={!profileLoaded || Boolean(busy)} value={name} onChange={(event) => { setName(event.target.value); setMessage(""); }} className="min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60" />
            </> : <dl><dt className="text-sm font-semibold">{t("profile.fullName")}</dt><dd className="mt-2 break-words text-sm text-muted">{savedName || t("common.notSpecified")}</dd></dl>}
          </div>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div><dt className="text-sm font-semibold">{t("auth.emailAddress")}</dt><dd className="mt-2 break-all text-sm text-muted">{user.email}</dd></div>
            <div><dt className="text-sm font-semibold">{t("profile.accountType")}</dt><dd className="mt-2 text-sm text-muted">{role ? t(`common.role.${role}`) : t("profile.unavailable")}</dd></div>
          </dl>
          {editingName && <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <button type="submit" disabled={!profileLoaded || !changed || !name.trim() || Boolean(busy)} className="min-h-11 rounded-full bg-ink px-6 text-canvas transition-colors enabled:hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"><span className="text-sm font-semibold">{busy === "save" ? t("profile.saving") : t("profile.saveChanges")}</span></button>
            <button type="button" disabled={Boolean(busy)} onClick={() => { setName(savedName); setEditingName(false); setError(""); setMessage(""); }} className="min-h-11 rounded-full px-4 text-muted hover:bg-surface-muted disabled:opacity-50"><span className="text-sm font-semibold">{t("profile.cancel")}</span></button>
          </div>}
          <p role="status" className={message ? "mt-4 text-sm text-muted" : "sr-only"}>{message}</p>
        </form>
        {profileLoaded && role === "landlord" && <LandlordVerificationSection />}
        <div className="border-t border-line p-5 sm:p-7">
          <h3 className="text-base font-semibold">{t("profile.preferences")}</h3>
          <div className="mt-5 max-w-xs">
            <span className="mb-2 block text-sm font-semibold">{t("profile.language")}</span>
            <Picker heading={t("profile.language")} value={locale} onChange={setLocale} items={languageItems} placeholder={LOCALE_LABELS.en} variant="block" panelWidth="14rem" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 rounded-b-2xl border-t border-line bg-canvas/50 px-5 py-4 sm:px-7">
          <button type="button" onClick={signOut} disabled={Boolean(busy)} className="min-h-11 rounded-full border border-line px-5 text-ink hover:border-accent hover:text-accent disabled:opacity-50"><span className="text-sm font-semibold">{busy === "signout" ? t("profile.signingOut") : t("profile.signOut")}</span></button>
        </div>
      </section>}
    </div>
  </main>;
}
