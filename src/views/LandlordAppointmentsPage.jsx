"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function LandlordAppointmentsPage() {
  const { t, locale } = useLocale();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  async function refresh() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: homes } = await supabase.from("listings").select("id").eq("landlord_id", user.id);
    if (!homes?.length) { setRequests([]); return; }
    const { data, error: queryError } = await supabase.from("viewing_requests").select("id,preferred_at,message,status,listings(id,title,title_th,title_my,title_zh)").in("listing_id", homes.map((home) => home.id)).order("preferred_at");
    setRequests(data ?? []); setError(queryError?.message ?? "");
  }
  useEffect(() => { refresh(); }, []);
  async function setStatus(id, status) {
    const { error: updateError } = await supabase.rpc("set_viewing_status", { request_id: id, next_status: status });
    if (updateError) setError(updateError.message); else { window.dispatchEvent(new Event("viewing-requests-changed")); refresh(); }
  }
  return <><main className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-semibold tracking-tight text-ink">{t("landlordAppointments.heading")}</h1>
    {error && <p role="alert" className="mt-5 text-accent">{error}</p>}
    <div className="mt-8 border-t border-line">{requests.length ? requests.map((request) => <article key={request.id} className="border-b border-line py-6"><div className="flex justify-between gap-3"><strong className="text-lg text-ink">{request.listings ? getLocalizedTitle(request.listings, locale) : ""}</strong><span className="text-xs font-bold text-accent uppercase">{t(`common.requestStatus.${request.status}`)}</span></div><p className="mt-3 text-sm text-muted">{new Date(request.preferred_at).toLocaleString()}</p>{request.message && <p className="mt-2 text-sm text-muted">{request.message}</p>}{request.status === "pending" && <div className="mt-5 flex gap-3"><button onClick={() => setStatus(request.id, "accepted")} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-canvas">{t("landlordAppointments.accept")}</button><button onClick={() => setStatus(request.id, "declined")} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink">{t("landlordAppointments.decline")}</button></div>}</article>) : <p className="py-8 text-muted">{t("landlordAppointments.noneYet")}</p>}</div>
  </main></>;
}
