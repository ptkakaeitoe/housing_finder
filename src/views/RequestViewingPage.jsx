"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ViewingDateTimePicker from "../components/ViewingDateTimePicker";
import Link from "next/link";
import { supabase, requireSupabase } from "../lib/supabase";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

function RequestForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { t, locale } = useLocale();
  const id = params.get("listing");
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  useEffect(() => { if (supabase && id) supabase.from("listings").select("id,title,title_th,title_my,title_zh,address").eq("id", id).single().then(({ data }) => setListing(data)); }, [id]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const client = requireSupabase();
      const { data: { user } } = await client.auth.getUser();
      if (!user) { router.push("/login"); return; }
      if (!date || !time) throw new Error(t("requestViewing.chooseDateTimeError"));
      const preferredAt = new Date(`${date}T${time}`);
      if (!Number.isFinite(preferredAt.getTime()) || preferredAt <= new Date()) throw new Error(t("requestViewing.chooseFutureError"));
      const { error: saveError } = await client.from("viewing_requests").insert({ listing_id: id, student_id: user.id, preferred_at: preferredAt.toISOString(), message: String(form.get("message") ?? "") });
      if (saveError) throw saveError;
      router.push("/appointments");
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }
  return <><main className="mx-auto max-w-2xl px-5 py-10 sm:px-8"><Link href={id ? `/rooms/${id}` : "/explore"} className="text-sm font-semibold text-accent">{t("requestViewing.back")}</Link><h1 className="mt-6 text-4xl font-extrabold text-ink">{t("requestViewing.heading")}</h1><p className="mt-2 text-muted">{listing ? t("requestViewing.listingSummary", { title: getLocalizedTitle(listing, locale), address: listing.address }) : t("requestViewing.chooseHomeFirst")}</p>
    {listing && <form onSubmit={submit} className="mt-8 grid gap-5 border-t border-line pt-6"><ViewingDateTimePicker date={date} time={time} onDateChange={setDate} onTimeChange={setTime} disabled={busy} /><label className="text-sm font-semibold text-ink">{t("requestViewing.message")}<textarea name="message" maxLength="1000" placeholder={t("requestViewing.messagePlaceholder")} className="mt-2 min-h-28 w-full rounded-xl border border-line bg-canvas p-4 text-base" /></label>{error && <p role="alert" className="text-sm text-accent">{error}</p>}<button disabled={busy || !date || !time} className="min-h-12 rounded-full bg-ink font-bold text-canvas disabled:opacity-50">{busy ? t("requestViewing.sending") : t("requestViewing.send")}</button></form>}
  </main></>;
}
export default function RequestViewingPage() {
  return <Suspense fallback={<RequestViewingFallback />}><RequestForm /></Suspense>;
}
function RequestViewingFallback() {
  const { t } = useLocale();
  return <p className="p-8">{t("requestViewing.loading")}</p>;
}
