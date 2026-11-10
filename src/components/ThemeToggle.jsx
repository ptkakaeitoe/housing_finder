"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function ThemeToggle() {
  const { t } = useLocale();
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("rsu-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const next = saved === "dark" || saved === "light" ? saved : preferred;
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  function toggle() {
    const next = (theme ?? document.documentElement.dataset.theme) === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("rsu-theme", next);
    setTheme(next);
  }

  return (
    <button className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-ink" type="button" onClick={toggle}
      aria-label={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
      title={theme === "dark" ? t("theme.lightMode") : t("theme.darkMode")}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-5">{theme === "dark" ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />}</svg>
    </button>
  );
}
