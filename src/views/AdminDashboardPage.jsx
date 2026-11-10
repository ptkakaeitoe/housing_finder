"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { useLocale } from "../lib/i18n/LocaleContext";
import { publicPageClassName, publicPageHeadingClassName } from "../components/layoutStyles";
import { quietButtonClassName } from "../components/uiStyles";
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

  return <main className={`${publicPageClassName} text-ink`}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className={publicPageHeadingClassName}>{t("adminDashboard.heading")}</h1>
      {admin && <button type="button" onClick={signOut} disabled={signingOut} className={quietButtonClassName}>{t(signingOut ? "profile.signingOut" : "profile.signOut")}</button>}
    </div>
    {signOutError && <p role="alert" className="mt-5 text-sm text-accent">{signOutError}</p>}
    {admin === null && <p role="status" className="mt-8 text-sm text-muted">{t("common.loading")}</p>}
    {admin === false && <p className="mt-8 text-sm text-muted">{t("common.adminRequired")}</p>}
    {admin && <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
      {sections.map((section) => <Link href={section.href} key={section.href} className="group flex min-w-0 flex-col items-start rounded-lg py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
        <p className="text-sm leading-6 text-muted">{t(section.key)}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{counts[section.table] ?? "—"}</p>
        {errors[section.table] && <p role="alert" className="mt-3 text-xs text-accent">{t("adminDashboard.countError")}</p>}
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted group-hover:text-ink group-hover:underline group-hover:underline-offset-4">{t("adminDashboard.view")}</span>
      </Link>)}
    </div>}
  </main>;
}
