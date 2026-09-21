"use client";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useListings } from "../lib/useListings";
import { listingImageUrl } from "../lib/supabase";

import { loadMapLibraries, mapsKey, mapId } from "../lib/maps";

const DEFAULT_CENTER = { lat: 13.964, lng: 100.586 };

function accentColor() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--pink").trim();
  return value || "#c83450";
}

function infoWindowContent(item) {
  const card = document.createElement("div");
  card.className = "w-56 overflow-hidden rounded-xl";
  const img = document.createElement("img");
  img.src = listingImageUrl(item.image_path);
  img.alt = "";
  img.className = "h-28 w-full rounded-lg object-cover";
  const body = document.createElement("div");
  body.className = "pt-3";
  const row = document.createElement("div");
  row.className = "flex items-start justify-between gap-2";
  const name = document.createElement("p");
  name.className = "text-sm font-semibold leading-snug text-ink";
  name.textContent = item.title;
  const price = document.createElement("span");
  price.className = "shrink-0 text-sm font-bold text-ink";
  price.textContent = `฿${Number(item.monthly_rent).toLocaleString()}`;
  row.append(name, price);
  const meta = document.createElement("p");
  meta.className = "mt-1 text-xs text-muted";
  meta.textContent = item.is_mock ? "Sample · approximate location" : item.address;
  const link = document.createElement("a");
  link.href = `/rooms/${item.id}`;
  link.textContent = "View home →";
  link.className = "mt-2 inline-block text-xs font-semibold text-accent";
  body.append(row, meta, link);
  card.append(img, body);
  return card;
}

