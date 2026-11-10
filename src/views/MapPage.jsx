"use client";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import MapListingCard from "../components/MapListingCard";
import { publicContainerClassName, publicPageHeadingClassName, publicPageLinkClassName } from "../components/layoutStyles";
import { useListings } from "../lib/useListings";
import { useSavedListings } from "../lib/useSavedListings";
import { listingImageUrl } from "../lib/supabase";
import { universities, listingUniversity } from "../lib/universities";
import FilterBar from "../components/FilterBar";

import { loadMapLibraries, mapsKey, mapId } from "../lib/maps";
import { getLocalizedTitle, getLocalizedDescription } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 };

// Map pins sit on Google's tiles, not the app canvas, so they use fixed
// colors instead of theme tokens (which would go invisible in dark mode).
const PIN_BASE = "flex items-center justify-center rounded-full border border-[#e1e5e4] bg-white px-3 py-1.5 text-xs font-bold text-[#171b20] shadow-[0_2px_10px_rgba(15,20,25,.18)] transition-transform hover:scale-105 hover:shadow-[0_4px_14px_rgba(15,20,25,.25)] cursor-pointer";
const PIN_ACTIVE = "flex items-center justify-center rounded-full border border-[#171b20] bg-[#171b20] px-3 py-1.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(15,20,25,.3)] scale-110 transition-transform cursor-pointer";

function pinLabel(item) { return `฿${Number(item.monthly_rent).toLocaleString()}`; }

function infoWindowContent(item, t, locale) {
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
  name.className = "text-sm font-semibold leading-snug text-[#171b20]";
  name.textContent = getLocalizedTitle(item, locale);
  const price = document.createElement("span");
  price.className = "shrink-0 text-sm font-bold text-[#171b20]";
  price.textContent = pinLabel(item);
  row.append(name, price);
  const meta = document.createElement("p");
  meta.className = "mt-1 text-xs text-[#647078]";
  meta.textContent = item.address;
  const link = document.createElement("a");
  link.href = `/rooms/${item.id}`;
  link.textContent = t("map.viewHome");
  link.className = "mt-2 inline-block text-xs font-semibold text-accent";
  body.append(row, meta, link);
  card.append(img, body);
  return card;
}

