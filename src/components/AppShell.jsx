"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { LocaleProvider } from "../lib/i18n/LocaleContext";

const standalonePages = new Set(["/login", "/register", "/forgot-password", "/update-password"]);

export default function AppShell({ children }) {
  const pathname = usePathname();

  return <LocaleProvider>
    {!standalonePages.has(pathname) && <Navbar />}
    {children}
  </LocaleProvider>;
}
