"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, isLocale, matchBrowserLocale } from "./config";
import en from "./dictionaries/en.json";
import th from "./dictionaries/th.json";
import my from "./dictionaries/my.json";
import zh from "./dictionaries/zh.json";

const dictionaries = { en, th, my, zh };
const LocaleContext = createContext(null);

function readPath(dictionary, key) {
  return key.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), dictionary);
}

function interpolate(text, vars) {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, name) => (vars[name] !== undefined ? String(vars[name]) : match));
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem("rsu-locale");
    const next = isLocale(saved) ? saved : matchBrowserLocale(navigator.languages ?? [navigator.language]);
    document.documentElement.lang = next;
    document.documentElement.dataset.locale = next;
    setLocaleState(next);
  }, []);

  const setLocale = useCallback((next) => {
    if (!isLocale(next)) return;
    localStorage.setItem("rsu-locale", next);
    document.documentElement.lang = next;
    document.documentElement.dataset.locale = next;
    setLocaleState(next);
  }, []);

  const t = useCallback((key, vars) => {
    let entry = readPath(dictionaries[locale], key);
    if (entry === undefined) entry = readPath(dictionaries[DEFAULT_LOCALE], key);
    if (entry === undefined) return key;
    if (typeof entry === "object" && entry !== null) {
      const variant = vars?.count === 1 ? entry.one : entry.other;
      entry = variant ?? entry.other ?? entry.one ?? key;
    }
    return interpolate(String(entry), vars);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within a LocaleProvider");
  return context;
}
