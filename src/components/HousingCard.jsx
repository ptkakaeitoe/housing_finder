"use client";

import Link from "next/link";
import { listingImageUrl } from "../lib/supabase";

export default function HousingCard({ listing, action }) {
  return <article className="group min-w-0">
    <Link href={`/rooms/${listing.id}`} className="block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface-muted">
        <img src={listingImageUrl(listing.image_path)} alt={listing.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" />
        {listing.is_mock && <span className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">Sample</span>}
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-4"><h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-ink group-hover:text-accent">{listing.title}</h3><span className="shrink-0 text-lg font-bold text-ink">฿{Number(listing.monthly_rent).toLocaleString()}</span></div>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{listing.address}</p>
        <p className="mt-1 text-xs text-muted"><span className="capitalize">{listing.property_type}</span> · per month</p>
      </div>
    </Link>
    {action && <div className="mt-4 border-t border-line pt-3">{action}</div>}
  </article>;
}
