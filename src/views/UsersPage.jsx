"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import { useLocale } from "../lib/i18n/LocaleContext";
export default function UsersPage() {
  const { t } = useLocale();
  const admin = useAdmin();
  const dialogRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [typedName, setTypedName] = useState("");
  const [message, setMessage] = useState("");
  async function refresh() {
    const { data, error } = await supabase.from('profiles').select('id,full_name,role,created_at,account_status').order('created_at', { ascending: false });
    setUsers(data ?? []); setLoading(false);
    if (error) setError(error.message);
  }
  useEffect(() => { if (admin) refresh(); }, [admin]);
  useEffect(() => {
    if (!admin || !confirmation || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [admin, confirmation]);
  function ask(user, action) { setConfirmation({ user, action }); setTypedName(''); setError(''); setMessage(''); }
  async function moderate() {
    if (!confirmation || busy) return;
    const { user, action } = confirmation;
    if (action === 'delete' && typedName !== 'DELETE') return;
    setBusy(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t("users.signInAgainError"));
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ userId: user.id, action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("users.actionFailedError"));
      setMessage(action === 'delete' ? t("users.accountDeleted") : action === 'suspend' ? t("users.accountSuspended") : t("users.accountReactivated"));
      setConfirmation(null);
    } catch (cause) { setError(cause.message); }
    finally { await refresh(); setBusy(false); }
  }
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-semibold tracking-tight text-ink">{t("users.heading")}</h1><p className="mt-2 text-sm text-muted">{t("users.subheading")}</p>
    {admin === false && <p className="mt-8 text-muted">{t("common.adminRequired")}</p>}
    {error && !confirmation && <p role="alert" className="mt-5 text-accent">{error}</p>}
    <p role="status" className="mt-4 text-sm text-muted">{message}</p>
    {admin && confirmation && <dialog ref={dialogRef} aria-labelledby="account-action-title" aria-describedby="account-action-description" onCancel={event => { event.preventDefault(); if (!busy) setConfirmation(null); }} onClick={event => { if (event.target === event.currentTarget && !busy) setConfirmation(null); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-black/35 backdrop:backdrop-blur-sm">
      <div className="p-6 sm:p-7">
      <h2 id="account-action-title" className="text-lg font-semibold text-ink">{t("users.dialogTitle", { action: t(`users.actionLabel.${confirmation.action}`), name: confirmation.user.full_name || t("users.unnamedUser") })}</h2>
      <p id="account-action-description" className="mt-2 text-sm leading-6 text-muted">{confirmation.action === 'delete' ? t("users.deleteWarning") : confirmation.action === 'suspend' ? t("users.suspendWarning") : t("users.reactivateWarning")}</p>
      {confirmation.action === 'delete' && <label className="mt-4 block text-sm text-ink">{t("users.typeDeleteConfirm")}<input autoFocus value={typedName} onChange={event => setTypedName(event.target.value)} disabled={busy} className="mt-2 block min-h-11 w-full rounded-xl border border-line bg-canvas px-4" /></label>}
      {error && <p role="alert" className="mt-4 text-sm text-accent">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button onClick={moderate} disabled={busy || (confirmation.action === 'delete' && typedName !== 'DELETE')} className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-canvas disabled:opacity-40">{busy ? t("users.processing") : confirmation.action === 'delete' ? t("users.deleteAccount") : confirmation.action === 'suspend' ? t("users.suspendAccount") : t("users.reactivateAccount")}</button><button autoFocus={confirmation.action !== 'delete'} onClick={() => setConfirmation(null)} disabled={busy} className="min-h-11 rounded-full border border-line px-5 text-sm text-ink">{t("profile.cancel")}</button></div>
      </div>
    </dialog>}
    {admin && <div className="mt-8 border-t border-line">{loading ? <p className="py-8 text-muted">{t("users.loadingUsers")}</p> : users.length === 0 && !error ? <p className="py-8 text-muted">{t("users.noneYet")}</p> : null}{users.map(user => <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5"><div><strong className="text-ink">{user.full_name || t("users.unnamedUser")}</strong><p className="mt-1 text-xs text-muted">{t("users.joined", { date: new Date(user.created_at).toLocaleDateString() })}</p><p className="mt-2 text-xs font-semibold text-accent">{t(`common.role.${user.role}`)} · {t(`common.accountStatus.${user.account_status}`)}</p></div>{user.role !== 'admin' && <div className="flex gap-3"><button disabled={busy} onClick={() => ask(user, user.account_status === 'suspended' ? 'reactivate' : 'suspend')} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-40">{user.account_status === 'suspended' ? t("users.reactivate") : t("users.suspend")}</button><button disabled={busy} onClick={() => ask(user, 'delete')} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-40">{t("users.delete")}</button></div>}</div>)}</div>}
  </main>;
}
