"use client";
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { VerificationBadge } from './ListingTrust';

export default function AdminListingActions({ listing, review, ready, busy, onReview, onVisibility, onDelete }) {
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
    <div className="flex items-start justify-between gap-3"><p className="min-w-0 text-xs leading-5 text-muted">Listed by <span className="font-medium text-ink">{listing.landlord?.full_name || 'Unnamed landlord'}</span></p><span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium capitalize text-muted">{listing.status}</span></div>
    <VerificationBadge verified={review === 'approved'}>{!ready ? 'Review unavailable' : review === 'approved' ? 'Verified by admin' : review === 'rejected' ? 'Not approved' : 'Awaiting review'}</VerificationBadge>
    <div className="flex items-center gap-2">
      <Link href={`/rooms/${listing.id}`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-muted">Review listing <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></Link>
      <div ref={root} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
        <button ref={trigger} type="button" disabled={busy} aria-label={`Actions for ${listing.title}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)} className="flex size-11 items-center justify-center rounded-xl border border-line text-ink hover:bg-surface-muted disabled:opacity-40"><svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg></button>
        {open && <div id={panelId} className="absolute right-0 bottom-full z-30 mb-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Moderation</p>
          {ready && review !== 'approved' && <button type="button" className={itemClass} onClick={() => choose(() => onReview(listing.id, 'approved'))}>Approve listing</button>}
          {ready && review !== 'rejected' && <button type="button" className={itemClass} onClick={() => choose(() => onReview(listing.id, 'rejected'))}>Reject listing</button>}
          <button type="button" className={itemClass} onClick={() => choose(() => onVisibility(listing.id, listing.status === 'published' ? 'draft' : 'published'))}>{listing.status === 'published' ? 'Unpublish listing' : 'Publish listing'}</button>
          <div className="my-1 border-t border-line" />
          <button type="button" className={itemClass} onClick={() => choose(() => onDelete(listing.id))}>Delete listing…</button>
        </div>}
      </div>
    </div>
  </div>;
}
