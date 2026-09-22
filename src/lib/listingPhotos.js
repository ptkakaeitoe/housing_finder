export const MAX_LISTING_PHOTOS = 10;
export function listingPhotos(listing) {
  return listing?.image_paths?.length ? listing.image_paths : listing?.image_path ? [listing.image_path] : [];
}
export function validateListingPhotos(files, existingCount = 0) {
  if (files.length + existingCount > MAX_LISTING_PHOTOS) return 'Add up to 10 photos per listing.';
  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      return `${file.name}: choose a JPG, PNG or WebP image, up to 5 MB.`;
    }
  }
  return '';
}
