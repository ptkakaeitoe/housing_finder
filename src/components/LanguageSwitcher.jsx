"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_LABELS } from "../lib/i18n/config";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button type="button" className="flex h-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted px-3 text-xs font-bold text-ink uppercase transition-colors hover:border-accent hover:text-accent"
        aria-label={t("language.label")} aria-haspopup="listbox" aria-expanded={open}
        onClick={() => setOpen((value) => !value)}>
        {locale}
      </button>
      {open && (
        <ul role="listbox" aria-label={t("language.label")} className="absolute top-full right-0 z-50 mt-2 min-w-32 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
          {LOCALES.map((code) => (
            <li key={code}>
              <button type="button" role="option" aria-selected={code === locale}
                className={`block w-full px-4 py-2.5 text-left text-sm font-semibold ${code === locale ? "bg-surface-muted text-accent" : "text-ink hover:bg-surface-muted"}`}
                onClick={() => { setLocale(code); setOpen(false); }}>
                {LOCALE_LABELS[code]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
