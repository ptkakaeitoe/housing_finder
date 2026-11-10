"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ViewingRequestCard from "../components/ViewingRequestCard";
import { publicPageClassName, publicPageHeadingClassName } from "../components/layoutStyles";
import { supabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function AppointmentsPage() {
  const { t } = useLocale();
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
      const { data, error: queryError } = await supabase.from("viewing_requests").select("id,preferred_at,message,status,listings(id,title,title_th,title_my,title_zh,address,image_path)").eq("student_id", user.id).order("preferred_at", { ascending: false });
      setRequests(data ?? []); setError(queryError?.message ?? ""); setLoading(false);
    })();
  }, []);
  return <main className={publicPageClassName}>
    <h1 className={publicPageHeadingClassName}>{t("appointments.heading")}</h1>
    {error ? <p role="alert" className="mt-10 py-8 text-sm text-accent">{error}</p>
    : loading ? <p role="status" className="mt-10 text-sm text-muted">{t("appointments.loading")}</p>
    : !signedIn ? <p className="mt-10 py-10 text-base text-muted"><Link href="/login" className="font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent">{t("common.signIn")}</Link> {t("appointments.signInSuffix")}</p>
    : requests.length ? <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{requests.map((request) => <ViewingRequestCard key={request.id} request={request} />)}</div>
    : <p role="status" className="mt-10 py-10 text-base text-muted">{t("appointments.noneYet")}</p>}
  </main>;
}
