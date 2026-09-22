export function getLocalizedTitle(listing, locale) {
  return listing?.[`title_${locale}`] || listing?.title || "";
}

export function getLocalizedDescription(listing, locale) {
  return listing?.[`description_${locale}`] || listing?.description || "";
}
