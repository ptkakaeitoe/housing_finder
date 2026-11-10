"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";
import { publicPageClassName, publicPageHeadingClassName } from "../components/layoutStyles";
import { statusBadgeClassName } from "../components/uiStyles";
export default function ReportsPage() {
  const { t, locale } = useLocale();
  const admin = useAdmin();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!admin) return; supabase.from("viewing_requests").select("id,status,preferred_at,created_at,listings(title,title_th,title_my,title_zh)").order("created_at", { ascending: false }).limit(100).then(({ data, error: queryError }) => { setRequests(data ?? []); setError(queryError?.message ?? ""); setLoading(false); }); }, [admin]);
  return <main className={`${publicPageClassName} text-ink`}>
    <h1 className={publicPageHeadingClassName}>{t("reports.heading")}</h1>
    {admin === false && <p className="mt-8 text-sm text-muted">{t("common.adminRequired")}</p>}
    {error && <p role="alert" className="mt-5 text-sm text-accent">{error}</p>}
    {(admin === null || (admin && loading)) && <p role="status" className="mt-8 text-sm text-muted">{t("common.loading")}</p>}
    {admin && !loading && <div className="mt-8 space-y-2">{requests.length === 0 && !error && <p role="status" className="py-6 text-sm text-muted">{t("reports.noneYet")}</p>}{requests.map((request) => <article key={request.id} className="flex min-w-0 flex-wrap items-start justify-between gap-3 py-4">
      <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold leading-6 break-words">{request.listings ? getLocalizedTitle(request.listings, locale) : t("appointments.homeFallback")}</h2><p className="mt-1 max-w-2xl text-xs leading-6 text-muted">{t("reports.requested", { date: new Date(request.created_at).toLocaleDateString(locale), time: new Date(request.preferred_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) })}</p></div>
      <span className={statusBadgeClassName}>{t(`common.requestStatus.${request.status}`)}</span>
    </article>)}</div>}
  </main>;
}
