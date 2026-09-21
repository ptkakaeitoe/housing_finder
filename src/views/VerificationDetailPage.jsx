"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
export default function VerificationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
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
  return <><main className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><Link href="/admin-verifications" className="text-sm font-semibold text-accent">← Verification queue</Link><h1 className="mt-6 text-4xl font-semibold tracking-tight text-ink">Identity review</h1>{admin === false && <p className="mt-8 text-muted">Admin access required.</p>}{error && <p role="alert" className="mt-5 text-accent">{error}</p>}{request && <div className="mt-8 grid gap-5 border-t border-line pt-6"><p className="text-muted">Name <strong className="block text-lg text-ink">{request.full_name}</strong></p><p className="text-muted">Phone <strong className="block text-lg text-ink">{request.phone}</strong></p><p className="text-sm text-muted">Submitted {new Date(request.created_at).toLocaleString()} · {request.status}</p><button onClick={openDocument} className="justify-self-start text-sm font-bold text-accent underline">Open private document ↗</button>{request.status === "pending" && <div className="flex flex-wrap gap-3"><button onClick={() => review("approved")} className="rounded-full bg-ink px-6 py-3 font-bold text-canvas">Approve</button><button onClick={() => review("rejected")} className="rounded-full border border-line px-6 py-3 font-bold text-ink">Reject</button></div>}</div>}</main></>;
}
