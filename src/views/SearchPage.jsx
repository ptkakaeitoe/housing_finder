"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { publicPageClassName, publicPageHeadingClassName, publicPageLinkClassName } from "../components/layoutStyles";
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
  const { listings, loading, error, refresh } = useListings();
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

  const hasFilters = Boolean(search || type || minRent || maxRent || leaseMax || maxDistanceKm || universitySlug);
  function clearFilters() {
    setSearch(""); setType(""); setMinRent(""); setMaxRent(""); setLeaseMax(""); setMaxDistanceKm(""); setUniversitySlug("");
  }

  return <main className={publicPageClassName}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className={publicPageHeadingClassName}>{t("search.heading", { university: selectedUniversity ? selectedUniversity.shortName : t("search.yourUniversity") })}</h1>
      <Link href="/map" className={publicPageLinkClassName}>{t("search.viewMap")}</Link>
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
    <div className="mb-6 mt-10 flex items-baseline justify-between" role="status" aria-live="polite"><span className="text-sm text-muted">{loading ? t("common.loading") : error ? t("search.resultsUnavailable") : t("search.placeCount", { count: visible.length })}</span></div>
    {error ? <div role="alert" className="py-8">
      <h2 className="text-lg font-semibold text-ink">{t("search.resultsUnavailable")}</h2>
      <p className="mt-2 text-sm text-muted">{error}</p>
      <button type="button" onClick={refresh} className="mt-5 min-h-11 rounded-lg bg-ink px-5 text-sm font-medium text-canvas hover:opacity-80">{t("common.retry")}</button>
    </div> : loading ? <div aria-hidden="true" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="animate-pulse motion-reduce:animate-none"><div className="aspect-[4/3] rounded-lg bg-surface-muted" /><div className="mt-4 h-3 w-1/3 rounded bg-surface-muted" /><div className="mt-3 h-4 w-4/5 rounded bg-surface-muted" /><div className="mt-3 h-3 w-3/5 rounded bg-surface-muted" /></div>)}</div>
    : visible.length ? <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map((listing) => <HousingCard key={listing.id} listing={listing} isOwner={Boolean(userId && listing.landlord_id === userId)} saved={savedIds.has(listing.id)} onToggleSave={handleToggleSave} />)}</div>
    : <div role="status" className="py-10">
      <p className="max-w-md text-base text-muted">{t(!isSupabaseConfigured ? "search.liveUnavailable" : hasFilters ? "search.noMatches" : "search.noHomes")}</p>
      {hasFilters && <button type="button" onClick={clearFilters} className="mt-4 min-h-11 text-sm font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">{t("filters.clearAll")}</button>}
    </div>}
  </main>;
}
