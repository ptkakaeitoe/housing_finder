"use client";
import Link from "next/link";
import HousingCard from "../components/HousingCard";
import { useListings } from "../lib/useListings";

export default function LandlordDashboardPage() {
  const { listings, loading, error } = useListings({ owner: true });
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12"><div className="flex flex-wrap items-end justify-between gap-4"><h1 className="text-4xl font-semibold tracking-tight text-ink">Your properties</h1><Link href="/listings/add" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas">+ Add listing</Link></div><div className="mt-8 flex flex-wrap gap-x-9 gap-y-3 border-y border-line py-4 text-sm text-muted"><Link href="/listings" className="hover:text-accent"><strong className="mr-2 text-lg text-ink">{listings.length}</strong> listings ↗</Link><Link href="/landlord-appointments" className="font-semibold text-accent">Viewing requests ↗</Link></div>{error && <p role="alert" className="mt-6 text-accent">{error}</p>}<div className="mt-10 flex items-end justify-between border-b border-line pb-3"><h2 className="text-xl font-semibold text-ink">Recent listings</h2><Link href="/listings" className="text-sm font-semibold text-accent">View all →</Link></div>{loading ? <p className="mt-6 text-muted">Loading…</p> : listings.length ? <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{listings.slice(0,3).map((listing) => <HousingCard key={listing.id} listing={listing} />)}</div> : <p className="py-8 text-muted">No listings yet. Add your first property to appear in Explore.</p>}</main>;
}
