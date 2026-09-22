"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { publicContainerClassName } from "./layoutStyles";
import { usePathname } from "next/navigation";
import { usePendingViewings } from "../lib/usePendingViewings";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { supabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

const navigation = {
  public: [
    { key: "nav.explore", href: "/" },
    { key: "nav.map", href: "/map" },
    { key: "nav.appointments", href: "/appointments" },
  ],
  student: [
    { key: "nav.explore", href: "/" },
    { key: "nav.map", href: "/map" },
    { key: "nav.appointments", href: "/appointments" },
  ],
  landlord: [
    { key: "nav.explore", href: "/" },
    { key: "nav.dashboard", href: "/landlord" },
    { key: "nav.myListings", href: "/listings" },
    { key: "nav.appointments", href: "/landlord-appointments" },
  ],
  admin: [
    { key: "nav.explore", href: "/" },
    { key: "nav.dashboard", href: "/admin" },
    { key: "nav.verifications", href: "/admin-verifications" },
    { key: "nav.users", href: "/users" },
    { key: "nav.listings", href: "/manage-listings" },
    { key: "nav.reports", href: "/reports" },
  ],
};

const account = {
  student: { href: "/profile" },
  landlord: { href: "/landlord-profile" },
  admin: { href: "/admin" },
};

function initialsFor(name, email, role) {
  const fromName = name?.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return fromName || email?.[0]?.toUpperCase() || role?.slice(0, 2).toUpperCase() || "?";
}

let cachedAccountRole = null;
let cachedAccountInitials = null;

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [userId, setUserId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountRole, setAccountRole] = useState(cachedAccountRole);
  const [accountInitials, setAccountInitials] = useState(cachedAccountInitials);
  const pendingViewings = usePendingViewings(accountRole === "landlord" ? userId : null, pathname);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);
      if (!user) { cachedAccountRole = null; cachedAccountInitials = null; setAccountRole(null); setAccountInitials(null); return; }
      const { data } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).single();
      if (active) {
        cachedAccountRole = data?.role ?? "student";
        cachedAccountInitials = initialsFor(data?.full_name, user.email, cachedAccountRole);
        setAccountRole(cachedAccountRole);
        setAccountInitials(cachedAccountInitials);
      }
    }
    loadAccount();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        cachedAccountRole = null;
        cachedAccountInitials = null;
        if (active) { setUserId(null); setAccountRole(null); setAccountInitials(null); }
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
      <nav aria-label="Primary navigation" className={`${publicContainerClassName} relative flex min-h-18 items-center gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`}>
        <Link href={logoHref} className="shrink-0 text-xl font-extrabold tracking-[-.055em] text-ink" onClick={() => setMenuOpen(false)}>
          {t("nav.brand")}<span className="text-accent">.</span>
        </Link>
        <div id="primary-navigation" className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-line bg-surface p-4 shadow-xl lg:static lg:flex lg:flex-row lg:items-center lg:justify-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
            return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors lg:py-2 ${active ? "bg-surface-muted text-accent" : "text-ink hover:bg-surface-muted hover:text-accent"}`}>
              {t(link.key)}
              {link.href === "/landlord-appointments" && pendingViewings > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white lg:absolute lg:-top-1 lg:-right-1" aria-label={t("nav.pendingViewingRequests", { count: pendingViewings })}>{pendingViewings > 99 ? "99+" : pendingViewings}</span>}
            </Link>;
          })}
          {!accountRole && <><Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-3 text-sm font-semibold text-ink hover:bg-surface-muted lg:hidden">{t("common.signIn")}</Link><Link href="/register" onClick={() => setMenuOpen(false)} className="rounded-full px-4 py-3 text-sm font-semibold text-accent hover:bg-surface-muted lg:hidden">{t("common.createAccount")}</Link></>}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 lg:justify-self-end">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="flex w-11 justify-end sm:w-24">
            {accountRole && account[accountRole] ? <Link href={account[accountRole].href} aria-label={t("common.account")} className="flex size-11 items-center justify-center rounded-full border border-line bg-surface-muted text-xs font-bold text-ink">{accountInitials}</Link> : <Link href="/login" className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-accent sm:inline-flex">{t("common.signIn")}</Link>}
          </div>
          <button type="button" className="relative inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-xl text-ink lg:hidden"
            aria-label={pendingViewings > 0 ? t("nav.toggleNavigationPending", { count: pendingViewings }) : t("nav.toggleNavigation")} aria-expanded={menuOpen} aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}>
            <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
            {pendingViewings > 0 && <span aria-hidden="true" className="absolute -top-1 -right-1 rounded-full bg-accent px-1.5 text-[10px] font-bold leading-5 text-white">{pendingViewings > 99 ? "99+" : pendingViewings}</span>}
          </button>
        </div>
      </nav>
    </header>
  );
}
