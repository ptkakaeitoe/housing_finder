"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import MapHomeDetails, { MapCloseIcon } from "../components/MapHomeDetails";
import { publicContainerClassName, publicPageTopSpacingClassName, publicPageHeadingClassName, publicPageLinkClassName } from "../components/layoutStyles";
import { useListings } from "../lib/useListings";
import { useSavedListings } from "../lib/useSavedListings";
import { listingImageUrl } from "../lib/supabase";
import { money } from "../lib/listingCosts";
import { animateMapCamera, mapCameraTarget } from "../lib/mapCamera";
import { universities, listingUniversity } from "../lib/universities";
import FilterBar from "../components/FilterBar";

import { loadMapLibraries, mapsKey, mapId } from "../lib/maps";
import { getLocalizedTitle, getLocalizedDescription } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

const DEFAULT_CENTER = { lat: 13.7563, lng: 100.5018 };

// Map pins sit on Google's tiles, not the app canvas, so they use fixed
// colors instead of theme tokens (which would go invisible in dark mode).
const PIN_LAYOUT = "w-max max-w-[176px] min-h-11 rounded-xl border px-3 py-2 text-left transition-transform cursor-pointer sm:max-w-[208px]";
const PIN_BASE = `${PIN_LAYOUT} border-[#e1e5e4] bg-white text-[#171b20] shadow-[0_2px_10px_rgba(15,20,25,.18)] hover:scale-105 hover:shadow-[0_4px_14px_rgba(15,20,25,.25)]`;
const PIN_ACTIVE = `${PIN_LAYOUT} border-[#171b20] bg-[#171b20] text-white shadow-[0_4px_14px_rgba(15,20,25,.3)] scale-105`;

function pinLabel(item, locale) { return money(item.monthly_rent, locale); }

function updatePinContent(el, item, t, locale) {
  const name = document.createElement("p");
  name.className = "truncate text-xs font-semibold leading-4";
  name.textContent = getLocalizedTitle(item, locale);
  const details = document.createElement("p");
  details.className = "mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-4";
  const type = document.createElement("span");
  type.className = "text-[10px] font-medium opacity-70";
  type.textContent = t(`common.propertyType.${item.property_type}`);
  const rent = document.createElement("span");
  rent.className = "text-[11px] font-semibold tabular-nums";
  rent.textContent = `${pinLabel(item, locale)} ${t("listingCard.perMonth")}`;
  details.append(type, rent);
  el.replaceChildren(name, details);
}

function boundsFor(points) {
  return { north: Math.max(...points.map((p) => p.latitude)), south: Math.min(...points.map((p) => p.latitude)), east: Math.max(...points.map((p) => p.longitude)), west: Math.min(...points.map((p) => p.longitude)) };
}

const floatingButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-canvas px-3 text-sm font-medium text-ink shadow-md hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-40";

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
  const [resultsOpen, setResultsOpen] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [mapError, setMapError] = useState("");
  const [locating, setLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const container = useRef(null);
  const mapRef = useRef(null);
  const libsRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraAnimation = useRef(null);

  // Refocus the map when its section changes size, without moving the
  // existing heading or search/filter controls above it.
  useLayoutEffect(() => {
    function measure() {
      if (!canvasRef.current) return;
      const next = { width: window.innerWidth, height: canvasRef.current.clientHeight };
      setViewport((current) => current.width === next.width && current.height === next.height ? current : next);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvasRef.current);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const visible = useMemo(() => listings.filter((item) =>
    (!search || `${item.title} ${item.address} ${item.description} ${getLocalizedTitle(item, locale)} ${getLocalizedDescription(item, locale)}`.toLowerCase().includes(search.toLowerCase())) &&
    (!type || item.property_type === type) &&
    (!minRent || Number(item.monthly_rent) >= Number(minRent)) &&
    (!maxRent || Number(item.monthly_rent) <= Number(maxRent)) &&
    (!leaseMax || !item.lease_duration_months || item.lease_duration_months <= Number(leaseMax)) &&
    (!maxDistanceKm || (listingUniversity(item)?.distanceKm ?? Infinity) <= Number(maxDistanceKm)) &&
    (!universitySlug || listingUniversity(item)?.university.slug === universitySlug)
  ), [listings, search, type, minRent, maxRent, leaseMax, maxDistanceKm, universitySlug, locale]);
  const selectedListing = visible.find((item) => item.id === selectedId);
  const mapReady = Boolean(mapsKey && mapId);
  const showResults = !selectedListing && (resultsOpen || !mapReady || Boolean(error) || (!loading && !visible.length));

  function paddingForMap(withPanel = false) {
    return {
      top: 136,
      right: withPanel && viewport.width >= 768 ? 440 : 112,
      bottom: withPanel && viewport.width < 768 ? Math.min(viewport.height * .45, 300) + 32 : 48,
      left: viewport.width < 768 ? 96 : 160,
    };
  }

  function showSingleHome(map, item, withPanel) {
    const padding = paddingForMap(withPanel);
    const center = mapCameraTarget({ lat: item.latitude, lng: item.longitude }, 14, { x: (padding.right - padding.left) / 2, y: (padding.bottom - padding.top) / 2 });
    map.moveCamera({ center, zoom: 14 });
  }

  function selectHome(id) {
    setSelectedId(id);
    setResultsOpen(false);
    setDetailExpanded(false);
  }

  function revealMap() {
    canvasRef.current?.scrollIntoView({ block: viewport.width < 768 ? "end" : "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  useEffect(() => {
    if (selectedListing && mapLoaded) revealMap();
    // Reveal the section when selecting a home, including a direct map link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListing?.id, mapLoaded]);

  function closeDetails() {
    markersRef.current.get(selectedId)?.el.closest("[role='button']")?.focus({ preventScroll: true });
    setSelectedId(""); setDetailExpanded(false);
  }

  function handleToggleSave(id) {
    if (!signedIn) { router.push("/login"); return; }
    toggle(id);
  }

  useEffect(() => {
    if (!mapsKey || !mapId || !container.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ Map }, { AdvancedMarkerElement }] = await loadMapLibraries();
        if (cancelled) return;
        mapRef.current = new Map(container.current, { center: DEFAULT_CENTER, zoom: 13, mapId, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, cameraControl: false, zoomControl: false, clickableIcons: false });
        mapRef.current.addListener("dragstart", () => cameraAnimation.current?.());
        libsRef.current = { AdvancedMarkerElement };
        setMapLoaded(true);
      } catch (cause) { if (!cancelled) setMapError(cause.message); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const cancel = () => cameraAnimation.current?.();
    element.addEventListener("pointerdown", cancel, { passive: true });
    element.addEventListener("wheel", cancel, { passive: true });
    return () => { element.removeEventListener("pointerdown", cancel); element.removeEventListener("wheel", cancel); };
  }, []);

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
      if (existing) {
        existing.marker.position = position;
        existing.marker.title = getLocalizedTitle(item, locale);
        updatePinContent(existing.el, item, t, locale);
        return;
      }
      const el = document.createElement("div");
      el.className = PIN_BASE;
      updatePinContent(el, item, t, locale);
      const marker = new AdvancedMarkerElement({ map, position, title: getLocalizedTitle(item, locale), content: el });
      marker.addListener("click", () => selectHome(item.id));
      markersRef.current.set(item.id, { marker, el });
    });
    if (!selectedId && located.length) {
      if (located.length === 1) {
        showSingleHome(map, located[0], showResults);
      } else map.fitBounds(boundsFor(located), paddingForMap(showResults));
    }
    // Selection has its own camera effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mapLoaded, viewport, t, locale, showResults]);

  useEffect(() => {
    if (!mapRef.current || !selectedUniversity || selectedId) return;
    mapRef.current.panTo({ lat: selectedUniversity.latitude, lng: selectedUniversity.longitude });
    mapRef.current.setZoom(14);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUniversity, mapLoaded]);

  useEffect(() => {
    markersRef.current.forEach((entry, id) => {
      entry.el.className = id === selectedId ? PIN_ACTIVE : PIN_BASE;
      entry.marker.zIndex = id === selectedId ? 1 : 0;
    });
  }, [selectedId, visible, mapLoaded]);

  // Keep the selected home in the unobstructed part of the map, alongside
  // the desktop card or above the mobile sheet. No second Google popup.
  useEffect(() => {
    if (!mapRef.current || !selectedListing) return;
    const map = mapRef.current;
    const zoom = Math.max(15, map.getZoom() ?? 15);
    const right = viewport.width >= 768 ? 420 : 0;
    const bottom = viewport.width < 768 ? viewport.height * (detailExpanded ? .75 : .45) + 24 : 0;
    const center = mapCameraTarget({ lat: selectedListing.latitude, lng: selectedListing.longitude }, zoom, { x: right / 2, y: (bottom - 88) / 2 });
    const cancel = animateMapCamera(map, { center, zoom });
    cameraAnimation.current = cancel;
    return cancel;
  }, [selectedListing, mapLoaded, viewport, detailExpanded]);

  useEffect(() => {
    if (selectedId && !visible.some((item) => item.id === selectedId) && !loading) {
      setSelectedId(""); setDetailExpanded(false); setResultsOpen(true);
    }
  }, [visible, selectedId, loading]);

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
        setLocating(false); setMapError("");
        if (!mapRef.current || !libsRef.current) return;
        cameraAnimation.current?.();
        setSelectedId(""); setResultsOpen(false);
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        mapRef.current.panTo(point);
        mapRef.current.setZoom(15);
        const { AdvancedMarkerElement } = libsRef.current;
        if (userMarkerRef.current) userMarkerRef.current.map = null;
        const pin = document.createElement("div");
        pin.className = "size-4 rounded-full border-2 border-white bg-[#3269ab] shadow-md";
        userMarkerRef.current = new AdvancedMarkerElement({ map: mapRef.current, position: point, content: pin, title: t("map.yourLocation") });
      },
      () => { setLocating(false); setMapError(t("map.geoFailed")); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function showAllHomes() {
    if (!mapRef.current) return;
    const points = visible.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    if (!points.length) return;
    cameraAnimation.current?.();
    setSelectedId(""); setResultsOpen(true); setDetailExpanded(false);
    if (points.length === 1) { showSingleHome(mapRef.current, points[0], true); return; }
    mapRef.current.fitBounds(boundsFor(points), paddingForMap(true));
  }

  return <main className={`${publicContainerClassName} ${publicPageTopSpacingClassName} pb-8 lg:pb-6`}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className={publicPageHeadingClassName}>{t("search.heading", { university: selectedUniversity ? selectedUniversity.shortName : t("search.yourUniversity") })}</h1>
      <Link href="/" className={publicPageLinkClassName}>{t("map.listView")}</Link>
    </div>
    <FilterBar search={search} setSearch={setSearch}
      universitySlug={universitySlug} setUniversitySlug={setUniversitySlug} universities={universities}
      type={type} setType={setType} minRent={minRent} setMinRent={setMinRent} maxRent={maxRent} setMaxRent={setMaxRent}
      leaseMax={leaseMax} setLeaseMax={setLeaseMax} maxDistanceKm={maxDistanceKm} setMaxDistanceKm={setMaxDistanceKm} />
    {mapError && <p role="alert" className="mt-5 text-sm text-accent">{mapError}</p>}
    <div className="mb-4 mt-4 flex flex-wrap items-baseline justify-between gap-3">
      <span className="text-sm text-muted" role="status" aria-live="polite">{loading ? t("common.loading") : error ? t("search.resultsUnavailable") : t("search.placeCount", { count: visible.length })}</span>
      <span className="text-xs text-muted">{t("map.selectHint")}</span>
    </div>
    <section ref={canvasRef} data-map-canvas aria-label={t("map.mapAndHomes")} className="relative h-[clamp(320px,60dvh,440px)] w-full scroll-mt-24 rounded-lg bg-surface-muted text-ink lg:h-[clamp(560px,75dvh,900px)]">
    {mapReady && <div ref={container} aria-label={t("map.mapOfHomes")} className="absolute inset-0 overflow-hidden rounded-lg" />}
    {(!mapReady || !mapLoaded) && <div role="status" className="absolute inset-0 flex items-center justify-center p-6 text-center">
      <div className="max-w-xs rounded-2xl bg-canvas p-6 shadow-sm"><p className="font-semibold">{t(!mapReady || mapError ? "map.mapUnavailable" : "map.loadingMap")}</p><p className="mt-2 text-sm leading-6 text-muted">{t(!mapReady || mapError ? "map.mapUnavailableHint" : "map.mapLoadingHint")}</p></div>
    </div>}

    <div className={`absolute left-3 top-3 z-20 flex-row items-start gap-2 md:left-5 md:top-5 md:flex-col ${selectedListing && detailExpanded ? "hidden md:flex" : "flex"}`}>
      <button type="button" onClick={showAllHomes} disabled={!mapLoaded || !visible.length} aria-label={t("map.showAllHomes")} className={floatingButton}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" /></svg><span className="hidden sm:inline">{t("map.showAllHomes")}</span>
      </button>
      <button type="button" onClick={useMyLocation} disabled={!mapLoaded || locating} aria-label={t(locating ? "map.locating" : "map.myLocation")} className={floatingButton}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg>
      </button>
      <div className="flex overflow-hidden rounded-xl border border-line bg-canvas shadow-md md:flex-col">
        <button type="button" disabled={!mapLoaded} onClick={() => { cameraAnimation.current?.(); mapRef.current.setZoom(mapRef.current.getZoom() + 1); }} aria-label={t("map.zoomIn")} className="size-11 text-xl hover:bg-surface-muted disabled:opacity-40">+</button>
        <button type="button" disabled={!mapLoaded} onClick={() => { cameraAnimation.current?.(); mapRef.current.setZoom(mapRef.current.getZoom() - 1); }} aria-label={t("map.zoomOut")} className="size-11 text-xl hover:bg-surface-muted disabled:opacity-40">−</button>
      </div>
    </div>

    {!selectedListing && !showResults && <div className="absolute bottom-6 right-3 z-10 max-w-[calc(100%-6rem)] md:right-5">
      <button type="button" onClick={() => { setResultsOpen(true); revealMap(); }} className={`${floatingButton} flex-wrap justify-start px-4 py-2 text-left`}>
        <span>{t("map.browseHomes")}</span><span className="text-xs text-muted" role="status" aria-live="polite">{loading ? t("common.loading") : t("search.placeCount", { count: visible.length })}</span><span aria-hidden="true">↑</span>
      </button>
    </div>}

    {(showResults || selectedListing) && <div className={`absolute inset-x-3 bottom-6 z-10 overflow-hidden rounded-2xl border border-line bg-canvas shadow-xl transition-[height] duration-300 ease-out motion-reduce:transition-none ${selectedListing ? detailExpanded ? "h-[75%]" : "h-[60%]" : "h-[45%]"} md:inset-x-auto md:bottom-6 md:right-5 md:top-5 md:h-auto md:w-[380px]`}>
    {showResults && <aside key="results" aria-label={t("map.matchingHomes")} className="flex h-full min-h-0 flex-col motion-safe:animate-[map-panel-in_280ms_cubic-bezier(.22,1,.36,1)]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2">
        <div><h2 className="text-sm font-semibold">{t("map.matchingHomes")}</h2><p className="mt-1 text-xs text-muted" role="status" aria-live="polite">{loading ? t("common.loading") : t("search.placeCount", { count: visible.length })}</p></div>
        {mapReady && !error && visible.length > 0 && <button type="button" onClick={() => setResultsOpen(false)} aria-label={t("map.closePanel")} className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface-muted"><MapCloseIcon /></button>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        {error ? <div role="alert" className="p-3"><h3 className="text-sm font-semibold">{t("search.resultsUnavailable")}</h3><p className="mt-2 text-xs leading-5 text-muted">{error}</p><button type="button" onClick={refresh} className="mt-4 min-h-11 rounded-lg bg-ink px-4 text-sm font-medium text-canvas">{t("common.retry")}</button></div>
        : loading ? <p className="p-3 text-sm text-muted" role="status">{t("map.loadingHomes")}</p>
        : visible.length ? <ul className="space-y-1">{visible.map((item) => <li key={item.id}>
          <button type="button" onClick={() => selectHome(item.id)} className="flex min-h-24 w-full items-start gap-3 rounded-xl p-2 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink">
            <img src={listingImageUrl(item.image_path)} alt="" loading="lazy" className="size-20 shrink-0 rounded-lg bg-surface-muted object-cover" />
            <div className="min-w-0 flex-1"><p className="text-[11px] text-muted">{t(`common.propertyType.${item.property_type}`)}</p><h3 className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-5">{getLocalizedTitle(item, locale)}</h3><p className="mt-1 text-xs text-muted"><strong className="font-semibold text-ink tabular-nums">{money(item.monthly_rent, locale)}</strong> {t("listingCard.perMonth")}</p></div>
          </button>
        </li>)}</ul> : <div role="status" className="p-3"><h3 className="text-sm font-semibold">{t("map.noMatchingHeading")}</h3><p className="mt-2 text-xs leading-5 text-muted">{t("map.noMatchingHint")}</p></div>}
      </div>
    </aside>}

    {selectedListing && <MapHomeDetails key={selectedListing.id} listing={selectedListing} saved={savedIds.has(selectedListing.id)} isOwner={Boolean(userId && selectedListing.landlord_id === userId)} onToggleSave={handleToggleSave} onClose={closeDetails} onBack={() => { setSelectedId(""); setResultsOpen(true); setDetailExpanded(false); }} expanded={detailExpanded} onExpand={() => setDetailExpanded((current) => !current)} />}
    </div>}
    </section>
  </main>;
}

export default function MapPage() {
  const { t } = useLocale();
  return <Suspense fallback={<p className="p-8">{t("map.loadingMapFallback")}</p>}><MapContent /></Suspense>;
}
