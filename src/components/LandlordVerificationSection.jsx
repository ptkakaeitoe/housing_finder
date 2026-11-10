"use client";
import { useEffect, useState } from "react";
import { supabase, requireSupabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";
import { primaryButtonClassName, statusBadgeClassName } from "./uiStyles";

export default function LandlordVerificationSection() {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [requests, setRequests] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  async function refresh() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: queryError } = await supabase.from("verification_requests").select("id,status,created_at,reviewed_at").eq("landlord_id", user.id).order("created_at", { ascending: false });
    setRequests(data ?? []); setError(queryError?.message ?? "");
  }
  useEffect(() => {
    refresh();
    function openFromLink() {
      if (window.location.hash === "#verification") {
        setExpanded(true);
        document.getElementById("verification")?.scrollIntoView({ block: "start" });
      }
    }
    openFromLink();
    window.addEventListener("hashchange", openFromLink);
    return () => window.removeEventListener("hashchange", openFromLink);
  }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      if (!file || file.size > 10 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) throw new Error(t("verification.uploadError"));
      const client = requireSupabase();
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error(t("verification.signInLandlordFirst"));
      const path = `${user.id}/${crypto.randomUUID()}.${file.name.split(".").pop().toLowerCase()}`;
      const { error: uploadError } = await client.storage.from("verification-documents").upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { error: saveError } = await client.from("verification_requests").insert({ landlord_id: user.id, full_name: String(form.get("full_name")).trim(), phone: String(form.get("phone")).trim(), document_path: path });
      if (saveError) throw saveError;
      formElement.reset(); setFile(null); refresh();
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }
  return <section id="verification" aria-labelledby="identity-verification-title" className="scroll-mt-24 pt-2 pb-6">
    <h2 id="identity-verification-title">
      <button type="button" aria-expanded={expanded} aria-controls="identity-verification-content" onClick={() => setExpanded(value => !value)} className="flex min-h-12 w-full items-center gap-3 rounded-lg text-left text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>
        </span>
        <span className="min-w-0 flex-1"><span className="block text-base font-semibold">{t("verification.title")}</span><span className="mt-1 block text-sm font-normal text-muted">{expanded ? t("verification.manageDescription") : t("verification.viewDescription")}</span></span>
        {requests[0] && <span className={`${statusBadgeClassName} max-w-24 shrink-0 justify-center text-center break-words`}>{t(`common.verificationStatus.${requests[0].status}`)}</span>}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`size-5 shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
      </button>
    </h2>
    <div id="identity-verification-content" hidden={!expanded}>
    <p className="mt-4 text-sm text-muted">{t("verification.visibilityNote")}</p>
    {requests.length > 0 && <div className="mt-6">{requests.map((request) => <div key={request.id} className="flex flex-wrap justify-between gap-2 py-4"><span className="text-sm text-muted">{t("verification.submitted", { date: new Date(request.created_at).toLocaleDateString() })}</span><strong className="text-sm font-medium text-ink">{t(`common.verificationStatus.${request.status}`)}</strong></div>)}</div>}
    <form onSubmit={submit} className="mt-6 grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">{t("verification.submitDocument")}</h3>
        <button
          type="button"
          aria-expanded={showRequirements}
          aria-controls="verification-requirements"
          onClick={() => setShowRequirements((visible) => !visible)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 11v6" />
            <circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none" />
          </svg>
          {t("verification.whatToInclude")}
        </button>
      </div>
      <section id="verification-requirements" hidden={!showRequirements} aria-labelledby="verification-requirements-title" className="py-5 text-sm leading-6 text-muted">
        <h4 id="verification-requirements-title" className="font-semibold text-ink">{t("verification.requirementsHeading")}</h4>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><strong className="text-ink">{t("verification.nameLabel")}</strong> {t("verification.nameHint")}</li>
          <li><strong className="text-ink">{t("verification.phoneLabel")}</strong> {t("verification.phoneHint")}</li>
          <li><strong className="text-ink">{t("verification.documentLabel")}</strong> {t("verification.documentHint")}</li>
          <li><strong className="text-ink">{t("verification.fileLabel")}</strong> {t("verification.fileHint")}</li>
        </ul>
        <p className="mt-4"><strong className="text-ink">{t("verification.demoLabel")}</strong> {t("verification.demoHint")}</p>
        <p className="mt-2">{t("verification.reviewNote")}</p>
      </section>
      <label className="min-w-0 text-xs font-medium text-muted">{t("verification.legalName")}
        <input name="full_name" required minLength="2" maxLength="120" autoComplete="name" placeholder={t("verification.legalNamePlaceholder")} className="mt-2 min-h-12 w-full min-w-0 rounded-md border border-line bg-transparent px-3 text-base outline-none focus:border-ink focus:ring-1 focus:ring-ink" />
      </label>
      <label className="min-w-0 text-xs font-medium text-muted">{t("verification.phoneNumber")}
        <input name="phone" type="tel" required minLength="6" maxLength="30" autoComplete="tel" placeholder={t("verification.phoneNumberPlaceholder")} className="mt-2 min-h-12 w-full min-w-0 rounded-md border border-line bg-transparent px-3 text-base outline-none focus:border-ink focus:ring-1 focus:ring-ink" />
      </label>
      <div>
        <label className="min-w-0 text-xs font-medium text-muted">{t("verification.identityDocument")}
          <input type="file" required accept="application/pdf,image/jpeg,image/png" aria-describedby="verification-file-help" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full min-w-0 rounded-md border border-line bg-transparent p-3 text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink focus-visible:outline-2 focus-visible:outline-ink" />
        </label>
        <p id="verification-file-help" className="mt-2 text-xs leading-5 text-muted">{t("verification.fileHelp")}</p>
      </div>
      {error && <p role="alert" className="text-sm text-accent">{error}</p>}
      <button disabled={busy} className={`${primaryButtonClassName} min-h-12`}>{busy ? t("verification.submitting") : t("verification.submitForReview")}</button>
    </form>
    </div>
  </section>;
}
