"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function AppointmentsPage() {
  const { t, locale } = useLocale();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!supabase) { setSignedIn(false); setLoading(false); return; }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSignedIn(Boolean(user));
      if (!user) { setLoading(false); return; }
      const { data, error: queryError } = await supabase.from("viewing_requests").select("id,preferred_at,message,status,listings(id,title,title_th,title_my,title_zh,address)").eq("student_id", user.id).order("preferred_at", { ascending: false });
      setRequests(data ?? []); setError(queryError?.message ?? ""); setLoading(false);
    })();
  }, []);
  return <><main className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-semibold tracking-tight text-ink">{t("appointments.heading")}</h1>
    {error && <p role="alert" className="mt-6 text-accent">{error}</p>}
    {loading ? <p className="mt-8 text-muted">{t("appointments.loading")}</p> : !signedIn ? <p className="mt-8 border-t border-line py-8 text-muted"><Link href="/login" className="font-semibold text-accent">{t("common.signIn")}</Link> {t("appointments.signInSuffix")}</p> : requests.length ? <div className="mt-8 border-t border-line">{requests.map((request) => <article key={request.id} className="border-b border-line py-6"><div className="flex flex-wrap justify-between gap-3"><div><Link href={`/rooms/${request.listings?.id}`} className="text-xl font-bold text-ink hover:text-accent">{request.listings ? getLocalizedTitle(request.listings, locale) : t("appointments.homeFallback")}</Link><p className="mt-1 text-sm text-muted">{request.listings?.address}</p></div><span className="text-sm font-semibold text-accent">{t(`common.requestStatus.${request.status}`)}</span></div><p className="mt-5 font-semibold text-ink">{new Date(request.preferred_at).toLocaleString()}</p>{request.message && <p className="mt-2 text-sm text-muted">{request.message}</p>}</article>)}</div> : <p className="mt-8 border-t border-line py-8 text-muted">{t("appointments.noneYet")} <Link href="/" className="font-semibold text-accent">{t("appointments.exploreHomes")}</Link></p>}
  </main></>;
}
