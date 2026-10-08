"use client";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import CostCalculator from "../components/CostCalculator";
import { publicContainerClassName } from "../components/layoutStyles";
import { useListings } from "../lib/useListings";
import { useSavedListings } from "../lib/useSavedListings";
import { listingImageUrl } from "../lib/supabase";
import { universities, listingUniversity } from "../lib/universities";
import FilterBar from "../components/FilterBar";

import { loadMapLibraries, mapsKey, mapId } from "../lib/maps";
import { getLocalizedTitle } from "../lib/listingFields";
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
    (!search || `${item.title} ${item.address} ${item.description} ${getLocalizedTitle(item, locale)}`.toLowerCase().includes(search.toLowerCase())) &&
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

  return <><main className={`${publicContainerClassName} py-10`}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{t("search.heading", { university: selectedUniversity ? selectedUniversity.shortName : t("search.yourUniversity") })}</h1>
      <Link href="/" className="text-sm font-semibold text-ink underline decoration-line underline-offset-4">{t("map.listView")}</Link>
    </div>
    <FilterBar
      search={search} setSearch={setSearch}
      universitySlug={universitySlug} setUniversitySlug={setUniversitySlug} universities={universities}
      type={type} setType={setType}
      minRent={minRent} setMinRent={setMinRent}
      maxRent={maxRent} setMaxRent={setMaxRent}
      leaseMax={leaseMax} setLeaseMax={setLeaseMax}
      maxDistanceKm={maxDistanceKm} setMaxDistanceKm={setMaxDistanceKm}
      trailing={mapReady && <button type="button" onClick={useMyLocation} disabled={locating} className="flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 text-canvas transition-opacity hover:opacity-90 disabled:opacity-50">📍 <span className="text-sm font-semibold">{locating ? t("map.locating") : t("map.myLocation")}</span></button>}
    />
    {(error || mapError) && <p role="alert" className="mt-5 text-accent">{error || mapError}</p>}
    <section aria-label={t("map.mapAndHomes")} className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div><h2 className="text-sm font-semibold text-ink" aria-live="polite">{loading ? t("map.loadingHomes") : t("map.homesFound", { count: visible.length })}</h2><p className="mt-0.5 text-xs text-muted">{t("map.selectHint")}</p></div>
        <button type="button" onClick={showAllHomes} disabled={!mapLoaded || !visible.length} className="min-h-10 rounded-full border border-line px-4 text-ink hover:bg-surface-muted disabled:opacity-40"><span className="text-xs font-semibold">{t("map.showAllHomes")}</span></button>
      </div>
      <div className="grid lg:h-[clamp(480px,65dvh,760px)] lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="relative h-[380px] min-w-0 bg-surface-muted sm:h-[440px] lg:order-2 lg:h-full">
          {mapReady && <div ref={container} aria-label={t("map.mapOfHomes")} className="h-full w-full" />}
          {(!mapReady || !mapLoaded) && <div role="status" className="absolute inset-0 flex items-center justify-center p-8 text-center"><div className="max-w-xs rounded-2xl border border-line bg-surface p-6 shadow-sm"><p className="font-semibold text-ink">{!mapReady || mapError ? t("map.mapUnavailable") : t("map.loadingMap")}</p><p className="mt-2 text-sm leading-6 text-muted">{!mapReady || mapError ? t("map.mapUnavailableHint") : t("map.mapLoadingHint")}</p></div></div>}
        </div>
        <div ref={resultsRef} aria-label={t("map.matchingHomes")} className="min-h-0 min-w-0 divide-y divide-line overflow-y-auto overscroll-contain border-t border-line lg:order-1 lg:border-r lg:border-t-0">
          {visible.map((item) => {
            const active = item.id === selectedId;
            const nearest = listingUniversity(item);
            return <article key={item.id} ref={(node) => { if (node) cardRefs.current.set(item.id, node); else cardRefs.current.delete(item.id); }} onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)} className={`border-l-[3px] p-4 transition-colors ${active ? "border-l-accent bg-accent/5" : "border-l-transparent hover:bg-surface-muted/60"}`}>
              <div className="flex gap-3">
                <img src={listingImageUrl(item.image_path)} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-xl bg-surface-muted object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted">{t(`common.propertyType.${item.property_type}`)}</p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-ink"><Link href={`/rooms/${item.id}`} className="hover:text-accent">{getLocalizedTitle(item, locale)}</Link></h3>
                  <p className="mt-1 truncate text-xs text-muted">{nearest ? t("map.distanceDot", { distance: nearest.distanceKm.toFixed(1), university: nearest.university.shortName || nearest.university.name }) : item.address}</p>
                  <p className="mt-2 text-sm font-bold tabular-nums text-ink">{pinLabel(item)} <span className="text-xs font-normal text-muted">{t("listingCard.perMonth")}</span></p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" disabled={!mapLoaded} aria-pressed={active} onClick={() => setSelectedId(item.id)} className={`min-h-9 rounded-full border px-3 disabled:opacity-40 ${active ? "border-ink bg-ink text-canvas" : "border-line text-ink hover:border-accent"}`}><span className="text-xs font-semibold">{active ? t("map.selectedOnMap") : t("map.showOnMap")}</span></button>
                <CostCalculator listing={item} />
                <Link href={`/rooms/${item.id}`} className="inline-flex min-h-9 items-center px-1 text-xs font-semibold text-accent">{t("map.viewDetails")}</Link>
                <button type="button" aria-label={savedIds.has(item.id) ? t("map.unsaveHome") : t("listingCard.save")} aria-pressed={savedIds.has(item.id)} onClick={() => handleToggleSave(item.id)} className="ml-auto flex size-9 items-center justify-center rounded-full border border-line text-accent hover:bg-surface-muted">{savedIds.has(item.id) ? "♥" : "♡"}</button>
              </div>
            </article>;
          })}
          {loading && <p role="status" className="p-6 text-sm text-muted">{t("map.loadingMatching")}</p>}
          {!loading && !visible.length && <div className="p-6"><h3 className="font-semibold text-ink">{t("map.noMatchingHeading")}</h3><p className="mt-2 text-sm leading-6 text-muted">{t("map.noMatchingHint")}</p></div>}
        </div>
      </div>
    </section>
  </main></>;
}
export default function MapPage() {
  const { t } = useLocale();
  return <Suspense fallback={<p className="p-8">{t("map.loadingMapFallback")}</p>}><MapContent /></Suspense>;
}
