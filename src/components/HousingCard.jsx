"use client";

import Link from "next/link";
import { listingImageUrl } from "../lib/supabase";
import { listingUniversity } from "../lib/universities";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7.9-4.87-10.35-9.5C.15 8.2 1.6 4.3 5.6 4.3c2.2 0 3.9 1.2 6.4 3.75 2.5-2.55 4.2-3.75 6.4-3.75 4 0 5.45 3.9 3.95 7.2C19.9 16.13 12 21 12 21z" />
    </svg>
  );
}

export default function HousingCard({ listing, saved = false, onToggleSave, action, isOwner = false }) {
  const { t, locale } = useLocale();
  const nearest = listingUniversity(listing);
  const canSave = Boolean(onToggleSave) && !isOwner;
  const title = getLocalizedTitle(listing, locale);

  function handleHeart(event) {
    event.preventDefault();
    event.stopPropagation();
    onToggleSave(listing.id);
  }

  return <article className="group relative flex h-full min-w-0 flex-col text-ink">
    <Link href={`/rooms/${listing.id}`} className="flex flex-1 flex-col rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-muted">
        <img src={listingImageUrl(listing.image_path)} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isOwner && <span className="rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-canvas">{t("listingCard.listedByYou")}</span>}
        </div>

      </div>
      <div className="flex flex-1 flex-col pt-4">
        <p className="mb-1.5 text-xs text-muted">{t(`common.propertyType.${listing.property_type}`)}</p>
        <h3 className="text-base font-semibold leading-6 tracking-tight text-ink group-hover:underline group-hover:underline-offset-4">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-muted">{nearest ? t("listingCard.distanceFromUniversity", { distance: nearest.distanceKm.toFixed(1), university: nearest.university.shortName }) : listing.address}</p>
        <p className="mt-3 text-sm text-ink"><span className="text-base font-semibold tabular-nums">฿{Number(listing.monthly_rent).toLocaleString()}</span> <span className="text-muted">{t("listingCard.perMonth")}</span></p>
      </div>
    </Link>
        {canSave && <button
          type="button"
          onClick={handleHeart}
          aria-label={saved ? t("listingCard.removeSaved") : t("listingCard.save")}
          aria-pressed={saved}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-white/95 text-[#171b20] transition-colors hover:bg-white"
        >
          <span className={saved ? "text-accent" : "text-[#171b20]"}><HeartIcon filled={saved} /></span>
        </button>}
    {action && <div className="mt-3 py-2">{action}</div>}
  </article>;
}
