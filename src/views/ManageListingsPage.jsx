"use client";
import { useEffect, useState } from "react";
import AdminListingActions from "../components/AdminListingActions";
import HousingCard from "../components/HousingCard";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
export default function ManageListingsPage() {
  const admin = useAdmin();
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState({});
  const [reviewReady, setReviewReady] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(null);
  const [error, setError] = useState("");
  async function refresh() { const { data, error: queryError } = await supabase.from("listings").select("*, landlord:profiles!listings_landlord_id_fkey(full_name)").order("created_at", { ascending: false }); setListings(data ?? []); setError(queryError?.message ?? ""); }
  async function loadReviews() {
    const { data, error } = await supabase.from("listing_reviews").select("listing_id,status");
    setReviewReady(!error);
    if (error) setError(error.message);
    else setReviews(Object.fromEntries(data.map(row => [row.listing_id, row.status])));
  }
  useEffect(() => { if (admin) { refresh(); loadReviews(); } }, [admin]);
  async function reviewListing(id, status) {
    setReviewBusy(id); setError("");
    try {
      const { error } = await supabase.from("listing_reviews").upsert({ listing_id: id, status, reviewed_at: new Date().toISOString() });
      if (error) throw error;
      await loadReviews();
    } catch (cause) { setError(cause.message); }
    finally { setReviewBusy(null); }
  }
  async function changeStatus(id, status) { const { error: updateError } = await supabase.from("listings").update({ status }).eq("id", id); if (updateError) setError(updateError.message); else refresh(); }
  async function remove(id) { if (!window.confirm("Delete this listing permanently?")) return; const { error: deleteError } = await supabase.from("listings").delete().eq("id", id); if (deleteError) setError(deleteError.message); else refresh(); }
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12"><h1 className="text-4xl font-semibold tracking-tight text-ink">Listings</h1>{admin === false && <p className="mt-8 text-muted">Admin access required.</p>}{error && <p role="alert" className="mt-5 text-accent">{error}</p>}{admin && (listings.length ? <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <HousingCard key={listing.id} listing={listing} action={<AdminListingActions listing={listing} review={reviews[listing.id]} ready={reviewReady} busy={reviewBusy !== null} onReview={reviewListing} onVisibility={changeStatus} onDelete={remove} />} />)}</div> : <p className="mt-8 border-t border-line py-8 text-muted">No listings yet.</p>)}</main>;
}
