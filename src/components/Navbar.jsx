"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { supabase } from "../lib/supabase";

const navigation = {
  public: [
    { label: "Explore", href: "/" },
    { label: "Map", href: "/map" },
    { label: "Appointments", href: "/appointments" },
  ],
  student: [
    { label: "Explore", href: "/" },
    { label: "Map", href: "/map" },
    { label: "Appointments", href: "/appointments" },
  ],
  landlord: [
    { label: "Explore", href: "/" },
    { label: "Dashboard", href: "/landlord" },
    { label: "My Listings", href: "/listings" },
    { label: "Appointments", href: "/landlord-appointments" },
    { label: "Verification", href: "/landlord-verification" },
  ],
  admin: [
    { label: "Explore", href: "/" },
    { label: "Dashboard", href: "/admin" },
    { label: "Verifications", href: "/admin-verifications" },
    { label: "Users", href: "/users" },
    { label: "Listings", href: "/manage-listings" },
    { label: "Reports", href: "/reports" },
  ],
};

const account = {
  student: { href: "/profile", initials: "ST" },
  landlord: { href: "/landlord-profile", initials: "LD" },
  admin: { href: "/admin", initials: "AD" },
};

let cachedAccountRole = null;

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountRole, setAccountRole] = useState(cachedAccountRole);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) { cachedAccountRole = null; setAccountRole(null); return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (active) {
        cachedAccountRole = data?.role ?? "student";
        setAccountRole(cachedAccountRole);
      }
    }
    loadAccount();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        cachedAccountRole = null;
        if (active) setAccountRole(null);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  const navigationRole = accountRole ?? "public";
  const links = navigation[navigationRole] ?? navigation.public;
  const logoHref = "/";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-xl">
      <nav aria-label="Primary navigation" className="relative mx-auto flex min-h-18 w-full max-w-7xl items-center gap-4 px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-12">
        <Link href={logoHref} className="shrink-0 text-xl font-extrabold tracking-[-.055em] text-ink" onClick={() => setMenuOpen(false)}>
          HousingFinder<span className="text-accent">.</span>
        </Link>
        <div id="primary-navigation" className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-line bg-surface p-4 shadow-xl lg:static lg:flex lg:flex-row lg:items-center lg:justify-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
            return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              className={`rounded-full px-4 py-3 text-sm font-semibold transition-colors lg:py-2 ${active ? "bg-surface-muted text-accent" : "text-ink hover:bg-surface-muted hover:text-accent"}`}>
              {link.label}
            </Link>;
          })}
          {!accountRole && <><Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-3 text-sm font-semibold text-ink hover:bg-surface-muted lg:hidden">Sign in</Link><Link href="/register" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-3 text-sm font-semibold text-accent hover:bg-surface-muted lg:hidden">Create account</Link></>}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 lg:justify-self-end">
          <ThemeToggle />
          <div className="flex w-11 justify-end sm:w-24">
            {accountRole && account[accountRole] ? <Link href={account[accountRole].href} aria-label="Account" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface-muted text-xs font-bold text-ink">{account[accountRole].initials}</Link> : <Link href="/login" className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-accent sm:inline-flex">Sign in</Link>}
          </div>
          <button type="button" className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-xl text-ink lg:hidden"
            aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}>
            <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
