"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function LandlordAppointmentsPage() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  async function refresh() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: homes } = await supabase.from("listings").select("id").eq("landlord_id", user.id);
    if (!homes?.length) { setRequests([]); return; }
    const { data, error: queryError } = await supabase.from("viewing_requests").select("id,preferred_at,message,status,listings(id,title)").in("listing_id", homes.map((home) => home.id)).order("preferred_at");
    setRequests(data ?? []); setError(queryError?.message ?? "");
  }
  useEffect(() => { refresh(); }, []);
  async function setStatus(id, status) {
    const { error: updateError } = await supabase.rpc("set_viewing_status", { request_id: id, next_status: status });
    if (updateError) setError(updateError.message); else refresh();
  }
  return <><main className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-semibold tracking-tight text-ink">Viewing requests</h1>
    {error && <p role="alert" className="mt-5 text-accent">{error}</p>}
    <div className="mt-8 border-t border-line">{requests.length ? requests.map((request) => <article key={request.id} className="border-b border-line py-6"><div className="flex justify-between gap-3"><strong className="text-lg text-ink">{request.listings?.title}</strong><span className="text-xs font-bold text-accent uppercase">{request.status}</span></div><p className="mt-3 text-sm text-muted">{new Date(request.preferred_at).toLocaleString()}</p>{request.message && <p className="mt-2 text-sm text-muted">{request.message}</p>}{request.status === "pending" && <div className="mt-5 flex gap-3"><button onClick={() => setStatus(request.id, "accepted")} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-canvas">Accept</button><button onClick={() => setStatus(request.id, "declined")} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink">Decline</button></div>}</article>) : <p className="py-8 text-muted">No viewing requests yet.</p>}</div>
  </main></>;
}
