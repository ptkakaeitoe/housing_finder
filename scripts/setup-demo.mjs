import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { demoListings } from './demoListings.mjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !publicKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local, then run npm run setup:demo. The service key must never have a NEXT_PUBLIC_ prefix.');
  process.exit(1);
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const client = createClient(url, key, options);
const accounts = [
  { email: 'landlord@housingfinder.example', password: 'LandlordDemo2026!', role: 'landlord', name: 'Campus Homes Demo Landlord' },
  { email: 'admin@housingfinder.example', password: 'AdminDemo2026!', role: 'admin', name: 'HousingFinder Demo Admin' },
  { email: 'student@housingfinder.example', password: 'StudentDemo2026!', role: 'student', name: 'Demo Student' },
];
function check(result, action) {
  if (result.error) throw new Error(`${action}: ${result.error.message}`);
  return result.data;
}

try {
  // Fail before creating accounts if the migrations have not been applied.
  check(await client.from('listings').select('id,university_id,lease_duration_months').limit(1), 'Check migrations');
  const users = [];
  for (let page = 1; ; page++) {
    const data = check(await client.auth.admin.listUsers({ page, perPage: 100 }), 'Find demo accounts');
    users.push(...data.users);
    if (data.users.length < 100) break;
  }
  // Do not overwrite an unrelated account that happens to share a demo address.
  for (const account of accounts) {
    const existing = users.find(user => user.email === account.email);
    if (existing && existing.app_metadata?.demo_project !== 'housingfinder') {
      throw new Error(`${account.email} already exists and is not a managed demo account.`);
    }
  }
  for (const account of accounts) {
    const existing = users.find(user => user.email === account.email);
    const attributes = {
      email: account.email, password: account.password, email_confirm: true,
      user_metadata: { full_name: account.name, role: account.role },
      app_metadata: { demo_project: 'housingfinder' },
    };
    const { user } = check(existing
      ? await client.auth.admin.updateUserById(existing.id, attributes)
      : await client.auth.admin.createUser(attributes), `Create ${account.role}`);
    account.id = user.id;
    check(await client.from('profiles').upsert({ id: user.id, full_name: account.name, role: account.role }), `Set ${account.role} profile`);
  }

  const landlord = accounts.find(account => account.role === 'landlord');
  for (const [index, home] of demoListings.entries()) {
    const existing = check(await client.from('listings').select('id,landlord_id').eq('id', home.id).maybeSingle(), 'Check listing');
    if (existing) {
      if (existing.landlord_id !== landlord.id) throw new Error(`Listing ${home.id} belongs to another owner.`);
      continue; // Preserve edits and admin publication decisions on subsequent runs.
    }
    const imagePath = `${landlord.id}/demo/${home.id}.jpg`;
    const bytes = await readFile(new URL(`../public${home.image_path}`, import.meta.url));
    check(await client.storage.from('listing-images').upload(imagePath, bytes, { contentType: 'image/jpeg', upsert: true }), 'Upload demo image');
    check(await client.from('listings').insert({ ...home, landlord_id: landlord.id, image_path: imagePath, lease_duration_months: [6, 12, 3, 6, 12, 6][index] }), 'Create demo listing');
  }

  // Verify the actual password login and role visibility through the public key.
  for (const account of accounts) {
    const session = createClient(url, publicKey, options);
    check(await session.auth.signInWithPassword({ email: account.email, password: account.password }), `Verify ${account.role} login`);
    const profile = check(await session.from('profiles').select('role').eq('id', account.id).single(), 'Verify profile');
    if (profile.role !== account.role) throw new Error(`Incorrect role for ${account.email}`);
    if (account.role !== 'student') {
      const listings = check(await session.from('listings').select('id').eq('landlord_id', landlord.id), 'Verify listing access');
      if (listings.length < demoListings.length) throw new Error(`${account.role} cannot see all demo listings.`);
    }
    if (account.role === 'admin') {
      if (!check(await session.rpc('is_admin'), 'Verify admin access')) throw new Error('Admin authorization failed.');
      check(await session.from('verification_requests').select('id').limit(1), 'Verify admin panel');
    }
    await session.auth.signOut();
  }
  console.log('Demo setup complete: six landlord-owned homes, with verified landlord, admin and student logins.');
  for (const account of accounts) console.log(`${account.role}: ${account.email} / ${account.password}`);
} catch (error) {
  console.error(`Demo setup failed: ${error.message}`);
  process.exitCode = 1;
}
