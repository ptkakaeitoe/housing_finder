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
    <button className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted text-ink transition-colors hover:border-accent hover:text-accent" type="button" onClick={toggle}
      aria-label={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
      title={theme === "dark" ? t("theme.lightMode") : t("theme.darkMode")}>
      <span className="text-xl leading-none" aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
