"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LocationPicker from "./LocationPicker";
import { requireSupabase, supabase, listingImageUrl } from "../lib/supabase";
import { universities, nearestUniversity } from "../lib/universities";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base text-ink focus:border-accent focus:outline-none";
const fieldClass = "text-sm font-semibold text-ink";

export default function ListingForm({ edit = false }) {
  const router = useRouter();
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [image, setImage] = useState(null);
  const [coords, setCoords] = useState({ latitude: "", longitude: "" });
  const [universityId, setUniversityId] = useState("");
  const [universityTouched, setUniversityTouched] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!edit || !supabase || !id) return;
    supabase.from("listings").select("*").eq("id", id).single().then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message);
      else {
        setListing(data);
        setCoords({ latitude: data.latitude, longitude: data.longitude });
        setUniversityId(data.university_id ?? "");
        setUniversityTouched(Boolean(data.university_id));
      }
    });
  }, [edit, id]);

  function updateCoords(next) {
    setCoords(next);
    if (universityTouched) return;
    const suggestion = nearestUniversity(Number(next.latitude), Number(next.longitude));
    if (suggestion) setUniversityId(suggestion.university.id);
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const client = requireSupabase();
      const { data: { user } } = await client.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "landlord") throw new Error("Sign in with a landlord account to manage listings.");
      const payload = {
        landlord_id: user.id,
        title: String(form.get("title")).trim(),
        property_type: form.get("property_type"),
        monthly_rent: Number(form.get("monthly_rent")),
        address: String(form.get("address")).trim(),
        latitude: Number(coords.latitude), longitude: Number(coords.longitude),
        description: String(form.get("description") ?? "").trim(),
        status: form.get("status"),
        university_id: universityId || null,
        lease_duration_months: form.get("lease_duration_months") ? Number(form.get("lease_duration_months")) : null,
      };
      if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude) || coords.latitude === "" || coords.longitude === "") throw new Error("Add a valid map location.");
      if (image) {
        const extension = image.name.split(".").pop().toLowerCase();
        if (!(["jpg", "jpeg", "png", "webp"].includes(extension)) || image.size > 5 * 1024 * 1024) throw new Error("Choose a JPG, PNG, or WebP image under 5 MB.");
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await client.storage.from("listing-images").upload(path, image, { contentType: image.type });
        if (uploadError) throw uploadError;
        payload.image_path = path;
      }
      const query = edit ? client.from("listings").update(payload).eq("id", id) : client.from("listings").insert(payload);
      const { error: saveError } = await query;
      if (saveError) throw saveError;
      router.push("/listings"); router.refresh();
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  return <><main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    
    <h1 className="text-4xl font-semibold tracking-tight text-ink">{edit ? "Edit your listing" : "Add a home"}</h1>
    
    {edit && !listing && !error ? <p className="mt-8 text-muted">Loading listing…</p> : <form key={listing?.id ?? "new"} onSubmit={save} className="mt-8 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
      <label className={fieldClass}>Property name<input className={inputClass} name="title" required minLength="3" defaultValue={listing?.title ?? ""} placeholder="e.g. Campus View Studio" /></label>
      <label className={fieldClass}>Type<select className={inputClass} name="property_type" defaultValue={listing?.property_type ?? "room"}><option value="room">Room</option><option value="apartment">Apartment</option><option value="condo">Condo</option></select></label>
      <label className={fieldClass}>Monthly rent (THB)<input className={inputClass} name="monthly_rent" type="number" min="0" step="0.01" required defaultValue={listing?.monthly_rent ?? ""} /></label>
      <label className={fieldClass}>Visibility<select className={inputClass} name="status" defaultValue={listing?.status ?? "published"}><option value="published">Published</option><option value="draft">Draft</option></select></label>
      <label className={`${fieldClass} sm:col-span-2`}>Minimum lease<select className={inputClass} name="lease_duration_months" defaultValue={listing?.lease_duration_months ?? ""}><option value="">No minimum</option><option value="1">1 month</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option></select></label>
      <label className={`${fieldClass} sm:col-span-2`}>Address<input className={inputClass} name="address" required defaultValue={listing?.address ?? ""} placeholder="Street, district, Bangkok/Pathum Thani" /></label>
      <label className={fieldClass}>Latitude<input className={inputClass} type="number" step="any" min="-90" max="90" required value={coords.latitude} onChange={(e) => updateCoords({ ...coords, latitude: e.target.value })} /></label>
      <label className={fieldClass}>Longitude<input className={inputClass} type="number" step="any" min="-180" max="180" required value={coords.longitude} onChange={(e) => updateCoords({ ...coords, longitude: e.target.value })} /></label>
      <div className="sm:col-span-2"><LocationPicker latitude={coords.latitude} longitude={coords.longitude} onChange={updateCoords} /></div>
      <button type="button" className="justify-self-start text-sm font-semibold text-accent underline sm:col-span-2" onClick={() => navigator.geolocation?.getCurrentPosition((position) => updateCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => setError("Location unavailable. Enter coordinates manually."))}>Use my current location</button>
      <label className={`${fieldClass} sm:col-span-2`}>Nearest university<select className={inputClass} value={universityId} onChange={(e) => { setUniversityTouched(true); setUniversityId(e.target.value); }}><option value="">None / not near a listed campus</option>{universities.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.city}</option>)}</select></label>
      <label className={`${fieldClass} sm:col-span-2`}>Description<textarea className={`${inputClass} min-h-32 py-3`} name="description" defaultValue={listing?.description ?? ""} placeholder="Tell students about amenities, rules, and nearby transport." /></label>
      <label className={`${fieldClass} sm:col-span-2`}>Property photo (JPG, PNG, WebP; max 5 MB)<input className={`${inputClass} pt-2`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] ?? null)} /></label>
      {listing?.image_path && <img className="h-28 w-40 rounded-xl object-cover sm:col-span-2" src={listingImageUrl(listing.image_path)} alt="Current listing" />}
      {error && <p role="alert" className="text-sm text-accent sm:col-span-2">{error}</p>}
      <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-ink px-7 font-bold text-canvas disabled:opacity-50 sm:col-span-2">{busy ? "Saving…" : edit ? "Save changes" : "Publish listing"}</button>
    </form>}
  </main></>;
}
