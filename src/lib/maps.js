let configured = false;
export const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
export const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

export async function loadMapLibraries() {
  if (!mapsKey || !mapId) throw new Error("Add a Google Maps API key and map ID to .env.local.");
  const { setOptions, importLibrary } = await import("@googlemaps/js-api-loader");
  if (!configured) { setOptions({ key: mapsKey, v: "weekly" }); configured = true; }
  return Promise.all([importLibrary("maps"), importLibrary("marker")]);
}
