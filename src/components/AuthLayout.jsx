"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import BrandLogo from "./BrandLogo";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLocale } from "../lib/i18n/LocaleContext";

const pageWidth = "mx-auto w-full max-w-[448px] px-5 sm:px-6 lg:max-w-[1040px] lg:px-8";

export default function AuthLayout({ mode, title, description, landlord = false, showAccountSwitch = true, children }) {
  const { t } = useLocale();
  const steps = landlord
    ? ["auth.guideList", "auth.guideDetails", "auth.guideManage"]
    : ["auth.guideExplore", "auth.guideCompare", "auth.guideVisit"];
  const subtitle = description || (mode === "login" ? t("auth.loginFormDescription") : mode === "register" ? t("auth.registerFormDescription") : null);

  return (
    <div data-auth-layout className="flex flex-col bg-canvas text-ink [--trail-step:20px] [--pink:var(--ink)] [--pink-hover:var(--text-gray)] sm:[--trail-step:24px] lg:min-h-dvh">
      <ViewTransition name="auth-header" share="auth-header" default="none">
        <header className={`${pageWidth} flex items-center gap-4 py-3 lg:py-4`}>
          <Link href="/" className="inline-flex size-11 shrink-0 items-center justify-start">
            <BrandLogo name={t("nav.brand")} compact />
          </Link>
          <div className="ml-auto flex items-center gap-0.5 lg:gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
      </ViewTransition>

      <main className={`${pageWidth} grid min-w-0 content-start pt-10 pb-[max(1rem,env(safe-area-inset-bottom))] lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px] lg:content-center lg:items-start lg:gap-x-[72px] lg:pt-8 lg:pb-16`}>
        <ViewTransition key={mode} name="auth-form" share="auth-form" default="none">
          <section aria-labelledby="auth-title" className="min-w-0 text-center sm:text-left lg:col-start-2 lg:row-start-1">
            <div className="pb-7">
              <h1 id="auth-title" className="text-[28px] font-semibold leading-9 tracking-[-.035em] sm:text-[32px] sm:leading-10">{title}</h1>
              {subtitle && <p className="mt-3 text-sm leading-6 text-muted sm:mt-2">{subtitle}</p>}
            </div>
            {children}
            {showAccountSwitch && <div className="mt-3 flex min-h-9 flex-wrap items-center justify-center gap-x-1.5 text-xs sm:gap-x-2 sm:text-[13px] lg:mt-5 lg:min-h-11">
              {(mode === "register" || mode === "login") && <span className="text-muted">{t(mode === "register" ? "auth.alreadyHaveAccount" : "auth.newToHousingFinder")}</span>}
              <Link href={mode === "login" ? "/register" : "/login"} prefetch
                className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-ink underline-offset-4 hover:underline lg:min-h-11">
                {t(mode === "login" ? "common.createAccount" : "common.signIn")}<span aria-hidden="true">→</span>
              </Link>
            </div>}
            <Link href="/" className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-md bg-transparent px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0"><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" /></svg>
              {t("auth.exploreAsGuest")}<span aria-hidden="true">↗</span>
            </Link>
          </section>
        </ViewTransition>

        <ViewTransition name="auth-guide" share="auth-guide" default="none">
          <section aria-labelledby="auth-guide-title" className="hidden min-w-0 lg:col-start-1 lg:row-start-1 lg:block">
            <h2 id="auth-guide-title" className="max-w-[480px] text-4xl font-semibold leading-[1.08] tracking-[-.045em] [text-wrap:balance] sm:text-[44px] lg:text-[52px]">
              {t(landlord ? "auth.guideLandlordHeading" : "auth.guideHeading")}
            </h2>
            <p className="mt-4 max-w-[420px] text-sm leading-6 text-muted lg:text-base lg:leading-7">
              {t(landlord ? "auth.guideLandlordDescription" : "auth.guideDescription")}
            </p>
            <ol className="mt-7 max-w-[480px]">
              {steps.map((key, index) => (
                <li key={key} className={`relative grid min-h-[88px] min-w-0 grid-cols-[32px_minmax(0,1fr)] gap-x-4 pb-6 last:min-h-0 last:pb-0 ${index === 1 ? "ml-[var(--trail-step)]" : index === 2 ? "ml-[calc(var(--trail-step)*2)]" : ""}`}>
                  {index < steps.length - 1 && <span aria-hidden="true" className="absolute top-9 left-[15px] h-[calc(100%-20px)] w-[var(--trail-step)] rounded-bl-xl border-b border-l border-line" />}
                  <span className="relative flex size-8 items-center justify-center rounded-full border border-line bg-canvas text-ink">
                    <GuideIcon step={index} landlord={landlord} />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="flex items-baseline gap-2 text-[13px] font-semibold leading-5 text-ink lg:text-sm">
                      <span className="text-[10px] font-normal tabular-nums text-muted">{String(index + 1).padStart(2, "0")}</span>
                      {t(key)}
                    </h3>
                    <p className="mt-1 text-sm leading-[22px] text-muted">{t(`${key}Description`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </ViewTransition>
      </main>
    </div>
  );
}

function GuideIcon({ step, landlord }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
      {step === 0 && (landlord
        ? <path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7" />
        : <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" /></>)}
      {step === 1 && <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="var(--navy)" /><circle cx="16" cy="12" r="2" fill="var(--navy)" /><circle cx="10" cy="18" r="2" fill="var(--navy)" /></>}
      {step === 2 && <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-13 5 3 3 5-5" /></>}
    </svg>
  );
}
