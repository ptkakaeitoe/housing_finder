"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { useLocale } from "../lib/i18n/LocaleContext";
import { publicPageClassName, publicPageHeadingClassName, publicPageLinkClassName } from "../components/layoutStyles";
import { primaryButtonClassName, secondaryButtonClassName, statusBadgeClassName } from "../components/uiStyles";
export default function VerificationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLocale();
  const admin = useAdmin();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { if (!admin || !id) return; supabase.from("verification_requests").select("*").eq("id", id).single().then(({ data, error: queryError }) => { setRequest(data); setError(queryError?.message ?? ""); }); }, [admin, id]);
  async function openDocument() {
    const { data, error: signedError } = await supabase.storage.from("verification-documents").createSignedUrl(request.document_path, 60);
    if (signedError) setError(signedError.message); else window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  async function review(status) {
    const { error: updateError } = await supabase.from("verification_requests").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (updateError) setError(updateError.message); else router.push("/admin-verifications");
  }
  return <main className={`${publicPageClassName} text-ink`}>
    <Link href="/admin-verifications" className={publicPageLinkClassName}>{t("verificationDetail.backToQueue")}</Link>
    <h1 className={`mt-4 ${publicPageHeadingClassName}`}>{t("verificationDetail.heading")}</h1>
    {admin === false && <p className="mt-8 text-sm text-muted">{t("common.adminRequired")}</p>}
    {error && <p role="alert" className="mt-5 text-sm text-accent">{error}</p>}
    {!error && (admin === null || (admin && !request)) && <p role="status" className="mt-8 text-sm text-muted">{t("common.loading")}</p>}
    {request && <section className="mt-8 max-w-2xl">
      <span className={statusBadgeClassName}>{t(`common.verificationStatus.${request.status}`)}</span>
      <dl className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="min-w-0"><dt className="text-xs font-medium text-muted">{t("verificationDetail.name")}</dt><dd className="mt-2 text-base font-medium break-words">{request.full_name}</dd></div>
        <div className="min-w-0"><dt className="text-xs font-medium text-muted">{t("verificationDetail.phone")}</dt><dd className="mt-2 text-base font-medium break-words">{request.phone}</dd></div>
      </dl>
      <p className="mt-5 text-xs leading-6 text-muted">{t("verificationDetail.submitted", { date: new Date(request.created_at).toLocaleString(), status: t(`common.verificationStatus.${request.status}`) })}</p>
      <button type="button" onClick={openDocument} className={`mt-5 ${secondaryButtonClassName}`}>{t("verificationDetail.openDocument")}<span aria-hidden="true">↗</span></button>
      {request.status === "pending" && <div className="mt-8 flex flex-wrap gap-2">
        <button type="button" onClick={() => review("approved")} className={primaryButtonClassName}>{t("verificationDetail.approve")}</button>
        <button type="button" onClick={() => review("rejected")} className={secondaryButtonClassName}>{t("verificationDetail.reject")}</button>
      </div>}
    </section>}
  </main>;
}