function MapContent() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { listings, loading, error, refresh } = useListings();
  const { savedIds, toggle, signedIn, userId } = useSavedListings();
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const resultsRef = useRef(null);

  const container = useRef(null);
  const mapRef = useRef(null);
  const libsRef = useRef(null);
  const infoRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const cardRefs = useRef(new Map());

  const visible = useMemo(() => listings.filter((item) =>
    (!search || `${item.title} ${item.address} ${item.description} ${getLocalizedTitle(item, locale)} ${getLocalizedDescription(item, locale)}`.toLowerCase().includes(search.toLowerCase())) &&
    (!type || item.property_type === type) &&
    (!minRent || Number(item.monthly_rent) >= Number(minRent)) &&
    (!maxRent || Number(item.monthly_rent) <= Number(maxRent)) &&
    (!leaseMax || !item.lease_duration_months || item.lease_duration_months <= Number(leaseMax)) &&
    (!maxDistanceKm || (listingUniversity(item)?.distanceKm ?? Infinity) <= Number(maxDistanceKm)) &&
    (!universitySlug || listingUniversity(item)?.university.slug === universitySlug)
  ), [listings, search, type, minRent, maxRent, leaseMax, maxDistanceKm, universitySlug, locale]);

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
        setMapLoaded(true);
      } catch (cause) { if (!cancelled) setMapError(cause.message); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Keep price-pin markers in sync with the filtered listing set.
  useEffect(() => {
    if (!mapRef.current || !libsRef.current) return;
    const map = mapRef.current;
    const { AdvancedMarkerElement } = libsRef.current;
    const located = visible.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    const currentIds = new Set(located.map((item) => item.id));
    for (const [id, entry] of markersRef.current) {
      if (!currentIds.has(id)) { entry.marker.map = null; markersRef.current.delete(id); }
    }
    located.forEach((item) => {
      const position = { lat: item.latitude, lng: item.longitude };
      const existing = markersRef.current.get(item.id);
      if (existing) { existing.marker.position = position; existing.el.textContent = pinLabel(item); return; }
      const el = document.createElement("div");
      el.className = PIN_BASE;
      el.textContent = pinLabel(item);
      const marker = new AdvancedMarkerElement({ map, position, title: getLocalizedTitle(item, locale), content: el });
      marker.addListener("click", () => setSelectedId(item.id));
      markersRef.current.set(item.id, { marker, el });
    });
    if (!selectedId && located.length) {
      if (located.length === 1) {
        map.setCenter({ lat: located[0].latitude, lng: located[0].longitude });
        map.setZoom(14);
      } else {
        map.fitBounds({ north: Math.max(...located.map((p) => p.latitude)), south: Math.min(...located.map((p) => p.latitude)), east: Math.max(...located.map((p) => p.longitude)), west: Math.min(...located.map((p) => p.longitude)) }, 60);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mapLoaded]);

  // Jump to the chosen campus when the university filter changes.
  useEffect(() => {
    if (!mapRef.current || !selectedUniversity) return;
    mapRef.current.panTo({ lat: selectedUniversity.latitude, lng: selectedUniversity.longitude });
    mapRef.current.setZoom(14);
  }, [selectedUniversity, mapLoaded]);

  // Restyle pins as the selected or hovered listing changes, keeping map and list in sync.
  useEffect(() => {
    const activeId = hoveredId || selectedId;
    markersRef.current.forEach((entry, id) => { entry.el.className = id === activeId ? PIN_ACTIVE : PIN_BASE; });
  }, [selectedId, hoveredId, visible, mapLoaded]);

  // On selection: pan the map, open the info window, and highlight the matching card.
  useEffect(() => {
    if (!mapRef.current || !infoRef.current || !selectedId) return;
    const item = visible.find((entry) => entry.id === selectedId);
    const marker = markersRef.current.get(selectedId)?.marker;
    if (!item || !marker) return;
    mapRef.current.panTo({ lat: item.latitude, lng: item.longitude });
    if (mapRef.current.getZoom() < 15) mapRef.current.setZoom(15);
    infoRef.current.setContent(infoWindowContent(item, t, locale));
    infoRef.current.open({ anchor: marker, map: mapRef.current });
    const row = cardRefs.current.get(selectedId);
    const results = resultsRef.current;
    if (row && results) {
      const offset = row.getBoundingClientRect().top - results.getBoundingClientRect().top;
      if (offset < 0 || offset + row.offsetHeight > results.clientHeight) results.scrollTo({ top: results.scrollTop + offset - 12, behavior: "smooth" });
    }
  }, [selectedId, visible, mapLoaded, t, locale]);

  // Clean up markers on unmount.
  useEffect(() => () => {
    markersRef.current.forEach((entry) => { entry.marker.map = null; });
    markersRef.current.clear();
    if (userMarkerRef.current) userMarkerRef.current.map = null;
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) { setMapError(t("map.geoUnsupported")); return; }
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
        userMarkerRef.current = new AdvancedMarkerElement({ map: mapRef.current, position: point, content: pin, title: t("map.yourLocation") });
      },
      () => { setLocating(false); setMapError(t("map.geoFailed")); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function showAllHomes() {
    if (!mapRef.current || !visible.length) return;
    const points = visible.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    if (!points.length) return;
    setSelectedId(""); infoRef.current?.close();
    if (points.length === 1) { mapRef.current.setCenter({ lat: points[0].latitude, lng: points[0].longitude }); mapRef.current.setZoom(14); return; }
    mapRef.current.fitBounds({ north: Math.max(...points.map((p) => p.latitude)), south: Math.min(...points.map((p) => p.latitude)), east: Math.max(...points.map((p) => p.longitude)), west: Math.min(...points.map((p) => p.longitude)) }, 60);
  }

  useEffect(() => {
    if (selectedId && !visible.some((item) => item.id === selectedId) && !loading) {
      setSelectedId(""); infoRef.current?.close();
    }
  }, [visible, selectedId, loading]);

  const mapReady = Boolean(mapsKey && mapId);

  return <main className={`${publicContainerClassName} pb-8 pt-4 sm:pt-6`}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className={publicPageHeadingClassName}>{t("search.heading", { university: selectedUniversity ? selectedUniversity.shortName : t("search.yourUniversity") })}</h1>
      <Link href="/" className={publicPageLinkClassName}>{t("map.listView")}</Link>
    </div>
    <FilterBar
      compact
      search={search} setSearch={setSearch}
      universitySlug={universitySlug} setUniversitySlug={setUniversitySlug} universities={universities}
      type={type} setType={setType}
      minRent={minRent} setMinRent={setMinRent}
      maxRent={maxRent} setMaxRent={setMaxRent}
      leaseMax={leaseMax} setLeaseMax={setLeaseMax}
      maxDistanceKm={maxDistanceKm} setMaxDistanceKm={setMaxDistanceKm}
    />
    {mapError && <p role="alert" className="mt-5 text-sm text-accent">{mapError}</p>}
    <div className="mb-4 mt-4 flex flex-wrap items-baseline justify-between gap-3">
      <span className="text-sm text-muted" role="status" aria-live="polite">{loading ? t("common.loading") : error ? t("search.resultsUnavailable") : t("search.placeCount", { count: visible.length })}</span>
      <span className="text-xs text-muted">{t("map.selectHint")}</span>
    </div>
    <section aria-label={t("map.mapAndHomes")} className="grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <div className="relative h-[clamp(320px,60dvh,440px)] min-w-0 overflow-hidden rounded-lg bg-surface-muted lg:order-2 lg:h-[clamp(400px,calc(100dvh-360px),900px)]">
        {mapReady && <div ref={container} aria-label={t("map.mapOfHomes")} className="h-full w-full" />}
        {(!mapReady || !mapLoaded) && <div role="status" className="absolute inset-0 flex items-center justify-center p-8 text-center"><div className="max-w-xs p-6"><p className="font-semibold text-ink">{!mapReady || mapError ? t("map.mapUnavailable") : t("map.loadingMap")}</p><p className="mt-2 text-sm leading-6 text-muted">{!mapReady || mapError ? t("map.mapUnavailableHint") : t("map.mapLoadingHint")}</p></div></div>}
        {mapReady && <div className="absolute inset-x-3 top-3 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={showAllHomes} disabled={!mapLoaded || !visible.length} className="min-h-11 rounded-lg border border-line bg-canvas px-4 text-sm font-medium text-ink shadow-sm hover:bg-surface-muted disabled:opacity-50">{t("map.showAllHomes")}</button>
          <button type="button" onClick={useMyLocation} disabled={!mapLoaded || locating} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-canvas shadow-sm hover:opacity-80 disabled:opacity-50">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg>
            {locating ? t("map.locating") : t("map.myLocation")}
          </button>
        </div>}
      </div>
      <div ref={resultsRef} aria-label={t("map.matchingHomes")} className="min-h-0 min-w-0 lg:order-1 lg:max-h-[clamp(400px,calc(100dvh-360px),900px)] lg:overflow-y-auto lg:overscroll-contain lg:pr-3">
        {error ? <div role="alert" className="py-8">
          <h2 className="text-lg font-semibold text-ink">{t("search.resultsUnavailable")}</h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button type="button" onClick={refresh} className="mt-5 min-h-11 rounded-lg bg-ink px-5 text-sm font-medium text-canvas hover:opacity-80">{t("common.retry")}</button>
        </div> : loading ? <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{Array.from({ length: 4 }, (_, index) => <div key={index} className="animate-pulse py-4 motion-reduce:animate-none"><div className="flex gap-3"><div className="size-24 shrink-0 rounded-lg bg-surface-muted" /><div className="min-w-0 flex-1"><div className="h-3 w-1/3 rounded bg-surface-muted" /><div className="mt-3 h-4 w-full rounded bg-surface-muted" /><div className="mt-3 h-3 w-3/5 rounded bg-surface-muted" /></div></div><div className="mt-3 h-11 rounded-lg bg-surface-muted" /></div>)}</div>
        : visible.length ? <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-1">{visible.map((item) => <div key={item.id} ref={(node) => { if (node) cardRefs.current.set(item.id, node); else cardRefs.current.delete(item.id); }} onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)} className="min-w-0">
          <MapListingCard listing={item} isOwner={Boolean(userId && item.landlord_id === userId)} saved={savedIds.has(item.id)} onToggleSave={handleToggleSave} selected={item.id === selectedId} mapLoaded={mapLoaded} onSelect={() => setSelectedId(item.id)} />
        </div>)}</div>
        : <div role="status" className="py-10"><h2 className="font-semibold text-ink">{t("map.noMatchingHeading")}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">{t("map.noMatchingHint")}</p></div>}
      </div>
    </section>
  </main>;
}
export default function MapPage() {
  const { t } = useLocale();
  return <Suspense fallback={<p className="p-8">{t("map.loadingMapFallback")}</p>}><MapContent /></Suspense>;
}
