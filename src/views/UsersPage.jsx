"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import Avatar from "../components/Avatar";
import { useLocale } from "../lib/i18n/LocaleContext";
import { publicPageClassName, publicPageHeadingClassName } from "../components/layoutStyles";
import { primaryButtonClassName, secondaryButtonClassName, quietButtonClassName, inputClassName, statusBadgeClassName } from "../components/uiStyles";
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
  return <main className={`${publicPageClassName} text-ink`}>
    <h1 className={publicPageHeadingClassName}>{t("users.heading")}</h1>
    <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{t("users.subheading")}</p>
    {admin === false && <p className="mt-8 text-sm text-muted">{t("common.adminRequired")}</p>}
    {error && !confirmation && <p role="alert" className="mt-5 text-sm text-accent">{error}</p>}
    <p role="status" className={message ? "mt-4 text-sm text-muted" : "sr-only"}>{message}</p>
    {admin && confirmation && <dialog ref={dialogRef} aria-labelledby="account-action-title" aria-describedby="account-action-description" onCancel={event => { event.preventDefault(); if (!busy) setConfirmation(null); }} onClick={event => { if (event.target === event.currentTarget && !busy) setConfirmation(null); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl bg-canvas p-0 text-ink shadow-xl backdrop:bg-black/30">
      <div className="p-5 sm:p-7">
        <h2 id="account-action-title" className="text-lg font-semibold leading-7 break-words">{t("users.dialogTitle", { action: t(`users.actionLabel.${confirmation.action}`), name: confirmation.user.full_name || t("users.unnamedUser") })}</h2>
        <p id="account-action-description" className="mt-2 text-sm leading-6 text-muted">{confirmation.action === 'delete' ? t("users.deleteWarning") : confirmation.action === 'suspend' ? t("users.suspendWarning") : t("users.reactivateWarning")}</p>
        {confirmation.action === 'delete' && <label className="mt-5 block text-xs font-medium text-muted">{t("users.typeDeleteConfirm")}<input autoFocus value={typedName} onChange={event => setTypedName(event.target.value)} disabled={busy} className={`mt-2 ${inputClassName}`} /></label>}
        {error && <p role="alert" className="mt-4 text-sm text-accent">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" autoFocus={confirmation.action !== 'delete'} onClick={() => setConfirmation(null)} disabled={busy} className={secondaryButtonClassName}>{t("profile.cancel")}</button>
          <button type="button" onClick={moderate} disabled={busy || (confirmation.action === 'delete' && typedName !== 'DELETE')} className={primaryButtonClassName}>{busy ? t("users.processing") : confirmation.action === 'delete' ? t("users.deleteAccount") : confirmation.action === 'suspend' ? t("users.suspendAccount") : t("users.reactivateAccount")}</button>
        </div>
      </div>
    </dialog>}
    {(admin === null || (admin && loading)) && <p role="status" className="mt-8 text-sm text-muted">{t("users.loadingUsers")}</p>}
    {admin && !loading && <ul className="mt-8 space-y-2">
      {users.length === 0 && !error && <li className="py-6 text-sm text-muted">{t("users.noneYet")}</li>}
      {users.map(user => <li key={user.id} className="flex min-w-0 flex-wrap items-start gap-3 py-4 sm:gap-4">
        <Avatar className="size-10" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-6 break-words">{user.full_name || t("users.unnamedUser")}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">{t("users.joined", { date: new Date(user.created_at).toLocaleDateString() })}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs text-muted">{t(`common.role.${user.role}`)}</span><span className={statusBadgeClassName}>{t(`common.accountStatus.${user.account_status}`)}</span></div>
        </div>
        {user.role !== 'admin' && <div className="flex w-full flex-wrap gap-2 pl-[52px] sm:w-auto sm:pl-0">
          <button type="button" disabled={busy} onClick={() => ask(user, user.account_status === 'suspended' ? 'reactivate' : 'suspend')} className={secondaryButtonClassName}>{user.account_status === 'suspended' ? t("users.reactivate") : t("users.suspend")}</button>
          <button type="button" disabled={busy} onClick={() => ask(user, 'delete')} className={quietButtonClassName}>{t("users.delete")}</button>
        </div>}
      </li>)}
    </ul>}
  </main>;
}
