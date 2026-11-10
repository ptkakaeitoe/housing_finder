"use client";

import Link from "next/link";
import { listingImageUrl } from "../lib/supabase";
import { money } from "../lib/listingCosts";
import { listingUniversity } from "../lib/universities";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

function HeartIcon({ filled }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

export default function HousingCard({ listing, saved = false, onToggleSave, action, isOwner = false }) {
  const { t, locale } = useLocale();
  const nearest = listingUniversity(listing);
  const canSave = Boolean(onToggleSave) && !isOwner;
  const title = getLocalizedTitle(listing, locale);
  const details = [
    isOwner ? t("listingCard.listedByYou") : null,
    t(`common.propertyType.${listing.property_type}`),
    nearest ? t("listingCard.distanceFromUniversity", { distance: nearest.distanceKm.toFixed(1), university: nearest.university.shortName }) : listing.address,
  ].filter(Boolean).join(" · ");

  function handleHeart(event) {
    event.preventDefault();
    event.stopPropagation();
    onToggleSave(listing.id);
  }

  return <article className="group relative flex h-full min-w-0 flex-col text-ink">
    <Link href={`/rooms/${listing.id}`} className="flex flex-1 flex-col rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
      <div className="relative aspect-[3/2] shrink-0 overflow-hidden rounded-lg bg-surface-muted">
        <img src={listingImageUrl(listing.image_path)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none" />
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-6 tracking-tight break-words text-ink group-hover:underline group-hover:underline-offset-4">{title}</h3>
        <p className="mt-1 truncate text-xs leading-5 text-muted" title={details}>{details}</p>
        <p className="mt-2 text-sm text-ink"><span className="font-semibold tabular-nums">{money(listing.monthly_rent, locale)}</span> <span className="text-xs text-muted">{t("listingCard.perMonth")}</span></p>
      </div>
    </Link>
        {canSave && <button
          type="button"
          onClick={handleHeart}
          aria-label={saved ? t("listingCard.removeSaved") : t("listingCard.save")}
          aria-pressed={saved}
          className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full bg-white/95 text-[#171b20] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <HeartIcon filled={saved} />
        </button>}
    {action && <div className="mt-4">{action}</div>}
  </article>;
}
