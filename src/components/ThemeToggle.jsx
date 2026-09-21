"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
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
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}>
      <span className="text-xl leading-none" aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
