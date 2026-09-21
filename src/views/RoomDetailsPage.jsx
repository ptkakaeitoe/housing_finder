"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, listingImageUrl } from "../lib/supabase";
import { getMockListing } from "../lib/mockListings";
import { listingUniversity } from "../lib/universities";

export default function RoomDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const sample = getMockListing(id);
    if (sample) { setListing(sample); setError(""); return; }
    if (!supabase || !id) return;
    supabase.from("listings").select("*").eq("id", id).single().then(({ data, error: loadError }) => { setListing(data); setError(loadError?.message ?? ""); });
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) { const { data } = await supabase.from("saved_listings").select("listing_id").eq("listing_id", id).eq("student_id", user.id).maybeSingle(); setSaved(Boolean(data)); }
    });
  }, [id]);
  async function toggleSaved() {
    if (!userId) { router.push("/login"); return; }
    const query = saved ? supabase.from("saved_listings").delete().eq("listing_id", id).eq("student_id", userId) : supabase.from("saved_listings").insert({ listing_id: id, student_id: userId });
    const { error: saveError } = await query;
    if (saveError) setError(saveError.message); else setSaved(!saved);
  }
  const nearest = listing ? listingUniversity(listing) : null;
  return <><main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <Link href="/explore" className="text-sm font-semibold text-accent">← Back to Explore</Link>
    {error && <p role="alert" className="mt-6 text-accent">{error}</p>}
    {!listing ? <p className="mt-8 text-muted">{error ? "This home is unavailable." : "Loading home…"}</p> : <div className="mt-7 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
      <div><img src={listingImageUrl(listing.image_path)} alt={listing.title} className="aspect-[4/3] w-full rounded-xl object-cover" /><div className="mt-8 border-t border-line pt-6"><h2 className="text-xl font-semibold text-ink">Details</h2><p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{listing.description || "No description yet."}</p></div></div>
      <div className="lg:sticky lg:top-24 lg:self-start"><p className="text-sm capitalize text-muted">{listing.property_type}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">{listing.title}</h1><p className="mt-3 text-muted">{listing.address}</p>{nearest && <p className="mt-1 text-sm text-muted">{nearest.distanceKm.toFixed(1)} km from {nearest.university.name}</p>}{listing.is_mock && <p className="mt-5 border-l-2 border-accent pl-4 text-sm text-muted">Fictional sample · location is approximate</p>}<div className="mt-7 border-t border-line pt-6"><p className="text-sm text-muted">Monthly rent</p><p className="mt-1 text-4xl font-semibold text-ink">฿{Number(listing.monthly_rent).toLocaleString()}</p><div className="mt-6 flex flex-col gap-3">{!listing.is_mock && <><Link href={`/request-viewing?listing=${id}`} className="rounded-full bg-ink px-6 py-3 text-center font-bold text-canvas">Request a viewing</Link><button onClick={toggleSaved} className="rounded-full border border-line px-6 py-3 font-semibold text-ink">{saved ? "♥ Saved" : "♡ Save home"}</button></>}<Link href={`/map?listing=${id}`} className="text-center text-sm font-semibold text-accent">See on map ↗</Link></div></div></div>
    </div>}
  </main></>;
}
