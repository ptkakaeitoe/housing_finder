"use client";
import { useEffect, useState } from "react";
import { supabase, requireSupabase } from "../lib/supabase";

export default function LandlordVerificationPage() {
  const [requests, setRequests] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: queryError } = await supabase.from("verification_requests").select("id,status,created_at,reviewed_at").eq("landlord_id", user.id).order("created_at", { ascending: false });
    setRequests(data ?? []); setError(queryError?.message ?? "");
  }
  useEffect(() => { refresh(); }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      if (!file || file.size > 10 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) throw new Error("Upload a PDF, JPG, or PNG under 10 MB.");
      const client = requireSupabase();
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error("Sign in as a landlord first.");
      const path = `${user.id}/${crypto.randomUUID()}.${file.name.split(".").pop().toLowerCase()}`;
      const { error: uploadError } = await client.storage.from("verification-documents").upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { error: saveError } = await client.from("verification_requests").insert({ landlord_id: user.id, full_name: String(form.get("full_name")).trim(), phone: String(form.get("phone")).trim(), document_path: path });
      if (saveError) throw saveError;
      formElement.reset(); setFile(null); refresh();
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }
  return <><main className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-semibold tracking-tight text-ink">Identity verification</h1><p className="mt-2 text-sm text-muted">Your document is visible only to you and administrators.</p>
    {requests.length > 0 && <div className="mt-8 border-t border-line">{requests.map((request) => <div key={request.id} className="flex justify-between border-b border-line py-5"><span className="text-sm text-muted">Submitted {new Date(request.created_at).toLocaleDateString()}</span><strong className="text-sm text-accent uppercase">{request.status}</strong></div>)}</div>}
    <form onSubmit={submit} className="mt-8 grid gap-5 border-t border-line pt-6"><h2 className="text-xl font-semibold text-ink">Submit a document</h2><label className="text-sm font-semibold text-ink">Legal name<input name="full_name" required minLength="2" maxLength="120" className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base" /></label><label className="text-sm font-semibold text-ink">Phone number<input name="phone" type="tel" required minLength="6" maxLength="30" className="mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-base" /></label><label className="text-sm font-semibold text-ink">Identity document<input type="file" required accept=".pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-line bg-canvas p-3 text-sm" /></label>{error && <p role="alert" className="text-sm text-accent">{error}</p>}<button disabled={busy} className="min-h-12 rounded-full bg-ink font-bold text-canvas disabled:opacity-50">{busy ? "Submitting…" : "Submit for review"}</button></form>
  </main></>;
}
