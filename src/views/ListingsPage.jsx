"use client";
import Link from "next/link";
import HousingCard from "../components/HousingCard";
import { useListings } from "../lib/useListings";
import { requireSupabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function ListingsPage() {
  const { t } = useLocale();
  const { listings, loading, error, refresh } = useListings({ owner: true });
  async function remove(id) {
    if (!window.confirm(t("myListings.confirmDelete"))) return;
    const { error: deleteError } = await requireSupabase().from("listings").delete().eq("id", id);
    if (deleteError) window.alert(deleteError.message); else refresh();
  }
  const published = listings.filter(item => item.status === "published").length;
  const drafts = listings.filter(item => item.status === "draft").length;
  return <><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-semibold tracking-tight text-ink">{t("myListings.heading")}</h1><p className="mt-2 text-sm text-muted" aria-live="polite">{loading ? t("myListings.loadingTotal") : error ? t("myListings.countUnavailable") : t("myListings.summary", { count: listings.length, published, drafts })}</p></div><Link href="/listings/add" className="rounded-full bg-ink px-6 py-3 font-bold text-canvas">{t("myListings.addListing")}</Link></div>
    {error && <p role="alert" className="mt-6 text-accent">{error}</p>}
    {loading ? <p className="mt-8 text-muted">{t("myListings.loadingListings")}</p> : listings.length ? <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <HousingCard key={listing.id} listing={listing} action={<div className="flex flex-wrap justify-between gap-3 text-sm font-semibold"><p className="w-full text-xs text-muted">{t(`common.listingStatus.${listing.status}`)}</p><Link className="text-accent" href={`/listings/${listing.id}/edit`}>{t("myListings.editListing")}</Link><button className="text-muted hover:text-accent" onClick={() => remove(listing.id)}>{t("users.delete")}</button></div>} />)}</div> : <p className="mt-8 border-t border-line py-8 text-muted">{t("myListings.noneYet")} <Link href="/listings/add" className="font-semibold text-accent">{t("myListings.addHome")}</Link></p>}
  </main></>;
}
