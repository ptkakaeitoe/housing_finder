"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { LocaleProvider } from "../lib/i18n/LocaleContext";

const standalonePages = new Set(["/login", "/register", "/forgot-password", "/update-password"]);

export default function AppShell({ children }) {
  const pathname = usePathname();
  const standalone = standalonePages.has(pathname);

  return <LocaleProvider>
    {!standalone && <Navbar />}
    {standalone ? children : <div className="pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>}
  </LocaleProvider>;
}
