"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { useLocale } from "../lib/i18n/LocaleContext";
export default function AdminDashboardPage() {
  const { t } = useLocale();
  const admin = useAdmin();
  const router = useRouter();
  const [counts, setCounts] = useState({});
  const [errors, setErrors] = useState({});
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const sections = [
    { key: "adminDashboard.landlordVerifications", href: "/admin-verifications", table: "verification_requests" },
    { key: "nav.users", href: "/users", table: "profiles" },
    { key: "nav.listings", href: "/manage-listings", table: "listings" },
    { key: "adminDashboard.viewingRequests", href: "/reports", table: "viewing_requests" },
  ];
  useEffect(() => {
    if (!admin) return;
    let active = true;
    Promise.allSettled(sections.map(({ table }) => supabase.from(table).select("id", { count: "exact", head: true }))).then((results) => {
      if (!active) return;
      const nextCounts = {};
      const nextErrors = {};
      results.forEach((result, index) => {
        const table = sections[index].table;
        if (result.status === "rejected" || result.value.error || result.value.count == null) {
          nextErrors[table] = true;
        } else {
          nextCounts[table] = result.value.count;
        }
      });
      setCounts(nextCounts);
      setErrors(nextErrors);
    });
    return () => { active = false; };
  }, [admin]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setSignOutError(cause.message);
      setSigningOut(false);
    }
  }

  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-4xl font-semibold tracking-tight text-ink">{t("adminDashboard.heading")}</h1>
      {admin && <button type="button" onClick={signOut} disabled={signingOut} className="min-h-11 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-accent hover:text-accent disabled:opacity-50">{t(signingOut ? "profile.signingOut" : "profile.signOut")}</button>}
    </div>
    {signOutError && <p role="alert" className="mt-5 text-accent">{signOutError}</p>}
    {admin === false && <p className="mt-8 text-muted">{t("common.adminRequired")}</p>}
    {admin && <div className="mt-8 grid gap-x-8 gap-y-4 border-t border-line sm:grid-cols-2 lg:grid-cols-4">
      {sections.map((section) => <Link href={section.href} key={section.href} className="border-b border-line py-6 transition-colors hover:text-accent">
        <p className="text-sm text-muted">{t(section.key)}</p>
        <p className="mt-3 text-4xl font-extrabold text-ink">{counts[section.table] ?? "—"}</p>
        {errors[section.table] && <p role="alert" className="mt-3 text-sm text-accent">{t("adminDashboard.countError")}</p>}
        <span className="mt-4 block text-sm font-semibold text-accent">{t("adminDashboard.view")}</span>
      </Link>)}
    </div>}
  </main>;
}
