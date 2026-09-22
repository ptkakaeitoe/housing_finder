export const LOCALES = ["en", "th", "my", "zh"];
export const DEFAULT_LOCALE = "en";

export const LOCALE_LABELS = {
  en: "English",
  th: "ไทย",
  my: "မြန်မာ",
  zh: "中文",
};

export function isLocale(value) {
  return LOCALES.includes(value);
}

export const INTL_LOCALES = {
  en: "en",
  th: "th",
  my: "my",
  zh: "zh-CN",
};

export function matchBrowserLocale(languages) {
  for (const tag of languages ?? []) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
