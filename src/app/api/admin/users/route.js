import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ error: 'Account management is not configured on the server.' }, { status: 503 });
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return Response.json({ error: 'Sign in as an administrator.' }, { status: 401 });
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await client.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ error: 'Your session is invalid. Sign in again.' }, { status: 401 });
  const { data: actor, error: actorError } = await client.from('profiles').select('role,account_status').eq('id', auth.user.id).single();
  if (actorError) return Response.json({ error: 'Account moderation is unavailable. Apply the account moderation migration first.' }, { status: 503 });
  if (actor.role !== 'admin' || actor.account_status !== 'active') return Response.json({ error: 'Admin access required.' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const { userId, action } = body || {};
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(userId || '') || !['suspend', 'reactivate', 'delete'].includes(action)) return Response.json({ error: 'Choose a valid account and action.' }, { status: 400 });
  if (userId === auth.user.id) return Response.json({ error: 'You cannot moderate your own account.' }, { status: 403 });
  const { data: target, error: targetError } = await client.from('profiles').select('role,account_status').eq('id', userId).single();
  if (targetError) return Response.json({ error: 'Account not found.' }, { status: 404 });
  if (target.role === 'admin') return Response.json({ error: 'Administrator accounts are protected.' }, { status: 403 });
  function checked(result) { if (result.error) throw new Error(result.error.message); return result.data; }
  async function status(value) { checked(await client.from('profiles').update({ account_status: value }).eq('id', userId).select('id').single()); }
  try {
    if (action === 'reactivate') {
      checked(await client.auth.admin.updateUserById(userId, { ban_duration: 'none' }));
      await status('active');
    } else {
      // Block existing sessions before banning future logins or deleting data.
      await status('suspended');
      checked(await client.auth.admin.updateUserById(userId, { ban_duration: '876000h' }));
      if (action === 'delete') {
        // Supabase requires owned storage objects to be removed before deleting a user.
        for (const bucket of ['listing-images', 'verification-documents']) {
          const paths = [];
          async function collect(prefix) {
            for (let offset = 0; ; offset += 100) {
              const rows = checked(await client.storage.from(bucket).list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } }));
              for (const row of rows) {
                const path = `${prefix}/${row.name}`;
                if (row.id) paths.push(path); else await collect(path);
              }
              if (rows.length < 100) break;
            }
          }
          await collect(userId);
          for (let index = 0; index < paths.length; index += 100) checked(await client.storage.from(bucket).remove(paths.slice(index, index + 100)));
        }
        checked(await client.auth.admin.deleteUser(userId));
      }
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: `${action === 'delete' ? 'Deletion did not finish; the account remains suspended. Some files may already have been removed. ' : 'Account action did not finish. Refresh and retry. '}${error.message}` }, { status: 500 });
  }
}
