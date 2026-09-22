import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
const sessions = [];
let listingId;
let landlord;
const uploadedPhotos = [];
try {
  async function login(role, password) {
    const client = createClient(url, key, options);
    checked(await client.auth.signInWithPassword({ email: `${role}@housingfinder.example`, password }));
    sessions.push(client);
    return client;
  }
  landlord = await login('landlord', 'LandlordDemo2026!');
  const admin = await login('admin', 'AdminDemo2026!');
  const student = await login('student', 'StudentDemo2026!');
  const anonymous = createClient(url, key, options);
  const home = checked(await landlord.from('listings').insert({
    title: 'Temporary demo verification home', property_type: 'room', monthly_rent: 4000,
    address: 'Fictional test address', latitude: 13.74, longitude: 100.53,
    status: 'published',
  }).select().single());
  listingId = home.id;
  const poster = checked(await anonymous.rpc('listing_poster', { listing_id: listingId }));
  assert.equal(poster.length, 1);
  assert.equal(typeof poster[0].full_name, 'string');
  assert.deepEqual(Object.keys(poster[0]).sort(), ['full_name', 'verified']);
  const selfApproval = await landlord.from('listing_reviews').insert({ listing_id: listingId, status: 'approved' });
  assert.ok(selfApproval.error, 'Landlords cannot approve their own listings');
  checked(await admin.from('listing_reviews').insert({ listing_id: listingId, status: 'approved' }));
  assert.equal(checked(await anonymous.from('listing_reviews').select('status').eq('listing_id', listingId).single()).status, 'approved');
  checked(await landlord.from('listings').update({ description: 'Updated content requires review' }).eq('id', listingId));
  assert.equal(checked(await anonymous.from('listing_reviews').select('status').eq('listing_id', listingId)).length, 0);
  const costs = { security_deposit: 8000, electricity_billing: 'metered', electricity_rate: 7.5, water_billing: 'included', water_rate: null, internet_billing: 'monthly', internet_rate: 300, van_service: 'paid', van_details: 'Demo campus gate, weekdays 08:00, 20 THB per trip' };
  checked(await landlord.from('listings').update(costs).eq('id', listingId).select().single());
  const publicCosts = checked(await anonymous.from('listings').select(Object.keys(costs).join(',')).eq('id', listingId).single());
  assert.deepEqual(publicCosts, costs);
  const invalidRate = await landlord.from('listings').update({ electricity_rate: -1 }).eq('id', listingId);
  assert.ok(invalidRate.error, 'Negative utility rates must be rejected');
  const missingRate = await landlord.from('listings').update({ electricity_rate: null }).eq('id', listingId);
  assert.ok(missingRate.error, 'Metered utilities require a rate');
  const bytes = await readFile(new URL('../public/images/listings/muang-ake-studio.jpg', import.meta.url));
  for (let index = 0; index < 2; index++) {
    const path = `${home.landlord_id}/test-${randomUUID()}.jpg`;
    checked(await landlord.storage.from('listing-images').upload(path, bytes, { contentType: 'image/jpeg' }));
    uploadedPhotos.push(path);
  }
  checked(await landlord.from('listings').update({ image_paths: uploadedPhotos, image_path: uploadedPhotos[0] }).eq('id', listingId).select().single());
  const gallery = checked(await anonymous.from('listings').select('image_paths,image_path').eq('id', listingId).single());
  assert.deepEqual(gallery.image_paths, uploadedPhotos);
  assert.equal(gallery.image_path, uploadedPhotos[0]);
  const invalidGallery = await landlord.from('listings').update({ image_paths: ['another-owner/photo.jpg'] }).eq('id', listingId);
  assert.ok(invalidGallery.error, 'Gallery paths must belong to the landlord');
  const overLimit = await landlord.from('listings').update({ image_paths: Array(11).fill(uploadedPhotos[0]) }).eq('id', listingId);
  assert.ok(overLimit.error, 'The database must reject more than ten photos');
  const changedGallery = checked(await landlord.from('listings').update({ image_paths: [uploadedPhotos[1]], image_path: uploadedPhotos[1] }).eq('id', listingId).select('image_paths,image_path').single());
  assert.deepEqual(changedGallery.image_paths, [uploadedPhotos[1]]);
  assert.equal(changedGallery.image_path, uploadedPhotos[1]);
  checked(await landlord.from('listings').update({ monthly_rent: 4200 }).eq('id', listingId).select().single());
  checked(await student.from('saved_listings').insert({ listing_id: listingId }));
  const request = checked(await student.from('viewing_requests').insert({
    listing_id: listingId, preferred_at: new Date(Date.now() + 86400000).toISOString(),
    message: 'Automated demo flow check',
  }).select().single());
  checked(await landlord.rpc('set_viewing_status', { request_id: request.id, next_status: 'accepted' }));
  const accepted = checked(await student.from('viewing_requests').select('status').eq('id', request.id).single());
  assert.equal(accepted.status, 'accepted');

  const forbidden = await student.from('listings').update({ monthly_rent: 1 }).eq('id', listingId).select();
  assert.ok(forbidden.error || forbidden.data.length === 0, 'Students must not edit landlord homes');
  const homeAfter = checked(await landlord.from('listings').select('monthly_rent').eq('id', listingId).single());
  assert.equal(Number(homeAfter.monthly_rent), 4200);
  assert.equal(checked(await student.rpc('is_admin')), false);
  assert.equal(checked(await admin.rpc('is_admin')), true);
  checked(await admin.from('listings').update({ status: 'draft' }).eq('id', listingId).select().single());
  assert.equal(checked(await anonymous.from('listings').select('id').eq('id', listingId)).length, 0);
  assert.equal(checked(await student.from('listings').select('id').eq('id', listingId)).length, 0);
  assert.equal(checked(await landlord.from('listings').select('id').eq('id', listingId)).length, 1);
  assert.equal(checked(await admin.from('listings').select('id').eq('id', listingId)).length, 1);
  console.log('Passed: deposit/utility/van persistence and constraints, multiple photo upload/persistence/removal/cover selection, gallery restrictions, landlord create/edit, student save/request, landlord accept, admin moderation, and role/visibility restrictions.');
} catch (error) {
  console.error(`Demo verification failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (listingId && landlord) {
    const { error } = await landlord.from('listings').delete().eq('id', listingId);
    if (error) {
      console.error(`Could not remove temporary listing ${listingId}: ${error.message}`);
      process.exitCode = 1;
    }
  }
  if (landlord && uploadedPhotos.length) {
    const { error } = await landlord.storage.from('listing-images').remove(uploadedPhotos);
    if (error) { console.error(`Could not remove test photos: ${error.message}`); process.exitCode = 1; }
  }
  await Promise.all(sessions.map(client => client.auth.signOut()));
}
