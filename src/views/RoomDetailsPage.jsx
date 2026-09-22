"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { publicContainerClassName } from "../components/layoutStyles";
import { supabase, listingImageUrl } from "../lib/supabase";
import { listingPhotos } from "../lib/listingPhotos";
import ListingTrust from "../components/ListingTrust";
import ListingIcon from "../components/ListingIcon";
import { utilities, utilitySummary, money } from "../lib/listingCosts";
import { listingUniversity } from "../lib/universities";

export default function RoomDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setListing(null); setSaved(false); setUserId(null); setRole(null); setAuthReady(false); setActivePhoto(0); setError("");
    async function load() {
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
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
          if (!active) return;
          setRole(profile?.role ?? "unknown");
          const { data: savedListing } = await supabase.from("saved_listings").select("listing_id").eq("listing_id", id).eq("student_id", user.id).maybeSingle();
          if (active) setSaved(Boolean(savedListing));
        }
        if (active) setAuthReady(true);
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
  const isOwner = Boolean(userId && listing?.landlord_id === userId);
  const photos = listingPhotos(listing);
  const nearest = listing ? listingUniversity(listing) : null;
  const rent = listing ? new Intl.NumberFormat("en-TH", { maximumFractionDigits: 0 }).format(Number(listing.monthly_rent)) : "";
  const lease = listing?.lease_duration_months ? `${listing.lease_duration_months} months` : "Not specified";
  const mapHref = `/map?listing=${encodeURIComponent(id)}`;

  return <main className={`${publicContainerClassName} py-6 text-ink sm:py-8`}>
    <Link href={isOwner ? "/listings" : "/explore"} className="inline-flex min-h-10 items-center text-sm font-semibold text-muted hover:text-accent">{isOwner ? "← Back to My Listings" : "← Back to Explore"}</Link>
    {error && <p role="alert" className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-accent">{error}</p>}
    {!listing ? <div role="status" className="my-10 rounded-2xl border border-line bg-surface p-8">
      <h1 className="text-xl font-semibold">{error ? "This home is unavailable" : "Loading home…"}</h1>
      {error && <p className="mt-2 text-sm text-muted">Return to Explore to find another home.</p>}
    </div> : <>
      <header className="mb-6 mt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-surface-muted px-3 py-1.5 capitalize">{listing.property_type}</span>
          {isOwner && <span className="rounded-full border border-line px-3 py-1.5 capitalize">Your listing · {listing.status}</span>}
        </div>
        <h1 className="mt-3 max-w-4xl break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{listing.title}</h1>
        <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-muted">{listing.address}</p>
      </header>

      <div className="grid min-w-0 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
        <div className="min-w-0">
          <figure className="overflow-hidden rounded-2xl bg-surface-muted">
            <img src={listingImageUrl(photos[activePhoto])} alt={`${listing.title} — photo ${activePhoto + 1}`} className="aspect-[16/10] w-full object-cover" />
          </figure>
          {photos.length > 1 && <div className="mt-3" aria-label="Property photo gallery">
            <p className="mb-2 text-xs text-muted" aria-live="polite">Photo {activePhoto + 1} of {photos.length}</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((path, index) => <button key={`${path}-${index}`} type="button" onClick={() => setActivePhoto(index)} aria-label={`Show photo ${index + 1} of ${photos.length}`} aria-pressed={activePhoto === index} className={`w-24 shrink-0 overflow-hidden rounded-xl border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${activePhoto === index ? "border-accent" : "border-transparent"}`}>
                <img src={listingImageUrl(path)} alt="" className="aspect-[4/3] w-full object-cover" />
              </button>)}
            </div>
          </div>}
          <dl className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface py-5">
            <div className="min-w-0 px-3 sm:px-5"><dt className="text-xs text-muted">Home type</dt><dd className="mt-1 text-sm font-semibold capitalize">{listing.property_type}</dd></div>
            <div className="min-w-0 px-3 sm:px-5"><dt className="text-xs text-muted">Minimum lease</dt><dd className="mt-1 text-sm font-semibold">{lease}</dd></div>
            <div className="min-w-0 px-3 sm:px-5"><dt className="text-xs text-muted">Campus distance</dt><dd className="mt-1 text-sm font-semibold">{nearest ? `${nearest.distanceKm.toFixed(1)} km` : "Not specified"}</dd></div>
          </dl>

          <ListingTrust listingId={listing.id} />
          <section className="mt-8 border-b border-line pb-8" aria-labelledby="about-home">
            <h2 id="about-home" className="text-xl font-semibold tracking-tight">About this home</h2>
            <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-muted">{listing.description || "The landlord has not added a description yet. Ask about furnishings, facilities, and house rules when arranging a viewing."}</p>
          </section>

          <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="costs-lease">
            <h2 id="costs-lease" className="text-xl font-semibold tracking-tight">Costs & lease</h2>
            <p className="mt-1 text-sm text-muted">Rent, move-in costs and everyday essentials.</p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[['home', 'Monthly rent', `${money(listing.monthly_rent)} / month`], ['deposit', 'Security deposit', listing.security_deposit == null ? 'Not specified' : Number(listing.security_deposit) === 0 ? 'No deposit required' : money(listing.security_deposit)]].map(([icon, label, value]) => <div key={label} className="flex gap-3 rounded-xl bg-surface-muted p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-accent"><ListingIcon name={icon} /></span><div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div></div>)}
            </dl>
            <p className="mt-4 text-sm text-muted">Minimum lease: <span className="font-medium text-ink">{lease}</span></p>
            <dl className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
              {utilities.map(utility => <div key={utility.key} className="rounded-xl border border-line p-4"><dt className="flex items-center gap-2 text-sm text-muted"><span className="text-accent"><ListingIcon name={utility.key} /></span>{utility.label}</dt><dd className="mt-3 text-sm font-semibold">{utilitySummary(listing, utility)}</dd></div>)}
            </dl>
          </section>
          <section className="mt-5 rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="campus-transport">
            <div className="flex items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-accent"><ListingIcon name="van" className="size-6" /></span><div><h2 id="campus-transport" className="text-xl font-semibold tracking-tight">Campus van service</h2><p className="mt-1 text-sm text-muted">{{ included: 'Available · included in rent', paid: 'Available · extra charge', unavailable: 'No van service', unspecified: 'Not specified' }[listing.van_service || 'unspecified']}</p></div></div>
            {['included', 'paid'].includes(listing.van_service) && <p className="mt-4 whitespace-pre-line break-words border-t border-line pt-4 text-sm leading-7 text-muted">{listing.van_details || 'Ask the landlord about the destination campus, pickup point, schedule and fare.'}</p>}
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

        <aside aria-label={isOwner ? "Manage your listing" : "Rent and viewing"} className="min-w-0 rounded-2xl border border-line bg-surface p-6 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Monthly rent</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-2"><span className="text-4xl font-semibold tracking-tight tabular-nums">฿{rent}</span><span className="text-sm text-muted">/ month</span></p>
          <p className="mt-3 text-sm leading-6 text-muted">{listing.lease_duration_months ? `Minimum lease of ${listing.lease_duration_months} months.` : "Ask the landlord about lease length."}</p>
          <div className="my-5 border-t border-line" />
          {!authReady ? <p className="text-sm text-muted">Loading account…</p> : isOwner ? <div className="space-y-3">
            <p className="text-sm font-semibold">Manage your property</p>
            <p className="text-sm text-muted">{listing.status === "published" ? "Your home is visible in Explore." : "This draft is only visible to you and administrators."}</p>
            <Link href={`/listings/${id}/edit`} className="flex min-h-12 items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-canvas hover:bg-accent">Edit details & photos</Link>
            <Link href="/landlord-appointments" className="flex min-h-11 items-center justify-center rounded-full border border-line px-4 text-sm font-semibold hover:bg-surface-muted">Manage viewing requests</Link>
          </div> : role === "admin" ? <Link href="/manage-listings" className="flex min-h-12 items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-canvas">Manage listings</Link> : !userId || role === "student" ? <>
            <Link href={`/request-viewing?listing=${encodeURIComponent(id)}`} className="flex min-h-12 items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-canvas transition-colors hover:bg-accent">Request a viewing</Link>
            <p className="mt-3 text-center text-xs leading-5 text-muted">Choose a preferred time and send a request to the landlord.</p>
            <button type="button" onClick={toggleSaved} disabled={saving} aria-pressed={saved} className="mt-4 min-h-11 w-full rounded-full border border-line px-4 text-sm text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"><span className="font-semibold">{saving ? "Saving…" : saved ? "♥ Saved to your homes" : "♡ Save this home"}</span></button>
          </> : <p className="text-sm text-muted">Viewing requests are available to student accounts.</p>}
          <Link href={mapHref} className="mt-4 flex min-h-11 items-center justify-center rounded-full border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-muted">See on map ↗</Link>
        </aside>
      </div>
    </>}
  </main>;
}
