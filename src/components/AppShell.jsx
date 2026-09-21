"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

const standalonePages = new Set(["/login", "/register", "/forgot-password", "/update-password"]);

export default function AppShell({ children }) {
  const pathname = usePathname();

  return <>
    {!standalonePages.has(pathname) && <Navbar />}
    {children}
  </>;
}
