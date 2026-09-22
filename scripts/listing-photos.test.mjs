import test from 'node:test';
import assert from 'node:assert/strict';
import { listingPhotos, validateListingPhotos } from '../src/lib/listingPhotos.js';

test('legacy photos remain visible, galleries use their selected cover order', () => {
  assert.deepEqual(listingPhotos({ image_path: 'owner/old.jpg' }), ['owner/old.jpg']);
  assert.deepEqual(listingPhotos({ image_path: 'owner/old.jpg', image_paths: ['owner/new.jpg', 'owner/old.jpg'] }), ['owner/new.jpg', 'owner/old.jpg']);
  assert.deepEqual(listingPhotos({ image_path: null, image_paths: [] }), []);
});
test('photo limits include retained photos and allow exactly 5 MB', () => {
  const image = { name: 'room.jpg', type: 'image/jpeg', size: 5 * 1024 * 1024 };
  assert.equal(validateListingPhotos([image], 9), '');
  assert.match(validateListingPhotos([image], 10), /10 photos/);
  assert.match(validateListingPhotos([{ ...image, size: image.size + 1 }]), /5 MB/);
  assert.match(validateListingPhotos([{ ...image, size: 0 }]), /5 MB/);
  assert.match(validateListingPhotos([{ ...image, type: 'application/pdf' }]), /JPG, PNG or WebP/);
});
