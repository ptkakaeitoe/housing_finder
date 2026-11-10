"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLocale } from '../lib/i18n/LocaleContext';
import Avatar from './Avatar';

export function VerificationBadge({ verified, children }) {
  return <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${verified ? 'text-ink' : 'text-muted'}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />{verified ? <path d="m8 12 3 3 5-6" /> : <><path d="M12 8v5" /><path d="M12 16h.01" /></>}</svg>{children}
  </span>;
}
export default function ListingTrust({ listingId }) {
  const { t } = useLocale();
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let active = true;
    setInfo(null);
    if (!supabase) return;
    Promise.all([
      supabase.rpc('listing_poster', { listing_id: listingId }),
      supabase.from('listing_reviews').select('status,reviewed_at').eq('listing_id', listingId).maybeSingle(),
    ]).then(([poster, review]) => {
      if (active) setInfo({ poster: poster.error ? null : poster.data?.[0], review: review.data, reviewError: Boolean(review.error) });
    });
    return () => { active = false; };
  }, [listingId]);
  return <section aria-label={t("listingTrust.listedByAria")} className="py-1">
    <p className="text-xs font-medium text-muted">{t("listingTrust.listedBy")}</p>
    <div className="mt-3 flex items-center gap-3"><Avatar /><div className="min-w-0"><h2 className="break-words text-base font-semibold">{!info ? t("listingTrust.loadingLandlord") : info.poster?.full_name || t("listingTrust.landlordNameUnavailable")}</h2><div className="mt-1"><VerificationBadge verified={Boolean(info?.poster?.verified)}>{!info ? t("listingTrust.checkingVerification") : !info.poster ? t("listingTrust.verificationUnavailable") : info.poster.verified ? t("listingTrust.identityVerified") : t("listingTrust.identityNotVerified")}</VerificationBadge></div></div></div>
    <div className="mt-5"><VerificationBadge verified={info?.review?.status === 'approved'}>{!info ? t("listingTrust.checkingListingReview") : info.reviewError ? t("listingTrust.listingReviewUnavailable") : info.review?.status === 'approved' ? t("listingTrust.listingVerifiedByAdmin") : info.review?.status === 'rejected' ? t("listingTrust.listingNotApproved") : t("listingTrust.listingAwaitingReview")}</VerificationBadge>{info?.review?.reviewed_at && <p className="mt-2 text-xs leading-5 text-muted">{t("listingTrust.reviewedOn", { date: new Date(info.review.reviewed_at).toLocaleDateString() })}</p>}</div>
  </section>;
}
