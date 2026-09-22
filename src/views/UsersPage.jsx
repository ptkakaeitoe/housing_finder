"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
export default function UsersPage() {
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
      if (!session) throw new Error('Sign in again before managing accounts.');
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ userId: user.id, action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Account action failed.');
      setMessage(`Account ${action === 'delete' ? 'deleted' : action === 'suspend' ? 'suspended' : 'reactivated'}.`);
      setConfirmation(null);
    } catch (cause) { setError(cause.message); }
    finally { await refresh(); setBusy(false); }
  }
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-semibold tracking-tight text-ink">Users</h1><p className="mt-2 text-sm text-muted">Manage student and landlord accounts. Administrator accounts are protected.</p>
    {admin === false && <p className="mt-8 text-muted">Admin access required.</p>}
    {error && !confirmation && <p role="alert" className="mt-5 text-accent">{error}</p>}
    <p role="status" className="mt-4 text-sm text-muted">{message}</p>
    {admin && confirmation && <dialog ref={dialogRef} aria-labelledby="account-action-title" aria-describedby="account-action-description" onCancel={event => { event.preventDefault(); if (!busy) setConfirmation(null); }} onClick={event => { if (event.target === event.currentTarget && !busy) setConfirmation(null); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-black/35 backdrop:backdrop-blur-sm">
      <div className="p-6 sm:p-7">
      <h2 id="account-action-title" className="text-lg font-semibold capitalize text-ink">{confirmation.action} account: {confirmation.user.full_name || 'Unnamed user'}</h2>
      <p id="account-action-description" className="mt-2 text-sm leading-6 text-muted">{confirmation.action === 'delete' ? 'Permanently delete this account, its listings, uploaded files and related viewing/saved records. This cannot be undone.' : confirmation.action === 'suspend' ? 'Block sign-in and account activity. Existing listings stay published. You can reactivate this account later.' : 'Allow this user to sign in and use their account again.'}</p>
      {confirmation.action === 'delete' && <label className="mt-4 block text-sm text-ink">Type DELETE to confirm<input autoFocus value={typedName} onChange={event => setTypedName(event.target.value)} disabled={busy} className="mt-2 block min-h-11 w-full rounded-xl border border-line bg-canvas px-4" /></label>}
      {error && <p role="alert" className="mt-4 text-sm text-accent">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button onClick={moderate} disabled={busy || (confirmation.action === 'delete' && typedName !== 'DELETE')} className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-canvas disabled:opacity-40">{busy ? 'Processing…' : confirmation.action === 'delete' ? 'Delete account' : confirmation.action === 'suspend' ? 'Suspend account' : 'Reactivate account'}</button><button autoFocus={confirmation.action !== 'delete'} onClick={() => setConfirmation(null)} disabled={busy} className="min-h-11 rounded-full border border-line px-5 text-sm text-ink">Cancel</button></div>
      </div>
    </dialog>}
    {admin && <div className="mt-8 border-t border-line">{loading ? <p className="py-8 text-muted">Loading users…</p> : users.length === 0 && !error ? <p className="py-8 text-muted">No users yet.</p> : null}{users.map(user => <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5"><div><strong className="text-ink">{user.full_name || 'Unnamed user'}</strong><p className="mt-1 text-xs text-muted">Joined {new Date(user.created_at).toLocaleDateString()}</p><p className="mt-2 text-xs font-semibold capitalize text-accent">{user.role} · {user.account_status}</p></div>{user.role !== 'admin' && <div className="flex gap-3"><button disabled={busy} onClick={() => ask(user, user.account_status === 'suspended' ? 'reactivate' : 'suspend')} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-40">{user.account_status === 'suspended' ? 'Reactivate' : 'Suspend'}</button><button disabled={busy} onClick={() => ask(user, 'delete')} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-40">Delete</button></div>}</div>)}</div>}
  </main>;
}