function MapContent() {
  const { listings, loading, error } = useListings();
  const initialSelected = useSearchParams().get("listing") ?? "";
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [selectedId, setSelectedId] = useState(initialSelected);
  const [mapError, setMapError] = useState("");
  const [locating, setLocating] = useState(false);

  const container = useRef(null);
  const mapRef = useRef(null);
  const libsRef = useRef(null);
  const infoRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const cardRefs = useRef(new Map());

  const visible = useMemo(() => listings.filter((item) =>
    (!search || `${item.title} ${item.address} ${item.description}`.toLowerCase().includes(search.toLowerCase())) &&
    (!type || item.property_type === type) &&
    (!maxRent || Number(item.monthly_rent) <= Number(maxRent))
  ), [listings, search, type, maxRent]);

  // Create the map once.
  useEffect(() => {
    if (!mapsKey || !mapId || !container.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ Map, InfoWindow }, { AdvancedMarkerElement, PinElement }] = await loadMapLibraries();
        if (cancelled) return;
        mapRef.current = new Map(container.current, { center: DEFAULT_CENTER, zoom: 13, mapId, mapTypeControl: false, streetViewControl: false });
        libsRef.current = { AdvancedMarkerElement, PinElement };
        infoRef.current = new InfoWindow();
      } catch (cause) { if (!cancelled) setMapError(cause.message); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Keep markers in sync with the filtered listing set.
  useEffect(() => {
    if (!mapRef.current || !libsRef.current) return;
    const map = mapRef.current;
    const { AdvancedMarkerElement, PinElement } = libsRef.current;
    const accent = accentColor();
    const currentIds = new Set(visible.map((item) => item.id));
    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) { marker.map = null; markersRef.current.delete(id); }
    }
    visible.forEach((item) => {
      const position = { lat: item.latitude, lng: item.longitude };
      const existing = markersRef.current.get(item.id);
      if (existing) { existing.position = position; return; }
      const pin = new PinElement({ background: accent, borderColor: accent, glyphColor: "#ffffff" });
      const marker = new AdvancedMarkerElement({ map, position, title: item.title, content: pin.element });
      marker.addEventListener("gmp-click", () => setSelectedId(item.id));
      markersRef.current.set(item.id, marker);
    });
    if (!selectedId && visible.length) {
      map.setCenter({ lat: visible[0].latitude, lng: visible[0].longitude });
      map.setZoom(13);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // React to selection: pan the map, open the info window, and highlight the matching card.
  useEffect(() => {
    if (!mapRef.current || !infoRef.current || !selectedId) return;
    const item = visible.find((entry) => entry.id === selectedId);
    const marker = markersRef.current.get(selectedId);
    if (!item || !marker) return;
    mapRef.current.panTo({ lat: item.latitude, lng: item.longitude });
    mapRef.current.setZoom(16);
    infoRef.current.setContent(infoWindowContent(item));
    infoRef.current.open({ anchor: marker, map: mapRef.current });
    cardRefs.current.get(selectedId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId, visible]);

  // Clean up markers on unmount.
  useEffect(() => () => {
    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current.clear();
    if (userMarkerRef.current) userMarkerRef.current.map = null;
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) { setMapError("Your browser doesn't support geolocation."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        if (!mapRef.current || !libsRef.current) return;
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        mapRef.current.panTo(point);
        mapRef.current.setZoom(15);
        const { AdvancedMarkerElement } = libsRef.current;
        if (userMarkerRef.current) userMarkerRef.current.map = null;
        const pin = document.createElement("div");
        pin.className = "h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.35)]";
        userMarkerRef.current = new AdvancedMarkerElement({ map: mapRef.current, position: point, content: pin, title: "Your location" });
      },
      () => { setLocating(false); setMapError("Couldn't get your location. Check your browser's location permission."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return <><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-7"><div><h1 className="text-4xl font-semibold tracking-[-.05em] text-ink">Map</h1><p className="mt-2 text-sm text-muted">Homes around Rangsit University</p></div><Link href="/" className="text-sm font-semibold text-ink underline decoration-line underline-offset-4">List view ↗</Link></div>
    {mapsKey && mapId && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
      <label className="text-xs font-semibold text-muted">Search area or property<input aria-label="Search properties" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, location, or feature" className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base text-ink outline-none focus:border-accent" /></label>
      <label className="text-xs font-semibold text-muted">Type<select value={type} onChange={(e) => setType(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base text-ink"><option value="">All types</option><option value="apartment">Apartment</option><option value="condo">Condo</option><option value="room">Room</option></select></label>
      <label className="text-xs font-semibold text-muted">Max monthly rent<input type="number" min="0" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} placeholder="Any budget" className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base text-ink" /></label>
      <button type="button" onClick={useMyLocation} disabled={locating} className="mt-auto min-h-12 rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-ink hover:border-accent disabled:opacity-60">{locating ? "Locating…" : "📍 Use my location"}</button>
    </div>}
    {(error || mapError) && <p role="alert" className="mt-5 text-accent">{error || mapError}</p>}
    {(!mapsKey || !mapId) && <p className="mt-5 text-sm text-muted">The interactive map is unavailable. Browse the homes below.</p>}
    {mapsKey && mapId && <div ref={container} role="application" aria-label="Map of housing listings" className="mt-7 h-[55svh] min-h-[340px] w-full rounded-3xl border border-line bg-surface-muted sm:h-[65svh]" />}
    <h2 className="mt-10 border-b border-line pb-3 text-xl font-semibold text-ink">{loading ? "Loading homes…" : `${visible.length} nearby homes`}</h2>
    <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{visible.map((item) => {
      const selected = item.id === selectedId;
      return <div
        key={item.id}
        ref={(node) => { if (node) cardRefs.current.set(item.id, node); else cardRefs.current.delete(item.id); }}
        role={mapsKey && mapId ? "button" : undefined}
        tabIndex={mapsKey && mapId ? 0 : undefined}
        onClick={mapsKey && mapId ? () => setSelectedId(item.id) : undefined}
        onKeyDown={mapsKey && mapId ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(item.id); } } : undefined}
        className={`border-b py-5 transition-colors ${mapsKey && mapId ? "cursor-pointer hover:text-accent" : ""} ${selected ? "border-accent" : "border-line"}`}
      >
        <div className="flex justify-between gap-3"><strong className="text-ink">{item.title}</strong><span className="shrink-0 font-semibold text-ink">฿{Number(item.monthly_rent).toLocaleString()}</span></div>
        <span className="mt-1 block text-sm text-muted">{item.address}</span>
        {item.is_mock && <span className="mt-1 block text-xs text-muted">Sample · approximate location</span>}
        <Link href={`/rooms/${item.id}`} onClick={(e) => e.stopPropagation()} className="mt-2 inline-block text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:text-accent">View home →</Link>
      </div>;
    })}</div>
    {!loading && !visible.length && <p className="mt-8 text-muted">No matches. Try a different search or budget.</p>}
  </main></>;
}
export default function MapPage() { return <Suspense fallback={<p className="p-8">Loading map…</p>}><MapContent /></Suspense>; }
