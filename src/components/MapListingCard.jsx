"use client";

import Link from "next/link";
import { listingImageUrl } from "../lib/supabase";
import { money } from "../lib/listingCosts";
import { listingUniversity } from "../lib/universities";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function MapListingCard({ listing, saved, onToggleSave, isOwner, selected, mapLoaded, onSelect }) {
  const { t, locale } = useLocale();
  const title = getLocalizedTitle(listing, locale);
  const nearest = listingUniversity(listing);

  return <article className="min-w-0 border-b border-line pb-4 text-ink">
    <Link href={`/rooms/${listing.id}`} className="group flex min-w-0 items-start gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
      <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
        <img src={listingImageUrl(listing.image_path)} alt={title} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-4 text-muted">{isOwner ? t("listingCard.listedByYou") : t(`common.propertyType.${listing.property_type}`)}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 break-words group-hover:underline group-hover:underline-offset-4">{title}</h3>
        <p className="mt-1.5 text-xs leading-5 text-muted"><span className="text-sm font-semibold text-ink tabular-nums">{money(listing.monthly_rent, locale)}</span> {t("listingCard.perMonth")}</p>
      </div>
    </Link>
    <p className="mt-2 line-clamp-2 text-xs leading-5 break-words text-muted">{nearest ? t("listingCard.distanceFromUniversity", { distance: nearest.distanceKm.toFixed(1), university: nearest.university.shortName }) : listing.address}</p>
    <div className="mt-3 flex items-center gap-2">
      <button type="button" disabled={!mapLoaded} aria-pressed={selected} onClick={onSelect} className={`min-h-11 min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${selected ? "bg-ink text-canvas" : "bg-surface-muted text-ink hover:bg-line"}`}>
        {selected ? t("map.selectedOnMap") : t("map.showOnMap")}
      </button>
      {!isOwner && <button type="button" aria-label={saved ? t("listingCard.removeSaved") : t("listingCard.save")} aria-pressed={saved} onClick={() => onToggleSave(listing.id)} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-ink">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      </button>}
    </div>
  </article>;
}
