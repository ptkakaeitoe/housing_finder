"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import HousingCard from "../components/HousingCard";
import { useListings } from "../lib/useListings";
import { isSupabaseConfigured } from "../lib/supabase";

export default function ExplorePage() {
  const { listings, loading, error } = useListings();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const visible = useMemo(() => listings.filter((listing) =>
    (!search || `${listing.title} ${listing.address} ${listing.description}`.toLowerCase().includes(search.toLowerCase())) &&
    (!type || listing.property_type === type) &&
    (!maxRent || Number(listing.monthly_rent) <= Number(maxRent))
  ), [listings, search, type, maxRent]);

  return <><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-7">
      <div><h1 className="text-4xl font-semibold tracking-[-.055em] text-ink sm:text-5xl">Homes near Rangsit University</h1><p className="mt-3 text-sm text-muted">Lak Hok · Muang Ake · Pathum Thani</p></div>
      <Link href="/map" className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:text-accent">View map ↗</Link>
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
      <label className="text-xs font-semibold text-muted">Search area or property<input aria-label="Search properties" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, location, or feature" className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base text-ink outline-none focus:border-accent" /></label>
      <label className="text-xs font-semibold text-muted">Type<select value={type} onChange={(e) => setType(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base text-ink"><option value="">All types</option><option value="apartment">Apartment</option><option value="condo">Condo</option><option value="room">Room</option></select></label>
      <label className="text-xs font-semibold text-muted">Max monthly rent<input type="number" min="0" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} placeholder="Any budget" className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base text-ink" /></label>
    </div>
    <div className="mt-10 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3"><h2 className="text-xl font-semibold text-ink">Homes</h2><span className="text-sm text-muted">{visible.length} {visible.length === 1 ? "place" : "places"}</span></div>
    {error && <p role="alert" className="mt-5 text-accent">{error}</p>}
    {!isSupabaseConfigured && <p className="mt-5 text-sm text-muted">Live listings are unavailable. Sample homes are shown below.</p>}
    {loading ? <p className="mt-8 text-muted">Loading homes…</p> : visible.length ? <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{visible.map((listing) => <HousingCard key={listing.id} listing={listing} />)}</div> : isSupabaseConfigured && <p className="mt-8 text-muted">No matches. Try a different area or budget.</p>}
  </main></>;
}
