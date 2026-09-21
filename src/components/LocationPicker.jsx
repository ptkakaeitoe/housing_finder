"use client";
import { useEffect, useRef, useState } from "react";
import { loadMapLibraries, mapsKey, mapId } from "../lib/maps";

export default function LocationPicker({ latitude, longitude, onChange }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!mapsKey || !mapId || !container.current) return;
    let disposed = false;
    (async () => {
      try {
        const [{ Map }, { AdvancedMarkerElement }] = await loadMapLibraries();
        if (disposed) return;
        const lat = Number(latitude), lng = Number(longitude);
        const initial = latitude !== "" && longitude !== "" ? { lat, lng } : { lat: 13.964, lng: 100.586 };
        const map = new Map(container.current, { center: initial, zoom: 15, mapId, mapTypeControl: false, streetViewControl: false });
        mapRef.current = { map, AdvancedMarkerElement };
        if (latitude !== "" && longitude !== "") markerRef.current = new AdvancedMarkerElement({ map, position: initial });
        map.addListener("click", (event) => {
          const point = event.latLng;
          if (!point) return;
          if (markerRef.current) markerRef.current.map = null;
          markerRef.current = new AdvancedMarkerElement({ map, position: point });
          onChange({ latitude: point.lat().toFixed(6), longitude: point.lng().toFixed(6) });
        });
      } catch (cause) { if (!disposed) setError(cause.message); }
    })();
    return () => { disposed = true; if (markerRef.current) markerRef.current.map = null; markerRef.current = null; mapRef.current = null; };
  }, []);
  useEffect(() => {
    if (!mapRef.current || latitude === "" || longitude === "") return;
    const position = { lat: Number(latitude), lng: Number(longitude) };
    if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return;
    mapRef.current.map.panTo(position);
    if (markerRef.current) markerRef.current.position = position;
    else markerRef.current = new mapRef.current.AdvancedMarkerElement({ map: mapRef.current.map, position });
  }, [latitude, longitude]);
  if (!mapsKey || !mapId) return <p className="text-sm text-muted">Add a Maps key and Map ID to click a location on the map. You can enter coordinates above for now.</p>;
  return <div><p className="mb-2 text-sm text-muted">Click the property location on the map.</p><div ref={container} className="h-72 w-full rounded-2xl border border-line bg-surface-muted" />{error && <p role="alert" className="mt-2 text-sm text-accent">{error}</p>}</div>;
}
