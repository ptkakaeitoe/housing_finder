"use client";
import { useEffect, useState } from "react";
import AdminListingActions from "../components/AdminListingActions";
import ConfirmDialog from "../components/ConfirmDialog";
import { getLocalizedTitle } from "../lib/listingFields";
import HousingCard from "../components/HousingCard";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { useLocale } from "../lib/i18n/LocaleContext";
import { publicPageClassName, publicPageHeadingClassName } from "../components/layoutStyles";
export default function ManageListingsPage() {
  const { t, locale } = useLocale();
  const admin = useAdmin();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [reviewReady, setReviewReady] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(null);
  const [error, setError] = useState("");
  async function refresh() { const { data, error: queryError } = await supabase.from("listings").select("*, landlord:profiles!listings_landlord_id_fkey(full_name)").order("created_at", { ascending: false }); setListings(data ?? []); setError(queryError?.message ?? ""); setLoading(false); }
  async function loadReviews() {
    const { data, error } = await supabase.from("listing_reviews").select("listing_id,status");
    setReviewReady(!error);
    if (error) setError(error.message);
    else setReviews(Object.fromEntries(data.map(row => [row.listing_id, row.status])));
  }
  useEffect(() => { if (admin) { refresh(); loadReviews(); } }, [admin]);
  async function reviewListing(id, status) {
    setReviewBusy(id); setError("");
    try {
      const { error } = await supabase.from("listing_reviews").upsert({ listing_id: id, status, reviewed_at: new Date().toISOString() });
      if (error) throw error;
      await loadReviews();
    } catch (cause) { setError(cause.message); }
    finally { setReviewBusy(null); }
  }
  async function changeStatus(id, status) { const { error: updateError } = await supabase.from("listings").update({ status }).eq("id", id); if (updateError) setError(updateError.message); else refresh(); }
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  async function remove() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true); setDeleteError("");
    try {
      const { error } = await supabase.from("listings").delete().eq("id", deleting.id);
      if (error) throw error;
      setDeleting(null);
      await refresh();
    } catch (cause) { setDeleteError(cause.message); }
    finally { setDeleteBusy(false); }
  }
  return <main className={`${publicPageClassName} text-ink`}>
    <h1 className={publicPageHeadingClassName}>{t("manageListings.heading")}</h1>
    {admin === false && <p className="mt-8 text-sm text-muted">{t("common.adminRequired")}</p>}
    {error && <p role="alert" className="mt-5 text-sm text-accent">{error}</p>}
    {(admin === null || (admin && loading)) && <p role="status" className="mt-8 text-sm text-muted">{t("common.loading")}</p>}
    {admin && !loading && (listings.length ? <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <HousingCard key={listing.id} listing={listing} action={<AdminListingActions listing={listing} review={reviews[listing.id]} ready={reviewReady} busy={reviewBusy !== null || deleteBusy} onReview={reviewListing} onVisibility={changeStatus} onDelete={(id) => { setDeleteError(""); setDeleting(listings.find((item) => item.id === id)); }} />} />)}</div> : !error && <p role="status" className="mt-10 py-6 text-sm text-muted">{t("manageListings.noneYet")}</p>)}
    {deleting && <ConfirmDialog title={t("manageListings.confirmDelete")} description={t("listingDeletion.description", { title: getLocalizedTitle(deleting, locale) })} confirmLabel={t(deleteBusy ? "users.processing" : "users.delete")} cancelLabel={t("profile.cancel")} busy={deleteBusy} error={deleteError} onConfirm={remove} onCancel={() => setDeleting(null)} />}
  </main>;
}
