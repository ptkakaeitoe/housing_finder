"use client";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useListings } from "../lib/useListings";
import { useSavedListings } from "../lib/useSavedListings";
import { listingImageUrl } from "../lib/supabase";
import { universities, listingUniversity } from "../lib/universities";
import FilterBar from "../components/FilterBar";
import HousingCard from "../components/HousingCard";

import { loadMapLibraries, mapsKey, mapId } from "../lib/maps";

const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 };

// Map pins sit on Google's tiles, not the app canvas, so they use fixed
// colors instead of theme tokens (which would go invisible in dark mode).
const PIN_BASE = "flex items-center justify-center rounded-full border border-[#e1e5e4] bg-white px-3 py-1.5 text-xs font-bold text-[#171b20] shadow-[0_2px_10px_rgba(15,20,25,.18)] transition-transform hover:scale-105 hover:shadow-[0_4px_14px_rgba(15,20,25,.25)] cursor-pointer";
const PIN_ACTIVE = "flex items-center justify-center rounded-full border border-[#171b20] bg-[#171b20] px-3 py-1.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(15,20,25,.3)] scale-110 transition-transform cursor-pointer";

function pinLabel(item) { return `฿${Number(item.monthly_rent).toLocaleString()}`; }

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
  price.textContent = pinLabel(item);
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
  const router = useRouter();
  const { listings, loading, error } = useListings();
  const { savedIds, toggle, signedIn } = useSavedListings();
  const initialSelected = useSearchParams().get("listing") ?? "";
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [leaseMax, setLeaseMax] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState("");
  const [universitySlug, setUniversitySlug] = useState("");
  const selectedUniversity = universities.find((u) => u.slug === universitySlug) ?? null;
  const [selectedId, setSelectedId] = useState(initialSelected);
  const [hoveredId, setHoveredId] = useState(null);
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
    (!minRent || Number(item.monthly_rent) >= Number(minRent)) &&
    (!maxRent || Number(item.monthly_rent) <= Number(maxRent)) &&
    (!leaseMax || !item.lease_duration_months || item.lease_duration_months <= Number(leaseMax)) &&
    (!maxDistanceKm || (listingUniversity(item)?.distanceKm ?? Infinity) <= Number(maxDistanceKm)) &&
    (!universitySlug || listingUniversity(item)?.university.slug === universitySlug)
  ), [listings, search, type, minRent, maxRent, leaseMax, maxDistanceKm, universitySlug]);

  function handleToggleSave(id) {
    if (!signedIn) { router.push("/login"); return; }
    toggle(id);
  }

  // Create the map once.
  useEffect(() => {
    if (!mapsKey || !mapId || !container.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ Map, InfoWindow }, { AdvancedMarkerElement }] = await loadMapLibraries();
        if (cancelled) return;
        mapRef.current = new Map(container.current, { center: DEFAULT_CENTER, zoom: 13, mapId, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false });
        libsRef.current = { AdvancedMarkerElement };
        infoRef.current = new InfoWindow();
      } catch (cause) { if (!cancelled) setMapError(cause.message); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Keep price-pin markers in sync with the filtered listing set.
  useEffect(() => {
    if (!mapRef.current || !libsRef.current) return;
    const map = mapRef.current;
    const { AdvancedMarkerElement } = libsRef.current;
    const currentIds = new Set(visible.map((item) => item.id));
    for (const [id, entry] of markersRef.current) {
      if (!currentIds.has(id)) { entry.marker.map = null; markersRef.current.delete(id); }
    }
    visible.forEach((item) => {
      const position = { lat: item.latitude, lng: item.longitude };
      const existing = markersRef.current.get(item.id);
      if (existing) { existing.marker.position = position; existing.el.textContent = pinLabel(item); return; }
      const el = document.createElement("div");
      el.className = PIN_BASE;
      el.textContent = pinLabel(item);
      const marker = new AdvancedMarkerElement({ map, position, title: item.title, content: el });
      marker.addEventListener("gmp-click", () => setSelectedId(item.id));
      markersRef.current.set(item.id, { marker, el });
    });
    if (!selectedId && visible.length) {
      map.setCenter({ lat: visible[0].latitude, lng: visible[0].longitude });
      map.setZoom(13);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Jump to the chosen campus when the university filter changes.
  useEffect(() => {
    if (!mapRef.current || !selectedUniversity) return;
    mapRef.current.panTo({ lat: selectedUniversity.latitude, lng: selectedUniversity.longitude });
    mapRef.current.setZoom(14);
  }, [selectedUniversity]);

  // Restyle pins as the selected or hovered listing changes, keeping map and list in sync.
  useEffect(() => {
    const activeId = selectedId || hoveredId;
    markersRef.current.forEach((entry, id) => { entry.el.className = id === activeId ? PIN_ACTIVE : PIN_BASE; });
  }, [selectedId, hoveredId, visible]);

  // On selection: pan the map, open the info window, and highlight the matching card.
  useEffect(() => {
    if (!mapRef.current || !infoRef.current || !selectedId) return;
    const item = visible.find((entry) => entry.id === selectedId);
    const marker = markersRef.current.get(selectedId)?.marker;
    if (!item || !marker) return;
    mapRef.current.panTo({ lat: item.latitude, lng: item.longitude });
    if (mapRef.current.getZoom() < 15) mapRef.current.setZoom(15);
    infoRef.current.setContent(infoWindowContent(item));
    infoRef.current.open({ anchor: marker, map: mapRef.current });
    cardRefs.current.get(selectedId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId, visible]);

  // Clean up markers on unmount.
  useEffect(() => () => {
    markersRef.current.forEach((entry) => { entry.marker.map = null; });
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

  const mapReady = Boolean(mapsKey && mapId);

  return <><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Homes near {selectedUniversity ? selectedUniversity.shortName : "your university"}</h1>
      <Link href="/" className="text-sm font-semibold text-ink underline decoration-line underline-offset-4">List view ↗</Link>
    </div>
    <FilterBar
      search={search} setSearch={setSearch}
      universitySlug={universitySlug} setUniversitySlug={setUniversitySlug} universities={universities}
      type={type} setType={setType}
      minRent={minRent} setMinRent={setMinRent}
      maxRent={maxRent} setMaxRent={setMaxRent}
      leaseMax={leaseMax} setLeaseMax={setLeaseMax}
      maxDistanceKm={maxDistanceKm} setMaxDistanceKm={setMaxDistanceKm}
      trailing={mapReady && <button type="button" onClick={useMyLocation} disabled={locating} className="flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 text-canvas transition-opacity hover:opacity-90 disabled:opacity-50">📍 <span className="text-sm font-semibold">{locating ? "Locating…" : "My location"}</span></button>}
    />
    {(error || mapError) && <p role="alert" className="mt-5 text-accent">{error || mapError}</p>}
    {!mapReady && <p className="mt-5 text-sm text-muted">The interactive map is unavailable. Browse the homes below.</p>}

    <div className={`mt-7 flex flex-col gap-6 ${mapReady ? "lg:h-[calc(100svh-15rem)] lg:flex-row lg:items-stretch" : ""}`}>
      <div className={`min-w-0 lg:order-1 ${mapReady ? "lg:w-[420px] lg:shrink-0 lg:overflow-y-auto lg:pr-1 xl:w-[480px]" : "flex-1"}`}>
        <p className="pb-4 text-sm text-muted">{loading ? "Loading homes…" : `${visible.length} ${visible.length === 1 ? "place" : "places"}`}</p>
        <div className={mapReady ? "grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-1" : "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
          {visible.map((item) => {
            const active = mapReady && (item.id === selectedId || item.id === hoveredId);
            return <div
              key={item.id}
              ref={(node) => { if (node) cardRefs.current.set(item.id, node); else cardRefs.current.delete(item.id); }}
              onMouseEnter={mapReady ? () => setHoveredId(item.id) : undefined}
              onMouseLeave={mapReady ? () => setHoveredId((id) => (id === item.id ? null : id)) : undefined}
              onClick={mapReady ? () => setSelectedId(item.id) : undefined}
              className={`rounded-2xl transition-shadow ${active ? "ring-2 ring-ink ring-offset-2 ring-offset-canvas" : ""}`}
            >
              <HousingCard listing={item} saved={savedIds.has(item.id)} onToggleSave={handleToggleSave} />
            </div>;
          })}
        </div>
        {!loading && !visible.length && <p className="mt-8 text-muted">No matches. Try a different search or budget.</p>}
      </div>

      {mapReady && <div className="min-h-[360px] flex-1 overflow-hidden rounded-3xl border border-line bg-surface-muted lg:order-2">
        <div ref={container} role="application" aria-label="Map of housing listings" className="h-full min-h-[360px] w-full" />
      </div>}
    </div>
  </main></>;
}
export default function MapPage() { return <Suspense fallback={<p className="p-8">Loading map…</p>}><MapContent /></Suspense>; }
