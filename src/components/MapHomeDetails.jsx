"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ListingInformation from "./ListingInformation";
import { primaryButtonClassName } from "./uiStyles";
import { listingImageUrl } from "../lib/supabase";
import { listingPhotos } from "../lib/listingPhotos";
import { getLocalizedTitle } from "../lib/listingFields";
import { money } from "../lib/listingCosts";
import { useLocale } from "../lib/i18n/LocaleContext";

const iconButton = "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-ink";

export function MapCloseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="m6 6 12 12M6 18 18 6" /></svg>;
}

export default function MapHomeDetails({ listing, saved, isOwner, onToggleSave, onClose, onBack, expanded, onExpand }) {
  const { t, locale } = useLocale();
  const [photo, setPhoto] = useState(0);
  const heading = useRef(null);
  const photos = listingPhotos(listing);
  const title = getLocalizedTitle(listing, locale);

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);

  function changePhoto(offset) {
    setPhoto((current) => (current + offset + photos.length) % photos.length);
  }

  return <aside aria-label={t("map.homeDetails")} onKeyDown={(event) => {
    if (event.key === "Escape" && !event.defaultPrevented && !event.target.closest("dialog")) { event.stopPropagation(); onClose(); }
  }} className="flex h-full min-h-0 flex-col overflow-hidden text-ink motion-safe:animate-[map-panel-in_280ms_cubic-bezier(.22,1,.36,1)]">
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-2 py-1">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-2 text-xs font-medium text-muted hover:bg-surface-muted hover:text-ink">
        <span aria-hidden="true">←</span>{t("map.backToHomes")}
      </button>
      <div className="flex items-center">
        <button type="button" aria-expanded={expanded} aria-controls="map-home-information" onClick={onExpand} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium hover:bg-surface-muted md:hidden">
          {t(expanded ? "map.collapseDetails" : "map.expandDetails")}<span aria-hidden="true">{expanded ? "↓" : "↑"}</span>
        </button>
        <button type="button" onClick={onClose} aria-label={t("map.closePanel")} className={iconButton}><MapCloseIcon /></button>
      </div>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className={`${expanded ? "block" : "hidden"} relative md:block`}>
        <img src={listingImageUrl(photos[photo])} alt={t("roomDetails.photoAlt", { title, n: photo + 1 })} className="aspect-[16/9] w-full bg-surface-muted object-cover" />
        {photos.length > 1 && <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
          <button type="button" aria-label={t("roomDetails.showPhoto", { n: (photo - 1 + photos.length) % photos.length + 1, total: photos.length })} onClick={() => changePhoto(-1)} className="size-11 rounded-full bg-canvas text-xl text-ink shadow-sm">←</button>
          <span className="rounded-full bg-canvas px-3 py-1 text-xs text-ink shadow-sm" aria-live="polite">{t("roomDetails.photoOf", { current: photo + 1, total: photos.length })}</span>
          <button type="button" aria-label={t("roomDetails.showPhoto", { n: (photo + 1) % photos.length + 1, total: photos.length })} onClick={() => changePhoto(1)} className="size-11 rounded-full bg-canvas text-xl text-ink shadow-sm">→</button>
        </div>}
      </div>
      <div className="flex items-start gap-3 p-4 md:p-5">
        {!expanded && <img src={listingImageUrl(photos[0])} alt="" className="size-16 shrink-0 rounded-lg bg-surface-muted object-cover md:hidden" />}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{t(`common.propertyType.${listing.property_type}`)}</p>
          <h2 ref={heading} tabIndex={-1} className="mt-1 break-words text-base font-semibold leading-5 tracking-tight outline-none md:text-lg md:leading-6">{title}</h2>
          <p className="mt-2 text-sm text-muted"><strong className="text-lg font-semibold tracking-tight text-ink tabular-nums">{money(listing.monthly_rent, locale)}</strong> {t("listingCard.perMonth")}</p>
          <p className={`${expanded ? "block" : "hidden"} mt-2 break-words text-xs leading-5 text-muted md:block`}>{listing.address}</p>
        </div>
      </div>
      <div id="map-home-information" className={`${expanded ? "block" : "hidden"} px-4 pb-6 md:block md:px-5`}>
        <ListingInformation listing={listing} />
      </div>
    </div>
    <div className="flex shrink-0 gap-2 border-t border-line bg-canvas p-3">
      <Link href={`/rooms/${listing.id}`} className={`flex-1 ${primaryButtonClassName}`}>{t("map.viewHome")}</Link>
      {!isOwner && <button type="button" aria-label={t(saved ? "listingCard.removeSaved" : "listingCard.save")} aria-pressed={saved} onClick={() => onToggleSave(listing.id)} className={iconButton}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      </button>}
    </div>
  </aside>;
}
