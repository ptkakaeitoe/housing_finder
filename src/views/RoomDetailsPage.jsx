"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ListingInformation from "../components/ListingInformation";
import { publicContainerClassName, publicPageLinkClassName } from "../components/layoutStyles";
import { primaryButtonClassName, quietButtonClassName, statusBadgeClassName } from "../components/uiStyles";
import { supabase, listingImageUrl } from "../lib/supabase";
import { listingPhotos } from "../lib/listingPhotos";
import { money } from "../lib/listingCosts";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function RoomDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [listing, setListing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setListing(null); setSaved(false); setUserId(null); setRole(null); setAuthReady(false); setActivePhoto(0); setError("");
    async function load() {
      if (!supabase || !id) { setError(t("roomDetails.missingListingError")); return; }
      try {
        const { data, error: loadError } = await supabase.from("listings").select("*").eq("id", id).single();
        if (!active) return;
        if (loadError || !data) throw new Error(t("roomDetails.unavailableError"));
        setListing(data);
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        setUserId(user?.id ?? null);
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
          if (!active) return;
          setRole(profile?.role ?? "unknown");
          const { data: savedListing } = await supabase.from("saved_listings").select("listing_id").eq("listing_id", id).eq("student_id", user.id).maybeSingle();
          if (active) setSaved(Boolean(savedListing));
        }
        if (active) setAuthReady(true);
      } catch (cause) { if (active) setError(cause.message); }
    }
    load();
    return () => { active = false; };
  }, [id, t]);

  async function toggleSaved() {
    if (!userId) { router.push("/login"); return; }
    if (saving) return;
    setSaving(true); setError("");
    try {
      const query = saved ? supabase.from("saved_listings").delete().eq("listing_id", id).eq("student_id", userId) : supabase.from("saved_listings").insert({ listing_id: id, student_id: userId });
      const { error: saveError } = await query;
      if (saveError) throw saveError;
      setSaved(!saved);
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  }
  const isOwner = Boolean(userId && listing?.landlord_id === userId);
  const photos = listingPhotos(listing);
  const rent = listing ? money(listing.monthly_rent, locale) : "";
  const mapHref = `/map?listing=${encodeURIComponent(id)}`;
  const title = listing ? getLocalizedTitle(listing, locale) : "";

  return <main className={`${publicContainerClassName} py-6 text-ink sm:py-8`}>
    <Link href={isOwner ? "/listings" : "/explore"} className={publicPageLinkClassName}>{isOwner ? t("roomDetails.backToListings") : t("roomDetails.backToExplore")}</Link>
    {error && <p role="alert" className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-accent">{error}</p>}
    {!listing ? <div role="status" className="my-10 py-8">
      <h1 className="text-xl font-semibold">{error ? t("roomDetails.unavailableHeading") : t("roomDetails.loadingHeading")}</h1>
      {error && <p className="mt-2 text-sm text-muted">{t("roomDetails.returnToExplore")}</p>}
    </div> : <>
      <header className="mb-6 mt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-muted">{t(`common.propertyType.${listing.property_type}`)}</span>
          {isOwner && <span className={statusBadgeClassName}>{t("roomDetails.yourListingStatus", { status: t(`common.listingStatus.${listing.status}`) })}</span>}
        </div>
        <h1 className="mt-3 max-w-4xl break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-muted">{listing.address}</p>
      </header>

      <div className="grid min-w-0 items-start gap-x-7 gap-y-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
        <div className="min-w-0">
          <figure className="overflow-hidden rounded-lg bg-surface-muted">
            <img src={listingImageUrl(photos[activePhoto])} alt={t("roomDetails.photoAlt", { title, n: activePhoto + 1 })} className="aspect-[16/10] w-full object-cover" />
          </figure>
          {photos.length > 1 && <div className="mt-3" aria-label={t("roomDetails.photoGallery")}>
            <p className="mb-2 text-xs text-muted" aria-live="polite">{t("roomDetails.photoOf", { current: activePhoto + 1, total: photos.length })}</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((path, index) => <button key={`${path}-${index}`} type="button" onClick={() => setActivePhoto(index)} aria-label={t("roomDetails.showPhoto", { n: index + 1, total: photos.length })} aria-pressed={activePhoto === index} className={`w-24 shrink-0 overflow-hidden rounded-md border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${activePhoto === index ? "border-ink" : "border-transparent"}`}>
                <img src={listingImageUrl(path)} alt="" className="aspect-[4/3] w-full object-cover" />
              </button>)}
            </div>
          </div>}
        </div>
        <aside aria-label={isOwner ? t("roomDetails.manageAria") : t("roomDetails.rentAndViewingAria")} className="min-w-0 border-t border-line py-6 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-28 lg:border-t-0 lg:border-l lg:py-0 lg:pl-8">
          <p className="text-xs font-medium text-muted">{t("roomDetails.monthlyRent")}</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-2"><span className="text-3xl font-semibold tracking-tight tabular-nums">{rent}</span><span className="text-sm text-muted">{t("listingCard.perMonth")}</span></p>
          <p className="mt-3 text-sm leading-6 text-muted">{listing.lease_duration_months ? t("roomDetails.minLeaseSentence", { count: listing.lease_duration_months }) : t("roomDetails.askAboutLeaseLength")}</p>
          <div className="my-6" />
          {!authReady ? <p className="text-sm text-muted">{t("roomDetails.loadingAccount")}</p> : isOwner ? <div className="space-y-3">
            <p className="text-sm font-semibold">{t("roomDetails.managePropertyHeading")}</p>
            <p className="text-sm text-muted">{listing.status === "published" ? t("roomDetails.visibleInExplore") : t("roomDetails.draftVisibility")}</p>
            <Link href={`/listings/${id}/edit`} className={`w-full min-h-12 ${primaryButtonClassName}`}>{t("roomDetails.editDetails")}</Link>
            <Link href="/landlord-appointments" className={`w-full ${quietButtonClassName}`}>{t("roomDetails.manageViewingRequests")}</Link>
          </div> : role === "admin" ? <Link href="/manage-listings" className={`w-full min-h-12 ${primaryButtonClassName}`}>{t("roomDetails.manageListings")}</Link> : !userId || role === "student" ? <>
            <Link href={`/request-viewing?listing=${encodeURIComponent(id)}`} className={`w-full min-h-12 ${primaryButtonClassName}`}>{t("roomDetails.requestViewing")}</Link>
            <button type="button" onClick={toggleSaved} disabled={saving} aria-pressed={saved} className={`mt-3 w-full ${quietButtonClassName}`}><span>{saving ? t("roomDetails.saving") : saved ? t("roomDetails.savedToHomes") : t("roomDetails.saveThisHome")}</span></button>
          </> : <p className="text-sm text-muted">{t("roomDetails.studentOnly")}</p>}
        </aside>
        <div className="min-w-0 lg:col-start-1">
          <ListingInformation listing={listing} mapHref={mapHref} />
        </div>

      </div>
    </>}
  </main>;
}
