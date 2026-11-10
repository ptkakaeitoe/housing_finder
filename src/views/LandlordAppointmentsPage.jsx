"use client";
import { useEffect, useState } from "react";
import ViewingRequestCard from "../components/ViewingRequestCard";
import { publicPageClassName, publicPageHeadingClassName } from "../components/layoutStyles";
import { supabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function LandlordAppointmentsPage() {
  const { t } = useLocale();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function refresh() {
    try {
      if (!supabase) return;
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return;
      const { data: homes, error: homesError } = await supabase.from("listings").select("id").eq("landlord_id", user.id);
      if (homesError) throw homesError;
      if (!homes?.length) { setRequests([]); return; }
      const { data, error: queryError } = await supabase.from("viewing_requests").select("id,preferred_at,message,status,listings(id,title,title_th,title_my,title_zh,address,image_path)").in("listing_id", homes.map((home) => home.id)).order("preferred_at");
      setRequests(data ?? []); setError(queryError?.message ?? "");
    } catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  async function setStatus(id, status) {
    const { error: updateError } = await supabase.rpc("set_viewing_status", { request_id: id, next_status: status });
    if (updateError) setError(updateError.message); else { window.dispatchEvent(new Event("viewing-requests-changed")); refresh(); }
  }
  return <main className={publicPageClassName}>
    <h1 className={publicPageHeadingClassName}>{t("landlordAppointments.heading")}</h1>
    {error && <p role="alert" className="mt-5 text-accent">{error}</p>}
    {loading ? <p role="status" className="mt-10 text-sm text-muted">{t("appointments.loading")}</p>
    : requests.length ? <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{requests.map((request) => <ViewingRequestCard key={request.id} request={request}>
      {request.status === "pending" && <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setStatus(request.id, "accepted")} className="min-h-11 rounded-lg bg-ink px-5 text-sm font-medium text-canvas hover:opacity-80">{t("landlordAppointments.accept")}</button>
        <button type="button" onClick={() => setStatus(request.id, "declined")} className="min-h-11 rounded-lg border border-line px-5 text-sm font-medium text-ink hover:border-ink">{t("landlordAppointments.decline")}</button>
      </div>}
    </ViewingRequestCard>)}</div>
    : !error && <p role="status" className="mt-10 py-10 text-base text-muted">{t("landlordAppointments.noneYet")}</p>}
  </main>;
}
