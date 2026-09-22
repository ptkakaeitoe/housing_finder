"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";
export default function ReportsPage() {
  const { t, locale } = useLocale();
  const admin = useAdmin();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { if (!admin) return; supabase.from("viewing_requests").select("id,status,preferred_at,created_at,listings(title,title_th,title_my,title_zh)").order("created_at", { ascending: false }).limit(100).then(({ data, error: queryError }) => { setRequests(data ?? []); setError(queryError?.message ?? ""); }); }, [admin]);
  return <><main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-semibold tracking-tight text-ink">{t("reports.heading")}</h1>{admin === false && <p className="mt-8 text-muted">{t("common.adminRequired")}</p>}{error && <p role="alert" className="mt-5 text-accent">{error}</p>}{admin && <div className="mt-8 border-t border-line">{requests.length === 0 && <p className="py-8 text-muted">{t("reports.noneYet")}</p>}{requests.map((request) => <div key={request.id} className="flex flex-wrap justify-between gap-3 border-b border-line py-5"><div><strong className="text-ink">{request.listings ? getLocalizedTitle(request.listings, locale) : t("appointments.homeFallback")}</strong><p className="mt-1 text-sm text-muted">{t("reports.requested", { date: new Date(request.created_at).toLocaleDateString(), time: new Date(request.preferred_at).toLocaleString() })}</p></div><span className="text-sm font-bold text-accent uppercase">{t(`common.requestStatus.${request.status}`)}</span></div>)}</div>}</main></>;
}
