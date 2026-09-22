"use client";
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { VerificationBadge } from './ListingTrust';
import { getLocalizedTitle } from '../lib/listingFields';
import { useLocale } from '../lib/i18n/LocaleContext';

export default function AdminListingActions({ listing, review, ready, busy, onReview, onVisibility, onDelete }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    function outside(event) { if (!root.current?.contains(event.target)) setOpen(false); }
    function escape(event) { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  function choose(action) { setOpen(false); trigger.current?.focus(); action(); }
  const itemClass = 'flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40';
  return <div className="space-y-3">
    <div className="flex items-start justify-between gap-3"><p className="min-w-0 text-xs leading-5 text-muted">{t("adminListingActions.listedBy", { name: listing.landlord?.full_name || t("adminListingActions.unnamedLandlord") })}</p><span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-muted">{t(`common.listingStatus.${listing.status}`)}</span></div>
    <VerificationBadge verified={review === 'approved'}>{!ready ? t("adminListingActions.reviewUnavailable") : review === 'approved' ? t("adminListingActions.verifiedByAdmin") : review === 'rejected' ? t("adminListingActions.notApproved") : t("adminListingActions.awaitingReview")}</VerificationBadge>
    <div className="flex items-center gap-2">
      <Link href={`/rooms/${listing.id}`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-muted">{t("adminListingActions.reviewListing")} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
      <div ref={root} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
        <button ref={trigger} type="button" disabled={busy} aria-label={t("adminListingActions.actionsFor", { title: getLocalizedTitle(listing, locale) })} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)} className="flex size-11 items-center justify-center rounded-xl border border-line text-ink hover:bg-surface-muted disabled:opacity-40"><svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg></button>
        {open && <div id={panelId} className="absolute right-0 bottom-full z-30 mb-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("adminListingActions.moderation")}</p>
          {ready && review !== 'approved' && <button type="button" className={itemClass} onClick={() => choose(() => onReview(listing.id, 'approved'))}>{t("adminListingActions.approveListing")}</button>}
          {ready && review !== 'rejected' && <button type="button" className={itemClass} onClick={() => choose(() => onReview(listing.id, 'rejected'))}>{t("adminListingActions.rejectListing")}</button>}
          <button type="button" className={itemClass} onClick={() => choose(() => onVisibility(listing.id, listing.status === 'published' ? 'draft' : 'published'))}>{listing.status === 'published' ? t("adminListingActions.unpublishListing") : t("adminListingActions.publishListing")}</button>
          <div className="my-1 border-t border-line" />
          <button type="button" className={itemClass} onClick={() => choose(() => onDelete(listing.id))}>{t("adminListingActions.deleteListing")}</button>
        </div>}
      </div>
    </div>
  </div>;
}
