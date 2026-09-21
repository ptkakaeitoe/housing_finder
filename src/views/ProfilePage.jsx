"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, requireSupabase } from "../lib/supabase";
import { publicContainerClassName } from "../components/layoutStyles";
import { Picker } from "../components/Picker";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "th", label: "ไทย (Thai)" },
  { value: "my", label: "မြန်မာ (Burmese)" },
  { value: "zh", label: "中文 (Chinese)" },
];
const LANGUAGE_STORAGE_KEY = "rsu-language";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch (cause) {}
    setLanguage(LANGUAGES.some((option) => option.value === saved) ? saved : "en");
  }, []);

  function changeLanguage(next) {
    setLanguage(next);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch (cause) {}
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!supabase) throw new Error("Account details are currently unavailable.");
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
    if (!user || !profileLoaded || busy || nextName === savedName) return;
    if (!nextName) { setError("Enter your full name."); return; }
    setBusy("save"); setError(""); setMessage("");
    try {
      const { data, error: saveError } = await requireSupabase().from("profiles").update({ full_name: nextName }).eq("id", user.id).select("full_name").single();
      if (saveError) throw saveError;
      setName(data.full_name); setSavedName(data.full_name);
      setMessage("Your name has been updated.");
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
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">Your account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Profile</h1>
        </div>
        <div role="status" className="border-t border-line p-5 text-sm text-muted sm:p-7">Loading your profile…</div>
      </div> : !user ? <section className="rounded-2xl border border-line bg-surface">
        <div className="p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">Your account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Profile</h1>
        </div>
        <div className="border-t border-line p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Sign in to your account</h2>
          <p className="mt-2 text-sm text-muted">Manage your personal details here.</p>
          <Link href="/login" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-canvas hover:bg-accent">Sign in</Link>
        </div>
      </section> : <section aria-label="Account details" className="rounded-2xl border border-line bg-surface">
        <div className="p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">Your account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Profile</h1>
        </div>
        <div className="flex items-center gap-4 border-t border-b border-line p-5 sm:p-7">
          <div aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-lg font-semibold">{initials}</div>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold">{savedName || "Your profile"}</h2>
          </div>
        </div>
        <form onSubmit={save} className="p-5 sm:p-7">
          <h3 className="text-base font-semibold">Personal details</h3>
          <div className="mt-5">
            <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold">Full name</label>
            <input id="profile-name" name="fullName" autoComplete="name" required disabled={!profileLoaded || Boolean(busy)} value={name} onChange={(event) => { setName(event.target.value); setMessage(""); }} className="min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60" />
          </div>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div><dt className="text-sm font-semibold">Email address</dt><dd className="mt-2 break-all text-sm text-muted">{user.email}</dd></div>
            <div><dt className="text-sm font-semibold">Account type</dt><dd className="mt-2 text-sm capitalize text-muted">{role || "Unavailable"}</dd></div>
          </dl>
          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <button type="submit" disabled={!profileLoaded || !changed || !name.trim() || Boolean(busy)} className="min-h-11 rounded-full bg-ink px-6 text-canvas transition-colors enabled:hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"><span className="text-sm font-semibold">{busy === "save" ? "Saving…" : "Save changes"}</span></button>
            {changed && <button type="button" disabled={Boolean(busy)} onClick={() => { setName(savedName); setError(""); setMessage(""); }} className="min-h-11 rounded-full px-4 text-muted hover:bg-surface-muted disabled:opacity-50"><span className="text-sm font-semibold">Cancel</span></button>}
            <p role="status" className="text-sm text-muted">{message}</p>
          </div>
        </form>
        <div className="border-t border-line p-5 sm:p-7">
          <h3 className="text-base font-semibold">Preferences</h3>
          <div className="mt-5 max-w-xs">
            <span className="mb-2 block text-sm font-semibold">Language</span>
            <Picker heading="Language" value={language} onChange={changeLanguage} items={LANGUAGES} placeholder="English" variant="block" panelWidth="14rem" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 rounded-b-2xl border-t border-line bg-canvas/50 px-5 py-4 sm:px-7">
          <button type="button" onClick={signOut} disabled={Boolean(busy)} className="min-h-11 rounded-full border border-line px-5 text-ink hover:border-accent hover:text-accent disabled:opacity-50"><span className="text-sm font-semibold">{busy === "signout" ? "Signing out…" : "Sign out"}</span></button>
        </div>
      </section>}
    </div>
  </main>;
}
