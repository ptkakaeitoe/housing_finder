"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrandLogo from "./BrandLogo";
import Avatar from "./Avatar";
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

let cachedAccountRole = null;

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [userId, setUserId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountRole, setAccountRole] = useState(cachedAccountRole);
  const headerRef = useRef(null);
  const mobileNavRef = useRef(null);
  const menuButtonRef = useRef(null);
  const pendingViewings = usePendingViewings(accountRole === "landlord" ? userId : null, pathname);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);
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
        if (active) { setUserId(null); setAccountRole(null); }
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event) {
      if (!headerRef.current?.contains(event.target) && !mobileNavRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);
  const navigationRole = accountRole ?? "public";
  const links = navigation[navigationRole] ?? navigation.public;
  const mobileLinks = navigationRole === "admin" ? links.slice(0, 3) : links;
  const overflowLinks = navigationRole === "admin" ? links.slice(3) : [];
  const moreActive = overflowLinks.some((link) => isActiveLink(pathname, link.href));
  const closeMenu = () => setMenuOpen(false);
  function toggleMenu(event) {
    menuButtonRef.current = event.currentTarget;
    setMenuOpen((open) => !open);
  }
  function dismissMenu() {
    closeMenu();
    menuButtonRef.current?.focus();
  }

  return <>
    <header ref={headerRef} className="sticky top-0 z-50 bg-canvas text-ink [--pink:var(--ink)] [--pink-hover:var(--text-gray)]">
      <nav aria-label="Primary navigation" className={`${publicContainerClassName} py-3 md:py-4`}>
        <div className="flex min-h-11 items-center gap-4 xl:gap-10">
          <Link href="/" className="inline-flex size-11 shrink-0 items-center justify-start" onClick={closeMenu}>
            <BrandLogo name={t("nav.brand")} compact />
          </Link>
          <div className="hidden min-w-0 flex-1 xl:block">
            <NavigationLinks links={links} pathname={pathname} pendingViewings={pendingViewings} onNavigate={closeMenu} t={t} />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            {accountRole && account[accountRole] ? (
              <Link href={account[accountRole].href} aria-label={t("common.account")} onClick={closeMenu}
                className={`ml-2 ${accountRole === "admin" ? "inline-flex" : "hidden md:inline-flex"} size-11 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}>
                <Avatar className="size-10" />
              </Link>
            ) : (
              <Link href="/login" onClick={closeMenu} className="ml-3 hidden min-h-11 items-center gap-3 rounded-md bg-ink px-4 text-sm font-medium text-canvas transition-opacity hover:opacity-85 md:inline-flex">
                {t("common.signIn")}<span aria-hidden="true">→</span>
              </Link>
            )}
            <button type="button" className="relative ml-1 hidden size-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface-muted md:inline-flex xl:hidden"
              aria-label={pendingViewings > 0 ? t("nav.toggleNavigationPending", { count: pendingViewings }) : t("nav.toggleNavigation")}
              aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={toggleMenu}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-5">
                {menuOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 8h16M4 16h16" />}
              </svg>
              {pendingViewings > 0 && <span aria-hidden="true" className="absolute top-0 right-0 size-1.5 rounded-full bg-ink" />}
            </button>
          </div>
        </div>
        <div id="primary-navigation" className={`${menuOpen ? "hidden md:block" : "hidden"} pt-5 pb-2 xl:hidden`}>
          <NavigationLinks links={links} pathname={pathname} pendingViewings={pendingViewings} onNavigate={closeMenu} t={t} mobile />
          {!accountRole && <div className="mt-4 flex flex-wrap items-center gap-6">
            <Link href="/login" onClick={closeMenu} className="inline-flex min-h-11 items-center gap-3 rounded-md bg-ink px-4 text-sm font-medium text-canvas transition-opacity hover:opacity-85 sm:hidden">
              {t("common.signIn")}<span aria-hidden="true">→</span>
            </Link>
            <Link href="/register" onClick={closeMenu} className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-ink">{t("common.createAccount")}</Link>
          </div>}
        </div>
      </nav>
    </header>

    <div ref={mobileNavRef} data-mobile-navigation className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/95 text-ink backdrop-blur-lg [--pink:var(--ink)] md:hidden">
      <nav aria-label={t("nav.mobileNavigation")} className="mx-auto w-full max-w-lg px-3 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom))]">
        <ul className="grid auto-cols-fr grid-flow-col items-stretch gap-1">
          {mobileLinks.map((link) => {
            const active = isActiveLink(pathname, link.href);
            const pending = link.href === "/landlord-appointments" ? pendingViewings : 0;
            return <li key={link.href} className="min-w-0">
              <Link href={link.href} aria-current={active ? "page" : undefined} onClick={closeMenu} className={mobileItemClassName}>
                <MobileNavContent icon={link.key} active={active} label={t(link.key === "nav.appointments" ? "appointments.heading" : link.key)} pending={pending} t={t} />
              </Link>
            </li>;
          })}
          {overflowLinks.length > 0 ? <li className="min-w-0">
            <button type="button" aria-expanded={menuOpen} aria-controls="mobile-more-navigation" onClick={toggleMenu} className={mobileItemClassName}>
              <MobileNavContent icon="nav.more" active={menuOpen || moreActive} label={t("nav.more")} t={t} />
            </button>
          </li> : <li className="min-w-0">
            <Link href={account[accountRole]?.href ?? "/login"} aria-current={accountRole && isActiveLink(pathname, account[accountRole]?.href) ? "page" : undefined} onClick={closeMenu} className={mobileItemClassName}>
              <MobileNavContent icon="nav.account" active={Boolean(accountRole && isActiveLink(pathname, account[accountRole]?.href))} label={t(accountRole ? "common.account" : "common.signIn")} t={t} />
            </Link>
          </li>}
        </ul>
      </nav>
      {menuOpen && overflowLinks.length > 0 && <section id="mobile-more-navigation" aria-label={t("nav.more")} className="absolute inset-x-0 bottom-full max-h-[calc(100dvh-6rem-env(safe-area-inset-bottom))] overflow-y-auto border-b border-line bg-canvas px-5 pt-3 pb-5 shadow-[0_-12px_32px_rgba(0,0,0,.08)]">
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-sm font-semibold">{t("nav.more")}</h2>
            <button type="button" aria-label={t("nav.closeNavigation")} onClick={dismissMenu} className="ml-auto inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-ink">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-5"><path d="m6 6 12 12M6 18 18 6" /></svg>
            </button>
          </div>
          <NavigationLinks links={overflowLinks} pathname={pathname} pendingViewings={pendingViewings} onNavigate={closeMenu} t={t} mobile />
        </div>
      </section>}
    </div>
  </>;
}

function isActiveLink(pathname, href) {
  return Boolean(href && (pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))));
}

const mobileItemClassName = "group flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function MobileNavContent({ icon, label, active, pending = 0, t }) {
  return <>
    <span className={`relative inline-flex h-7 w-10 items-center justify-center rounded-full transition-colors ${active ? "bg-ink text-canvas" : "text-muted group-hover:bg-surface-muted group-hover:text-ink"}`}>
      <NavigationIcon name={icon} className="size-5 shrink-0" />
      {pending > 0 && <span className={`absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-4 ${active ? "bg-canvas text-ink" : "bg-ink text-canvas"}`} aria-label={t("nav.pendingViewingRequests", { count: pending })}>{pending > 99 ? "99+" : pending}</span>}
    </span>
    <span className={`line-clamp-2 max-w-full text-center text-[11px] leading-4 [overflow-wrap:anywhere] ${active ? "font-semibold text-ink" : "font-medium text-muted"}`}>{label}</span>
  </>;
}

function NavigationLinks({ links, pathname, pendingViewings, onNavigate, t, mobile = false }) {
  return <ul className={mobile ? "grid gap-1" : "flex flex-wrap items-center gap-x-7 gap-y-1"}>
    {links.map((link) => {
      const active = isActiveLink(pathname, link.href);
      return <li key={link.href}>
        <Link href={link.href} aria-current={active ? "page" : undefined} onClick={onNavigate}
          className={`inline-flex min-h-11 items-center gap-2.5 rounded-md text-sm transition-colors ${mobile ? "w-full py-2" : "py-1"} ${active ? "font-semibold text-ink" : "font-normal text-muted hover:text-ink"}`}>
          <NavigationIcon name={link.key} />
          <span>{t(link.key)}</span>
          {link.href === "/landlord-appointments" && pendingViewings > 0 && <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[11px] font-semibold leading-5 text-canvas"
            aria-label={t("nav.pendingViewingRequests", { count: pendingViewings })}>{pendingViewings > 99 ? "99+" : pendingViewings}</span>}
        </Link>
      </li>;
    })}
  </ul>;
}

function NavigationIcon({ name, className = "size-[18px] shrink-0" }) {
  const paths = {
    "nav.explore": <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" /></>,
    "nav.map": <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
    "nav.appointments": <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-13 5 3 3 5-5" /></>,
    "nav.dashboard": <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    "nav.myListings": <><path d="m3 10 9-7 9 7M5 9v11h14V9m-9 11v-7h4v7" /></>,
    "nav.verifications": <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    "nav.users": <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2" /></>,
    "nav.listings": <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8m-8 4h8m-8 4h5" /></>,
    "nav.reports": <><path d="M4 3v18h17M8 16v-4m5 4V8m5 8V5" /></>,
    "nav.account": <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    "nav.more": <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}
