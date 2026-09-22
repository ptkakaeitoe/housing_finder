"use client";

import Link from "next/link";
import { authGuestLinkClassName, authGuestRowClassName, authHeadingClassName, authInputClassName } from "./authStyles";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requireSupabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function LoginPage() {
  const { t } = useLocale();
  const [showPassword, setShowPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const client = requireSupabase();
      const form = new FormData(event.currentTarget);
      const { data, error: authError } = await client.auth.signInWithPassword({ email: form.get("email"), password: form.get("password") });
      if (authError) throw authError;
      const { data: profile } = await client.from("profiles").select("role").eq("id", data.user.id).single();
      router.push(profile?.role === "landlord" ? "/landlord" : profile?.role === "admin" ? "/admin" : "/");
      router.refresh();
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  };

  return (
    <main className="auth-layout [--auth-copy-top:clamp(146px,calc(24vh-24px),286px)]">
      {/* =========================
          LEFT SIDE
          ========================= */}

      <section className="auth-brand-panel">
        <div className="auth-brand-top">
          <Link
            href="/"
            className="inline-flex items-center text-[clamp(1.9rem,2.2vw,2.4rem)] font-extrabold tracking-[-.07em] text-white"
          >
            {t("nav.brand")}<span className="text-accent">.</span>
          </Link>
        </div>

        <div className="auth-brand-content">
          <p className="auth-small-title">
            {t("auth.loginTagline")}
          </p>

          <h1>
            {t("auth.loginHeadingLine1")}
            <br />
            {t("auth.loginHeadingLine2")}
            <br />

            <span>
              {t("auth.loginHeadingAccent")}
            </span>
          </h1>

          <p className="auth-brand-description">
            {t("auth.loginDescription")}
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <div className="feature-check">
                ✓
              </div>

              <div>
                <strong>
                  {t("auth.loginFeature1Title")}
                </strong>

                <p>
                  {t("auth.loginFeature1Body")}
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-check">
                ✓
              </div>

              <div>
                <strong>
                  {t("auth.loginFeature2Title")}
                </strong>

                <p>
                  {t("auth.loginFeature2Body")}
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-check">
                ✓
              </div>

              <div>
                <strong>
                  {t("auth.loginFeature3Title")}
                </strong>

                <p>
                  {t("auth.loginFeature3Body")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          RIGHT SIDE
          ========================= */}

      <section className="auth-form-panel">
        <div className="auth-form-container">
          <p className="form-eyebrow">
            {t("auth.welcomeBack")}
          </p>

          <h2 className={authHeadingClassName}>
            {t("auth.signInHeading")}
          </h2>


          {/* GOOGLE */}

          <button
            type="button"
            className="google-button"
            disabled
            aria-disabled="true"
            style={{ opacity: 0.5, cursor: "not-allowed" }}
          >
            <GoogleIcon />

            <span>
              {t("auth.continueWithGoogle")}
            </span>
          </button>

          {/* DIVIDER */}

          <div className="auth-divider">
            <span />

            <p>
              {t("auth.orContinueWithEmail")}
            </p>

            <span />
          </div>

          {/* =========================
              LOGIN FORM
              ========================= */}

          <form onSubmit={handleSubmit}>
            {error && <p role="alert" className="mb-4 text-sm text-accent">{error}</p>}
            {/* EMAIL */}

            <div className="auth-input-group">
              <label>
                {t("auth.emailAddress")}
              </label>

              <div className={authInputClassName}>
                <EmailIcon />

                <input
                  type="email"
                  name="email"
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="auth-input-group">
              <div className="password-label">
                <label>
                  {t("auth.password")}
                </label>

                <Link href="/forgot-password">
                  {t("auth.forgotPassword")}
                </Link>
              </div>

              <div className={authInputClassName}>
                <LockIcon />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder={t("auth.passwordPlaceholder")}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="eye-button"
                  aria-label={
                    showPassword
                      ? t("auth.hidePassword")
                      : t("auth.showPassword")
                  }
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOpenIcon />
                  ) : (
                    <EyeClosedIcon />
                  )}
                </button>
              </div>
            </div>

            {/* REMEMBER ME */}

            <label className="remember-row">
              <input
                type="checkbox"
                name="remember"
              />

              <span>
                {t("auth.rememberMe")}
              </span>
            </label>

            {/* SIGN IN BUTTON */}

            <button
              type="submit"
              disabled={busy}
              className="auth-submit"
            >
              {t("auth.signInButton")}
            </button>
          </form>

          <p className="auth-switch-plain">
            {t("auth.newToHousingFinder")} <Link href="/register">{t("auth.createAccount")}</Link>
          </p>

          <p className={authGuestRowClassName}>
            <Link href="/" className={authGuestLinkClassName}>
              {t("auth.exploreAsGuest")}
              <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}


/* =========================================================
   EMAIL ICON
   ========================================================= */

function EmailIcon() {
  return (
    <span className="input-icon">
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <path d="m3 7 9 6 9-6" />
      </svg>
    </span>
  );
}


/* =========================================================
   LOCK ICON
   ========================================================= */

function LockIcon() {
  return (
    <span className="input-icon">
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="10"
          width="16"
          height="11"
          rx="2"
        />

        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  );
}


/* =========================================================
   GOOGLE ICON
   ========================================================= */

function GoogleIcon() {
  return (
    <svg
      className="google-svg"
      width="21"
      height="21"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.5L15.4 17c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.5l3.3-2.6Z"
      />

      <path
        fill="#EA4335"
        d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z"
      />
    </svg>
  );
}


/* =========================================================
   OPEN EYE
   Password is visible
   ========================================================= */

function EyeOpenIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />

      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}


/* =========================================================
   CLOSED EYE
   Password is hidden
   ========================================================= */

function EyeClosedIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />

      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />

      <path d="M9.9 5.2A9 9 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-2.2 3.1" />

      <path d="M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a9 9 0 0 0 3.4-.6" />
    </svg>
  );
}
