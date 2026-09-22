"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { useLocale } from "../lib/i18n/LocaleContext";
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
  return <><main className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><Link href="/admin-verifications" className="text-sm font-semibold text-accent">{t("verificationDetail.backToQueue")}</Link><h1 className="mt-6 text-4xl font-semibold tracking-tight text-ink">{t("verificationDetail.heading")}</h1>{admin === false && <p className="mt-8 text-muted">{t("common.adminRequired")}</p>}{error && <p role="alert" className="mt-5 text-accent">{error}</p>}{request && <div className="mt-8 grid gap-5 border-t border-line pt-6"><p className="text-muted">{t("verificationDetail.name")} <strong className="block text-lg text-ink">{request.full_name}</strong></p><p className="text-muted">{t("verificationDetail.phone")} <strong className="block text-lg text-ink">{request.phone}</strong></p><p className="text-sm text-muted">{t("verificationDetail.submitted", { date: new Date(request.created_at).toLocaleString(), status: t(`common.verificationStatus.${request.status}`) })}</p><button onClick={openDocument} className="justify-self-start text-sm font-bold text-accent underline">{t("verificationDetail.openDocument")}</button>{request.status === "pending" && <div className="flex flex-wrap gap-3"><button onClick={() => review("approved")} className="rounded-full bg-ink px-6 py-3 font-bold text-canvas">{t("verificationDetail.approve")}</button><button onClick={() => review("rejected")} className="rounded-full border border-line px-6 py-3 font-bold text-ink">{t("verificationDetail.reject")}</button></div>}</div>}</main></>;
}
