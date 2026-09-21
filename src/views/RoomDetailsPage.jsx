"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { publicContainerClassName } from "../components/layoutStyles";
import { supabase, listingImageUrl } from "../lib/supabase";
import { getMockListing } from "../lib/mockListings";
import { listingUniversity } from "../lib/universities";

export default function RoomDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setListing(null); setSaved(false); setUserId(null); setError("");
    async function load() {
      const sample = getMockListing(id);
      if (sample) { setListing(sample); return; }
      if (!supabase || !id) { setError("Listing information is unavailable."); return; }
      try {
        const { data, error: loadError } = await supabase.from("listings").select("*").eq("id", id).single();
        if (!active) return;
        if (loadError || !data) throw new Error("This home could not be loaded.");
        setListing(data);
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        setUserId(user?.id ?? null);
        if (user) {
          const { data: savedListing } = await supabase.from("saved_listings").select("listing_id").eq("listing_id", id).eq("student_id", user.id).maybeSingle();
          if (active) setSaved(Boolean(savedListing));
        }
      } catch (cause) { if (active) setError(cause.message); }
    }
    load();
    return () => { active = false; };
  }, [id]);

  async function toggleSaved() {
    if (!userId) { router.push("/login"); return; }
    if (saving) return;
    setSaving(true); setError("");
    try {
      const query = saved ? supabase.from("saved_listings").delete().eq("listing_id", id).eq("student_id", userId) : supabase.from("saved_listings").insert({ listing_id: id, student_id: userId });
      const { error: saveError } = await query;
      if (saveError) throw saveError;
      setSaved(!saved);
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  }
  const nearest = listing ? listingUniversity(listing) : null;
  const rent = listing ? new Intl.NumberFormat("en-TH", { maximumFractionDigits: 0 }).format(Number(listing.monthly_rent)) : "";
  const lease = listing?.lease_duration_months ? `${listing.lease_duration_months} months` : "Not specified";
  const mapHref = `/map?listing=${encodeURIComponent(id)}`;

  return <main className={`${publicContainerClassName} py-6 text-ink sm:py-8`}>
    <Link href="/" className="inline-flex min-h-10 items-center text-sm font-semibold text-muted hover:text-accent">← Back to Explore</Link>
    {error && <p role="alert" className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-accent">{error}</p>}
    {!listing ? <div role="status" className="my-10 rounded-2xl border border-line bg-surface p-8">
      <h1 className="text-xl font-semibold">{error ? "This home is unavailable" : "Loading home…"}</h1>
      {error && <p className="mt-2 text-sm text-muted">Return to Explore to find another home.</p>}
    </div> : <>
      <header className="mb-6 mt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-surface-muted px-3 py-1.5 capitalize">{listing.property_type}</span>
          {listing.is_mock && <span className="rounded-full border border-line px-3 py-1.5 text-muted">Sample listing</span>}
        </div>
        <h1 className="mt-3 max-w-4xl break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{listing.title}</h1>
        <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-muted">{listing.address}</p>
      </header>

      <div className="grid min-w-0 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
        <div className="min-w-0">
          <figure className="overflow-hidden rounded-2xl bg-surface-muted">
            <img src={listingImageUrl(listing.image_path)} alt={listing.title} className="aspect-[16/10] w-full object-cover" />
          </figure>
          <dl className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface py-5">
            <div className="min-w-0 px-3 sm:px-5"><dt className="text-xs text-muted">Home type</dt><dd className="mt-1 text-sm font-semibold capitalize">{listing.property_type}</dd></div>
            <div className="min-w-0 px-3 sm:px-5"><dt className="text-xs text-muted">Minimum lease</dt><dd className="mt-1 text-sm font-semibold">{lease}</dd></div>
            <div className="min-w-0 px-3 sm:px-5"><dt className="text-xs text-muted">Campus distance</dt><dd className="mt-1 text-sm font-semibold">{nearest ? `${nearest.distanceKm.toFixed(1)} km` : "Not specified"}</dd></div>
          </dl>

          <section className="mt-8 border-b border-line pb-8" aria-labelledby="about-home">
            <h2 id="about-home" className="text-xl font-semibold tracking-tight">About this home</h2>
            <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-muted">{listing.description || "The landlord has not added a description yet. Ask about furnishings, facilities, and house rules when arranging a viewing."}</p>
          </section>

          <section className="mt-8 border-b border-line pb-8" aria-labelledby="costs-lease">
            <h2 id="costs-lease" className="text-xl font-semibold tracking-tight">Costs & lease</h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {[['Monthly rent', `฿${rent}`], ['Minimum lease', lease], ['Security deposit', 'Not specified'], ['Electricity, water & internet', 'Not specified']].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2 py-3"><dt className="text-muted">{label}</dt><dd className="font-medium">{value}</dd></div>)}
            </dl>
            <p className="mt-3 text-xs leading-6 text-muted">Confirm utility rates, deposits, and any additional charges with the landlord before agreeing to a lease.</p>
          </section>

          <section className="mt-8" aria-labelledby="home-location">
            <h2 id="home-location" className="text-xl font-semibold tracking-tight">Location & campus</h2>
            <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
              <p className="break-words text-sm leading-6">{listing.address}</p>
              {nearest && <p className="mt-2 text-sm leading-6 text-muted">{nearest.distanceKm.toFixed(1)} km from {nearest.university.name}</p>}
              <Link href={mapHref} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-accent underline underline-offset-4">Explore the location on the map ↗</Link>
            </div>
          </section>
        </div>

        <aside aria-label="Rent and viewing" className="min-w-0 rounded-2xl border border-line bg-surface p-6 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Monthly rent</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-2"><span className="text-4xl font-semibold tracking-tight tabular-nums">฿{rent}</span><span className="text-sm text-muted">/ month</span></p>
          <p className="mt-3 text-sm leading-6 text-muted">{listing.lease_duration_months ? `Minimum lease of ${listing.lease_duration_months} months.` : "Ask the landlord about lease length."}</p>
          <div className="my-5 border-t border-line" />
          {listing.is_mock ? <div className="rounded-xl bg-surface-muted p-4 text-sm leading-6 text-muted">This is a fictional sample home. Viewings and saving are unavailable, and its location is approximate.</div> : <>
            <Link href={`/request-viewing?listing=${encodeURIComponent(id)}`} className="flex min-h-12 items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-canvas transition-colors hover:bg-accent">Request a viewing</Link>
            <p className="mt-3 text-center text-xs leading-5 text-muted">Choose a preferred time and send a request to the landlord.</p>
            <button type="button" onClick={toggleSaved} disabled={saving} aria-pressed={saved} className="mt-4 min-h-11 w-full rounded-full border border-line px-4 text-sm text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"><span className="font-semibold">{saving ? "Saving…" : saved ? "♥ Saved to your homes" : "♡ Save this home"}</span></button>
          </>}
          <Link href={mapHref} className="mt-4 flex min-h-11 items-center justify-center rounded-full border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-muted">See on map ↗</Link>
        </aside>
      </div>
    </>}
  </main>;
}
