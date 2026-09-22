"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { listingPhotos, validateListingPhotos } from "../lib/listingPhotos";
import ListingCostsForm from "./ListingCostsForm";
import { listingCostPayload } from "../lib/listingCosts";
import LocationPicker from "./LocationPicker";
import { requireSupabase, supabase, listingImageUrl } from "../lib/supabase";
import { universities, nearestUniversity } from "../lib/universities";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base text-ink focus:border-accent focus:outline-none";
const fieldClass = "text-sm font-semibold text-ink";

export default function ListingForm({ edit = false }) {
  const router = useRouter();
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [coords, setCoords] = useState({ latitude: "", longitude: "" });
  const [universityId, setUniversityId] = useState("");
  const [universityTouched, setUniversityTouched] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!edit || !supabase || !id) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Sign in as the listing owner to edit this home."); return; }
      const { data, error: loadError } = await supabase.from("listings").select("*").eq("id", id).eq("landlord_id", user.id).single();
      if (loadError) setError(loadError.message);
      else {
        setListing(data);
        setPhotos(listingPhotos(data).map(path => ({ path, key: path })));
        setCoords({ latitude: data.latitude, longitude: data.longitude });
        setUniversityId(data.university_id ?? "");
        setUniversityTouched(Boolean(data.university_id));
      }
    })();
  }, [edit, id]);

  function addPhotos(event) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const message = validateListingPhotos(files, photos.length);
    if (message) { setError(message); return; }
    setError("");
    setPhotos(current => [...current, ...files.map(file => ({ file, key: crypto.randomUUID() }))]);
  }

  function updateCoords(next) {
    setCoords(next);
    if (universityTouched) return;
    const suggestion = nearestUniversity(Number(next.latitude), Number(next.longitude));
    if (suggestion) setUniversityId(suggestion.university.id);
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const uploaded = [];
    let committed = false;
    try {
      const client = requireSupabase();
      const { data: { user } } = await client.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "landlord") throw new Error("Sign in with a landlord account to manage listings.");
      const payload = {
        ...listingCostPayload(form),
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
      if (edit && listing?.landlord_id !== user.id) throw new Error("Only the owner can edit this listing.");
      const photoError = validateListingPhotos(photos.filter(photo => photo.file).map(photo => photo.file), photos.filter(photo => photo.path).length);
      if (photoError) throw new Error(photoError);
      const paths = [];
      for (const photo of photos) {
        if (photo.path) { paths.push(photo.path); continue; }
        const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[photo.file.type];
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await client.storage.from("listing-images").upload(path, photo.file, { contentType: photo.file.type });
        if (uploadError) throw uploadError;
        uploaded.push(path); paths.push(path);
      }
      payload.image_paths = paths;
      payload.image_path = paths[0] ?? null;
      const query = edit ? client.from("listings").update(payload).eq("id", id).eq("landlord_id", user.id) : client.from("listings").insert(payload);
      const { error: saveError } = await query.select("id").single();
      if (saveError) throw saveError;
      committed = true;
      router.push("/listings"); router.refresh();
    } catch (cause) {
      if (!committed && uploaded.length) await supabase.storage.from("listing-images").remove(uploaded);
      setError(cause.message);
    } finally { setBusy(false); }
  }

  return <><main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    
    <h1 className="text-4xl font-semibold tracking-tight text-ink">{edit ? "Edit your listing" : "Add a home"}</h1>
    
    {edit && !listing ? <p role={error ? "alert" : "status"} className="mt-8 text-muted">{error || "Loading listing…"}</p> : <form key={listing?.id ?? "new"} onSubmit={save} className="mt-8 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
      <label className={fieldClass}>Property name<input className={inputClass} name="title" required minLength="3" defaultValue={listing?.title ?? ""} placeholder="e.g. Campus View Studio" /></label>
      <label className={fieldClass}>Type<select className={inputClass} name="property_type" defaultValue={listing?.property_type ?? "room"}><option value="room">Room</option><option value="apartment">Apartment</option><option value="condo">Condo</option></select></label>
      <label className={fieldClass}>Monthly rent (THB)<input className={inputClass} name="monthly_rent" type="number" min="0" step="0.01" required defaultValue={listing?.monthly_rent ?? ""} /></label>
      <label className={fieldClass}>Visibility<select className={inputClass} name="status" defaultValue={listing?.status ?? "published"}><option value="published">Published</option><option value="draft">Draft</option></select></label>
      <label className={`${fieldClass} sm:col-span-2`}>Minimum lease<select className={inputClass} name="lease_duration_months" defaultValue={listing?.lease_duration_months ?? ""}><option value="">No minimum</option><option value="1">1 month</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option></select></label>
      <ListingCostsForm key={listing?.id ?? "new-costs"} listing={listing} />
      <label className={`${fieldClass} sm:col-span-2`}>Address<input className={inputClass} name="address" required defaultValue={listing?.address ?? ""} placeholder="Street, district, Bangkok/Pathum Thani" /></label>
      <label className={fieldClass}>Latitude<input className={inputClass} type="number" step="any" min="-90" max="90" required value={coords.latitude} onChange={(e) => updateCoords({ ...coords, latitude: e.target.value })} /></label>
      <label className={fieldClass}>Longitude<input className={inputClass} type="number" step="any" min="-180" max="180" required value={coords.longitude} onChange={(e) => updateCoords({ ...coords, longitude: e.target.value })} /></label>
      <div className="sm:col-span-2"><LocationPicker latitude={coords.latitude} longitude={coords.longitude} onChange={updateCoords} /></div>
      <button type="button" className="justify-self-start text-sm font-semibold text-accent underline sm:col-span-2" onClick={() => navigator.geolocation?.getCurrentPosition((position) => updateCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => setError("Location unavailable. Enter coordinates manually."))}>Use my current location</button>
      <label className={`${fieldClass} sm:col-span-2`}>Nearest university<select className={inputClass} value={universityId} onChange={(e) => { setUniversityTouched(true); setUniversityId(e.target.value); }}><option value="">None / not near a listed campus</option>{universities.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.city}</option>)}</select></label>
      <label className={`${fieldClass} sm:col-span-2`}>Description<textarea className={`${inputClass} min-h-32 py-3`} name="description" defaultValue={listing?.description ?? ""} placeholder="Tell students about amenities, rules, and nearby transport." /></label>
      <section className="sm:col-span-2" aria-labelledby="photos-heading">
        <h2 id="photos-heading" className={fieldClass}>Property photos</h2>
        <p id="photos-help" className="mt-2 text-sm text-muted">Add up to 10 JPG, PNG or WebP photos, up to 5 MB each. The first photo is the cover shown on listing cards.</p>
        <label className="mt-3 block text-sm font-semibold text-ink">Add photos
          <input className={`${inputClass} pt-2`} type="file" multiple disabled={busy} accept="image/jpeg,image/png,image/webp" aria-describedby="photos-help" onChange={addPhotos} />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo, index) => <div key={photo.key} className="overflow-hidden rounded-xl border border-line">
            <PhotoPreview photo={photo} index={index} />
            <div className="space-y-2 p-3 text-xs">
              <p className="font-semibold text-ink">{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</p>
              <div className="flex flex-wrap gap-3">
                {index > 0 && <button type="button" disabled={busy} className="min-h-9 text-accent" onClick={() => setPhotos(current => [current[index], ...current.filter((_, i) => i !== index)])}>Make cover</button>}
                <button type="button" disabled={busy} className="min-h-9 text-muted" aria-label={`Remove photo ${index + 1}`} onClick={() => setPhotos(current => current.filter(item => item.key !== photo.key))}>Remove</button>
              </div>
            </div>
          </div>)}
        </div>
        <p className="mt-2 text-xs text-muted">{photos.length}/10 photos. Photo changes are applied when you save.</p>
      </section>
      {error && <p role="alert" className="text-sm text-accent sm:col-span-2">{error}</p>}
      <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-ink px-7 font-bold text-canvas disabled:opacity-50 sm:col-span-2">{busy ? "Saving…" : edit ? "Save changes" : "Publish listing"}</button>
    </form>}
  </main></>;
}

function PhotoPreview({ photo, index }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!photo.file) return;
    const url = URL.createObjectURL(photo.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo.file]);
  const src = photo.path ? listingImageUrl(photo.path) : preview;
  return src ? <img src={src} alt={`Property photo ${index + 1}`} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-surface-muted" />;
}
