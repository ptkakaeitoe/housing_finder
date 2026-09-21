"use client";

import Link from "next/link";
import { listingImageUrl } from "../lib/supabase";
import { listingUniversity } from "../lib/universities";

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7.9-4.87-10.35-9.5C.15 8.2 1.6 4.3 5.6 4.3c2.2 0 3.9 1.2 6.4 3.75 2.5-2.55 4.2-3.75 6.4-3.75 4 0 5.45 3.9 3.95 7.2C19.9 16.13 12 21 12 21z" />
    </svg>
  );
}

export default function HousingCard({ listing, saved = false, onToggleSave, action }) {
  const nearest = listingUniversity(listing);
  const canSave = Boolean(onToggleSave) && !listing.is_mock;

  function handleHeart(event) {
    event.preventDefault();
    event.stopPropagation();
    onToggleSave(listing.id);
  }

  return <article className="group relative flex h-full min-w-0 flex-col rounded-2xl border border-line bg-surface text-ink transition-shadow hover:shadow-lg">
    <Link href={`/rooms/${listing.id}`} className="flex flex-1 flex-col rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-surface-muted">
        <img src={listingImageUrl(listing.image_path)} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold capitalize text-[#171b20] shadow-sm">{listing.property_type}</span>
          {listing.is_mock && <span className="rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">Sample</span>}
        </div>

      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="truncate text-[15px] font-semibold leading-[22px] tracking-tight text-ink">{listing.title}</h3>
        <p className="mt-1 truncate text-[13px] leading-5 text-muted">{nearest ? `${nearest.distanceKm.toFixed(1)} km from ${nearest.university.name}` : listing.address}</p>
        <p className="mt-3 border-t border-line pt-2 text-[15px] text-ink"><span className="text-lg font-bold tabular-nums">฿{Number(listing.monthly_rent).toLocaleString()}</span> <span className="text-muted">/ month</span></p>
      </div>
    </Link>
        {canSave && <button
          type="button"
          onClick={handleHeart}
          aria-label={saved ? "Remove from saved homes" : "Save home"}
          aria-pressed={saved}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/95 text-[#171b20] shadow-sm transition-transform hover:scale-110"
        >
          <span className={saved ? "text-accent" : "text-[#171b20]"}><HeartIcon filled={saved} /></span>
        </button>}
    {action && <div className="mx-4 border-t border-line py-3">{action}</div>}
  </article>;
}
