"use client";
import { useEffect, useState } from "react";
import HousingCard from "../components/HousingCard";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
export default function ManageListingsPage() {
  const admin = useAdmin();
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");
  async function refresh() { const { data, error: queryError } = await supabase.from("listings").select("*").order("created_at", { ascending: false }); setListings(data ?? []); setError(queryError?.message ?? ""); }
  useEffect(() => { if (admin) refresh(); }, [admin]);
  async function changeStatus(id, status) { const { error: updateError } = await supabase.from("listings").update({ status }).eq("id", id); if (updateError) setError(updateError.message); else refresh(); }
  async function remove(id) { if (!window.confirm("Delete this listing permanently?")) return; const { error: deleteError } = await supabase.from("listings").delete().eq("id", id); if (deleteError) setError(deleteError.message); else refresh(); }
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12"><h1 className="text-4xl font-semibold tracking-tight text-ink">Listings</h1>{admin === false && <p className="mt-8 text-muted">Admin access required.</p>}{error && <p role="alert" className="mt-5 text-accent">{error}</p>}{admin && (listings.length ? <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <HousingCard key={listing.id} listing={listing} action={<div className="flex flex-wrap gap-3 text-sm font-semibold"><button onClick={() => changeStatus(listing.id, listing.status === "published" ? "draft" : "published")} className="text-accent">{listing.status === "published" ? "Unpublish" : "Publish"}</button><button onClick={() => remove(listing.id)} className="text-muted hover:text-accent">Delete</button></div>} />)}</div> : <p className="mt-8 border-t border-line py-8 text-muted">No listings yet.</p>)}</main>;
}
