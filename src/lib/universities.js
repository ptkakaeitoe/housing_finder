// Mirrors supabase/migrations/20260921000000_universities.sql — same ids, so
// listings can be tagged with a university_id without an extra fetch.
export const universities = [
  { id: "e956675d-085e-4716-940c-02424174c782", slug: "chula", name: "Chulalongkorn University", shortName: "Chula", city: "Bangkok", latitude: 13.7367, longitude: 100.5231 },
  { id: "1c731019-d77a-4533-aea4-1c63c7f951d0", slug: "thammasat-rangsit", name: "Thammasat University (Rangsit Campus)", shortName: "Thammasat", city: "Pathum Thani", latitude: 14.0733, longitude: 100.6067 },
  { id: "91e61342-49ef-4b9c-b23e-2694744aee80", slug: "kasetsart", name: "Kasetsart University", shortName: "Kasetsart", city: "Bangkok", latitude: 13.8467, longitude: 100.5697 },
  { id: "01c42f18-6683-475a-b970-f963f6469ac8", slug: "mahidol-salaya", name: "Mahidol University (Salaya Campus)", shortName: "Mahidol", city: "Nakhon Pathom", latitude: 13.7963, longitude: 100.3241 },
  { id: "044680d9-498a-4f58-b937-f74459d39c7d", slug: "chiang-mai", name: "Chiang Mai University", shortName: "Chiang Mai", city: "Chiang Mai", latitude: 18.8032, longitude: 98.953 },
  { id: "10ffe474-15b6-470f-9073-9f5a71c122b1", slug: "rangsit", name: "Rangsit University", shortName: "Rangsit", city: "Pathum Thani", latitude: 13.9639, longitude: 100.6108 },
];

export function getUniversity(idOrSlug) {
  if (!idOrSlug) return null;
  return universities.find((u) => u.id === idOrSlug || u.slug === idOrSlug) ?? null;
}

// Haversine distance in kilometers.
export function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// The closest campus to a point, with its distance in km. Used both to
// auto-suggest a university when a landlord picks a location, and to filter
// or label listings that were never explicitly tagged with one.
export function nearestUniversity(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const university of universities) {
    const distance = distanceKm(latitude, longitude, university.latitude, university.longitude);
    if (distance < bestDistance) { bestDistance = distance; best = university; }
  }
  return best ? { university: best, distanceKm: bestDistance } : null;
}

// A listing's effective university: its explicit tag if set, otherwise the
// nearest campus to its coordinates.
export function listingUniversity(listing) {
  const tagged = getUniversity(listing.university_id);
  if (tagged) return { university: tagged, distanceKm: distanceKm(listing.latitude, listing.longitude, tagged.latitude, tagged.longitude) };
  return nearestUniversity(listing.latitude, listing.longitude);
}
