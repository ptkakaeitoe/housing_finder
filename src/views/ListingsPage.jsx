"use client";
import Link from "next/link";
import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { getLocalizedTitle } from "../lib/listingFields";
import HousingCard from "../components/HousingCard";
import { publicPageClassName, publicPageHeadingClassName, publicPageLinkClassName } from "../components/layoutStyles";
import { primaryButtonClassName, quietButtonClassName, statusBadgeClassName } from "../components/uiStyles";
import { useListings } from "../lib/useListings";
import { requireSupabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function ListingsPage() {
  const { t, locale } = useLocale();
  const { listings, loading, error, refresh } = useListings({ owner: true });
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  async function remove() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true); setDeleteError("");
    try {
      const { error } = await requireSupabase().from("listings").delete().eq("id", deleting.id);
      if (error) throw error;
      setDeleting(null);
      await refresh();
    } catch (cause) { setDeleteError(cause.message); }
    finally { setDeleteBusy(false); }
  }
  const published = listings.filter(item => item.status === "published").length;
  const drafts = listings.filter(item => item.status === "draft").length;
  return <main className={publicPageClassName}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><h1 className={publicPageHeadingClassName}>{t("myListings.heading")}</h1><p className="mt-2 text-sm leading-6 text-muted" aria-live="polite">{loading ? t("myListings.loadingTotal") : error ? t("myListings.countUnavailable") : t("myListings.summary", { count: listings.length, published, drafts })}</p></div>
      <Link href="/listings/add" className={primaryButtonClassName}>{t("myListings.addListing")}</Link>
    </div>
    {error && <p role="alert" className="mt-6 text-sm text-accent">{error}</p>}
    {loading ? <p role="status" className="mt-8 text-sm text-muted">{t("myListings.loadingListings")}</p> : listings.length ? <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <HousingCard key={listing.id} listing={listing} action={
      <div className="flex flex-wrap items-center gap-1">
        <span className={statusBadgeClassName}>{t(`common.listingStatus.${listing.status}`)}</span>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <Link className={quietButtonClassName} href={`/listings/${listing.id}/edit`}>{t("myListings.editListing")}</Link>
          <button type="button" className={quietButtonClassName} onClick={() => { setDeleteError(""); setDeleting(listing); }}>{t("users.delete")}</button>
        </div>
      </div>
    } />)}</div> : <div className="mt-10 py-6"><p className="text-sm text-muted">{t("myListings.noneYet")}</p><Link href="/listings/add" className={`mt-3 ${publicPageLinkClassName}`}>{t("myListings.addHome")}</Link></div>}
    {deleting && <ConfirmDialog title={t("myListings.confirmDelete")} description={t("listingDeletion.description", { title: getLocalizedTitle(deleting, locale) })} confirmLabel={t(deleteBusy ? "users.processing" : "users.delete")} cancelLabel={t("profile.cancel")} busy={deleteBusy} error={deleteError} onConfirm={remove} onCancel={() => setDeleting(null)} />}
  </main>;
}
