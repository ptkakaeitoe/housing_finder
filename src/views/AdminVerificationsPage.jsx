"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { useLocale } from "../lib/i18n/LocaleContext";
import { publicPageClassName, publicPageHeadingClassName } from "../components/layoutStyles";
import { statusBadgeClassName } from "../components/uiStyles";
export default function AdminVerificationsPage() {
  const { t } = useLocale();
  const admin = useAdmin();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!admin) return; supabase.from("verification_requests").select("id,full_name,phone,status,created_at").order("created_at", { ascending: false }).then(({ data, error: queryError }) => { setRequests(data ?? []); setError(queryError?.message ?? ""); setLoading(false); }); }, [admin]);
  return <main className={`${publicPageClassName} text-ink`}>
    <h1 className={publicPageHeadingClassName}>{t("adminVerifications.heading")}</h1>
    {admin === false && <p className="mt-8 text-sm text-muted">{t("common.adminRequired")}</p>}
    {error && <p role="alert" className="mt-5 text-sm text-accent">{error}</p>}
    {(admin === null || (admin && loading)) && <p role="status" className="mt-8 text-sm text-muted">{t("common.loading")}</p>}
    {admin && !loading && <div className="mt-8 space-y-2">{requests.length ? requests.map((request) => <Link key={request.id} href={`/verification/${request.id}`} className="group -mx-3 flex min-w-0 flex-wrap items-center gap-3 rounded-lg px-3 py-4 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-ink">
      <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold leading-6 break-words">{request.full_name}</h2><p className="mt-1 text-xs leading-5 break-words text-muted">{t("adminVerifications.phoneAndDate", { phone: request.phone, date: new Date(request.created_at).toLocaleDateString() })}</p></div>
      <span className={statusBadgeClassName}>{t(`common.verificationStatus.${request.status}`)}</span><span aria-hidden="true" className="text-muted">→</span>
    </Link>) : !error && <p role="status" className="py-6 text-sm text-muted">{t("adminVerifications.noneYet")}</p>}</div>}
  </main>;
}
