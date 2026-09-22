"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import HousingCard from "../components/HousingCard";
import { supabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function StudentPage() {
  const { t } = useLocale();
  const [saved, setSaved] = useState([]);
  const [requests, setRequests] = useState(0);
  const [signedIn, setSignedIn] = useState(null);
  useEffect(() => {
    if (!supabase) { setSignedIn(false); return; }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSignedIn(Boolean(user));
      if (!user) return;
      const [{ data: saves }, { count }] = await Promise.all([
        supabase.from("saved_listings").select("listing_id,listings(*)").eq("student_id", user.id).order("created_at", { ascending: false }),
        supabase.from("viewing_requests").select("id", { count: "exact", head: true }).eq("student_id", user.id),
      ]);
      setSaved((saves ?? []).map((item) => item.listings).filter(Boolean)); setRequests(count ?? 0);
    })();
  }, []);
  return <section className="mx-auto max-w-7xl border-t border-line px-5 py-10 sm:px-8 lg:px-12"><div className="flex flex-wrap items-end justify-between gap-4"><h2 className="text-3xl font-semibold tracking-tight text-ink">{t("student.savedHomes")}</h2><Link href="/" className="text-sm font-semibold text-accent">{t("student.exploreHomes")}</Link></div>
    {signedIn === false && <p className="mt-6 border-t border-line py-6 text-muted">{t("student.signInToSave")} <Link href="/login" className="font-semibold text-accent">{t("student.signInArrow")}</Link></p>}
    {signedIn && <><div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-line py-4 text-sm text-muted"><span><strong className="mr-2 text-lg text-ink">{saved.length}</strong> {t("student.savedLabel")}</span><Link href="/appointments" className="hover:text-accent"><strong className="mr-2 text-lg text-ink">{requests}</strong>{t("student.viewingRequestsSuffix", { count: requests })}</Link></div>{saved.length ? <div className="mt-7 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{saved.map((listing) => <HousingCard key={listing.id} listing={listing} />)}</div> : <p className="py-8 text-muted">{t("student.nothingSaved")} <Link href="/" className="font-semibold text-accent">{t("student.browseHomes")}</Link></p>}</>}
  </section>;
}
