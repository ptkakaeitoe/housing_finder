"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useListings } from "../lib/useListings";
import { supabase } from "../lib/supabase";
import ListingIcon from "../components/ListingIcon";

export default function LandlordDashboardPage() {
  const { listings, loading, error } = useListings({ owner: true });
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  useEffect(() => {
    let active = true;
    if (loading) return;
    if (!supabase || error || !listings.length) { setRequests([]); setRequestsLoading(false); return; }
    setRequestsLoading(true); setRequestError("");
    supabase.from("viewing_requests").select("id,listing_id,preferred_at,status,created_at").in("listing_id", listings.map(item => item.id)).order("preferred_at").then(({ data, error: queryError }) => {
      if (!active) return;
      setRequests(data ?? []); setRequestError(queryError?.message ?? ""); setRequestsLoading(false);
    });
    return () => { active = false; };
  }, [listings, loading, error]);
  const pending = requests.filter(item => item.status === "pending");
  const upcoming = requests.filter(item => item.status === "accepted" && new Date(item.preferred_at) >= new Date());
  const drafts = listings.filter(item => item.status === "draft");
  const published = listings.filter(item => item.status === "published").length;
  const activityBusy = loading || requestsLoading;
  const stats = [
    { label: "Published homes", value: published, href: "/listings", busy: loading, failed: error, icon: "home" },
    { label: "Draft listings", value: drafts.length, href: "/listings", busy: loading, failed: error, icon: "home" },
    { label: "Awaiting your reply", value: pending.length, href: "/landlord-appointments", busy: activityBusy, failed: error || requestError, icon: "internet" },
    { label: "Upcoming viewings", value: upcoming.length, href: "/landlord-appointments", busy: activityBusy, failed: error || requestError, icon: "van" },
  ];
  return <main className="mx-auto max-w-7xl px-5 py-10 text-ink sm:px-8 lg:px-12">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-muted">Landlord workspace</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Overview</h1><p className="mt-3 text-sm text-muted">Keep up with viewing requests and your next steps.</p></div><Link href="/listings/add" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas">+ Add listing</Link></header>
    {(error || requestError) && <p role="alert" className="mt-6 text-accent">{error || requestError}</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(stat => <Link key={stat.label} href={stat.href} className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent"><span className="flex size-10 items-center justify-center rounded-xl bg-surface-muted text-accent"><ListingIcon name={stat.icon} /></span><p className="mt-4 text-3xl font-semibold tabular-nums">{stat.busy || stat.failed ? "—" : stat.value}</p><p className="mt-1 text-sm text-muted">{stat.label}</p></Link>)}</div>
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Viewing activity</h2><Link href="/landlord-appointments" className="text-sm font-semibold text-accent">Manage →</Link></div>
        {activityBusy ? <p className="mt-5 text-sm text-muted">Loading activity…</p> : error || requestError ? <p className="mt-5 text-sm text-muted">Viewing activity could not be loaded.</p> : <>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Awaiting your reply</h3>
          {pending.length ? <RequestList requests={pending.slice(0, 3)} listings={listings} /> : <p className="mt-3 text-sm text-muted">You’re all caught up. No requests waiting for a reply.</p>}
          <h3 className="mt-6 border-t border-line pt-5 text-xs font-semibold uppercase tracking-wide text-muted">Next confirmed viewings</h3>
          {upcoming.length ? <RequestList requests={upcoming.slice(0, 3)} listings={listings} /> : <p className="mt-3 text-sm text-muted">No upcoming confirmed viewings.</p>}
        </>}
      </section>
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6"><h2 className="text-xl font-semibold">Next steps</h2>
        {loading ? <p className="mt-5 text-sm text-muted">Loading listings…</p> : !error && drafts.length > 0 ? <div className="mt-5"><p className="text-sm text-muted">{drafts.length} draft {drafts.length === 1 ? "home is" : "homes are"} waiting to be published.</p>{drafts.slice(0, 3).map(home => <Link key={home.id} href={`/listings/${home.id}/edit`} className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface-muted p-4 text-sm"><span className="truncate font-medium">{home.title}</span><span className="shrink-0 text-accent">Continue editing →</span></Link>)}</div> : !error && !listings.length ? <p className="mt-5 text-sm text-muted">Add your first home so students can find it in Explore.</p> : !error ? <p className="mt-5 text-sm text-muted">All your listings are published. Keep photos, prices and availability up to date.</p> : <p className="mt-5 text-sm text-muted">Listing information is unavailable.</p>}
        <div className="mt-6 divide-y divide-line border-t border-line"><Link href="/listings" className="flex justify-between gap-3 py-4 text-sm font-semibold">Manage all listings <span className="text-accent">→</span></Link><Link href="/landlord-profile#verification" className="flex justify-between gap-3 py-4 text-sm font-semibold">Profile & verification <span className="text-accent">→</span></Link></div>
      </section>
    </div>
  </main>;
}
function RequestList({ requests, listings }) {
  return <ul className="mt-2 divide-y divide-line">{requests.map(request => <li key={request.id}><Link href="/landlord-appointments" className="flex items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold">{listings.find(home => home.id === request.listing_id)?.title || "Property viewing"}</p><p className="mt-1 text-xs text-muted">{new Date(request.preferred_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p></div><span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold capitalize text-accent">{request.status}</span></Link></li>)}</ul>;
}
