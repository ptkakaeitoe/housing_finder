"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HousingCard from "../components/HousingCard";
import { publicPageClassName, publicPageHeadingClassName, publicPageLinkClassName } from "../components/layoutStyles";
import { supabase } from "../lib/supabase";
import { useSavedListings } from "../lib/useSavedListings";
import { useLocale } from "../lib/i18n/LocaleContext";

const inlineLinkClassName = "font-medium text-ink underline decoration-line underline-offset-4 hover:opacity-80";

export default function SavedHomesPage() {
  const { t } = useLocale();
  const { savedIds, toggle, ready, signedIn, userId } = useSavedListings();
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!supabase || !userId) { setLoading(false); return; }
    let active = true;
    (async () => {
      const { data, error: loadError } = await supabase.from("saved_listings")
        .select("created_at, listings(*)")
        .eq("student_id", userId)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (loadError) setError(loadError.message);
      // A saved home that is no longer published comes back as null and is skipped.
      else setHomes((data ?? []).map((row) => row.listings).filter(Boolean));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [ready, userId]);

  // Unsaving a home removes its card straight away.
  const visible = homes.filter((home) => savedIds.has(home.id));

  return <main className={`${publicPageClassName} text-ink`}>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className={publicPageHeadingClassName}>{t("student.savedHomes")}</h1>
      <Link href="/" className={publicPageLinkClassName}>{t("student.exploreHomes")}</Link>
    </div>
    {error && <p role="alert" className="mt-6 text-sm text-accent">{error}</p>}
    {!ready || loading ? <p role="status" className="mt-8 text-sm text-muted">{t("common.loading")}</p>
    : !signedIn ? <p className="mt-8 text-sm text-muted">{t("student.signInToSave")} <Link href="/login" className={inlineLinkClassName}>{t("student.signInArrow")}</Link></p>
    : visible.length ? <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {visible.map((home) => <HousingCard key={home.id} listing={home} saved onToggleSave={toggle} isOwner={home.landlord_id === userId} />)}
    </div>
    : <p className="mt-8 text-sm text-muted">{t("student.nothingSaved")} <Link href="/" className={inlineLinkClassName}>{t("student.browseHomes")}</Link></p>}
  </main>;
}
