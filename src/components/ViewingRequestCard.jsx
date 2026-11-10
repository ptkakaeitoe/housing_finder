"use client";

import Link from "next/link";
import { listingImageUrl } from "../lib/supabase";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function ViewingRequestCard({ request, children }) {
  const { t, locale } = useLocale();
  const listing = request.listings;
  const title = listing ? getLocalizedTitle(listing, locale) : t("appointments.homeFallback");
  const date = new Date(request.preferred_at);
  const content = <>
    <div className="aspect-[3/2] overflow-hidden rounded-lg bg-surface-muted">
      <img src={listingImageUrl(listing?.image_path)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none" />
    </div>
    <h2 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-6 tracking-tight text-ink group-hover:underline group-hover:underline-offset-4">{title}</h2>
    {listing?.address && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{listing.address}</p>}
  </>;

  return <article className="flex min-w-0 flex-col text-ink">
    {listing ? <Link href={`/rooms/${listing.id}`} className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">{content}</Link> : <div>{content}</div>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <time dateTime={request.preferred_at} className="text-sm leading-6 tabular-nums">
        <span className="block font-medium">{date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}</span>
        <span className="block text-muted">{date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}</span>
      </time>
      <span className={`inline-flex min-h-7 items-center gap-2 rounded-md px-2.5 py-1 text-xs font-medium ${request.status === "accepted" ? "bg-ink text-canvas" : "bg-surface-muted text-muted"}`}>
        <span aria-hidden="true" className={`size-1.5 rounded-full ${request.status === "pending" ? "border border-current" : "bg-current"}`} />
        {t(`common.requestStatus.${request.status}`)}
      </span>
    </div>
    {request.message && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{request.message}</p>}
    {children && <div className="mt-auto pt-5">{children}</div>}
  </article>;
}
