"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { useLocale } from "../lib/i18n/LocaleContext";
export default function AdminDashboardPage() {
  const { t } = useLocale();
  const admin = useAdmin();
  const [counts, setCounts] = useState({});
  const sections = [
    { key: "adminDashboard.landlordVerifications", href: "/admin-verifications", table: "verification_requests" },
    { key: "nav.users", href: "/users", table: "profiles" },
    { key: "nav.listings", href: "/manage-listings", table: "listings" },
    { key: "adminDashboard.viewingRequests", href: "/reports", table: "viewing_requests" },
  ];
  useEffect(() => { if (!admin) return; Promise.all(sections.map(({ table }) => supabase.from(table).select("id", { count: "exact", head: true }))).then((results) => setCounts(Object.fromEntries(results.map((result, index) => [sections[index].table, result.count ?? 0])))); }, [admin]);
  return <><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12"><h1 className="text-4xl font-semibold tracking-tight text-ink">{t("adminDashboard.heading")}</h1>{admin === false && <p className="mt-8 text-muted">{t("common.adminRequired")}</p>}{admin && <div className="mt-8 grid gap-x-8 gap-y-4 border-t border-line sm:grid-cols-2 lg:grid-cols-4">{sections.map((section) => <Link href={section.href} key={section.href} className="border-b border-line py-6 transition-colors hover:text-accent"><p className="text-sm text-muted">{t(section.key)}</p><p className="mt-3 text-4xl font-extrabold text-ink">{counts[section.table] ?? "—"}</p><span className="mt-4 block text-sm font-semibold text-accent">{t("adminDashboard.view")}</span></Link>)}</div>}</main></>;
}
