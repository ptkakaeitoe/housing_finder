"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { publicContainerClassName } from "../components/layoutStyles";
import { useRouter } from "next/navigation";
import HousingCard from "../components/HousingCard";
import FilterBar from "../components/FilterBar";
import { useListings } from "../lib/useListings";
import { useSavedListings } from "../lib/useSavedListings";
import { isSupabaseConfigured } from "../lib/supabase";
import { universities, listingUniversity } from "../lib/universities";
import { getLocalizedTitle, getLocalizedDescription } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function ExplorePage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { listings, loading, error } = useListings();
  const { savedIds, toggle, signedIn, userId } = useSavedListings();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [leaseMax, setLeaseMax] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState("");
  const [universitySlug, setUniversitySlug] = useState("");
  const selectedUniversity = universities.find((u) => u.slug === universitySlug) ?? null;
  const visible = useMemo(() => listings.filter((listing) =>
    (!search || `${listing.title} ${listing.address} ${listing.description} ${getLocalizedTitle(listing, locale)} ${getLocalizedDescription(listing, locale)}`.toLowerCase().includes(search.toLowerCase())) &&
    (!type || listing.property_type === type) &&
    (!minRent || Number(listing.monthly_rent) >= Number(minRent)) &&
    (!maxRent || Number(listing.monthly_rent) <= Number(maxRent)) &&
    (!leaseMax || !listing.lease_duration_months || listing.lease_duration_months <= Number(leaseMax)) &&
    (!maxDistanceKm || (listingUniversity(listing)?.distanceKm ?? Infinity) <= Number(maxDistanceKm)) &&
    (!universitySlug || listingUniversity(listing)?.university.slug === universitySlug)
  ), [listings, search, type, minRent, maxRent, leaseMax, maxDistanceKm, universitySlug, locale]);

  function handleToggleSave(id) {
    if (!signedIn) { router.push("/login"); return; }
    toggle(id);
  }

  return <><main className={`${publicContainerClassName} py-10`}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{t("search.heading", { university: selectedUniversity ? selectedUniversity.shortName : t("search.yourUniversity") })}</h1>
      <Link href="/map" className="text-sm font-semibold text-ink underline decoration-line underline-offset-4 hover:text-accent">{t("search.viewMap")}</Link>
    </div>
    <FilterBar
      search={search} setSearch={setSearch}
      universitySlug={universitySlug} setUniversitySlug={setUniversitySlug} universities={universities}
      type={type} setType={setType}
      minRent={minRent} setMinRent={setMinRent}
      maxRent={maxRent} setMaxRent={setMaxRent}
      leaseMax={leaseMax} setLeaseMax={setLeaseMax}
      maxDistanceKm={maxDistanceKm} setMaxDistanceKm={setMaxDistanceKm}
    />
    <div className="mt-9 flex items-baseline justify-between"><span className="text-sm text-muted">{loading ? t("common.loading") : t("search.placeCount", { count: visible.length })}</span></div>
    {error && <p role="alert" className="mt-4 text-accent">{error}</p>}
    {!isSupabaseConfigured && <p className="mt-4 text-sm text-muted">{t("search.liveUnavailable")}</p>}
    {!loading && visible.length ? <div className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map((listing) => <HousingCard key={listing.id} listing={listing} isOwner={Boolean(userId && listing.landlord_id === userId)} saved={savedIds.has(listing.id)} onToggleSave={handleToggleSave} />)}</div> : !loading && isSupabaseConfigured && <p className="mt-8 text-muted">{t("search.noMatches")}</p>}
  </main></>;
}
