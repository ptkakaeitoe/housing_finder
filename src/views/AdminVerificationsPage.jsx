"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { useLocale } from "../lib/i18n/LocaleContext";
export default function AdminVerificationsPage() {
  const { t } = useLocale();
  const admin = useAdmin();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { if (!admin) return; supabase.from("verification_requests").select("id,full_name,phone,status,created_at").order("created_at", { ascending: false }).then(({ data, error: queryError }) => { setRequests(data ?? []); setError(queryError?.message ?? ""); }); }, [admin]);
  return <><main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-semibold tracking-tight text-ink">{t("adminVerifications.heading")}</h1>{admin === false && <p className="mt-8 text-muted">{t("common.adminRequired")}</p>}{error && <p role="alert" className="mt-5 text-accent">{error}</p>}{admin && <div className="mt-8 border-t border-line">{requests.length ? requests.map((request) => <Link key={request.id} href={`/verification/${request.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-5 hover:text-accent"><div><strong className="text-ink">{request.full_name}</strong><p className="text-sm text-muted">{t("adminVerifications.phoneAndDate", { phone: request.phone, date: new Date(request.created_at).toLocaleDateString() })}</p></div><span className="text-sm font-bold text-accent uppercase">{t("adminVerifications.statusArrow", { status: t(`common.verificationStatus.${request.status}`) })}</span></Link>) : <p className="py-8 text-muted">{t("adminVerifications.noneYet")}</p>}</div>}</main></>;
}
