"use client";

import Link from "next/link";
import { authHeadingClassName, authInputClassName } from "./authStyles";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requireSupabase } from "../lib/supabase";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function RegisterPage() {
  const { t } = useLocale();
  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) { setError(t("auth.passwordsNoMatch")); return; }
    setBusy(true);
    try {
      const { data, error: authError } = await requireSupabase().auth.signUp({
        email: form.get("email"), password: form.get("password"),
        options: { data: { full_name: form.get("fullName"), role: form.get("role") } },
      });
      if (authError) throw authError;
      if (data.session) router.push(form.get("role") === "landlord" ? "/landlord" : "/");
      else setMessage(t("auth.accountCreatedCheckEmail"));
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  };

  return (
    <main className="grid h-[calc(100dvh/0.9)] grid-cols-1 overflow-y-auto bg-white [zoom:0.9] [--auth-copy-top:clamp(120px,14vh,180px)] min-[1001px]:grid-cols-[minmax(420px,0.92fr)_minmax(550px,1.08fr)] min-[1001px]:grid-rows-[minmax(min-content,1fr)]">
      {/* =========================
          LEFT SIDE
          ========================= */}

      <section className="auth-brand-panel">
        <div className="auth-brand-top">
          <Link
            href="/"
            className="inline-flex items-center text-[clamp(1.9rem,2.2vw,2.4rem)] font-extrabold tracking-[-.07em] text-white"
          >
            HousingFinder<span className="text-accent">.</span>
          </Link>
        </div>

        <div className="auth-brand-content">
          <p className="auth-small-title">
            {t("auth.tagline")}
          </p>

          <h1>
            {t("auth.registerHeadingLine1")}
            <br />
            {t("auth.registerHeadingLine2")}
            <br />

            <span>
              {t("auth.registerHeadingAccent")}
            </span>
          </h1>

          <p className="auth-brand-description">
            {t("auth.registerDescription")}
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <div className="feature-check">
                ✓
              </div>

              <div>
                <strong>
                  {t("auth.feature1Title")}
                </strong>

                <p>
                  {t("auth.feature1Body")}
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-check">
                ✓
              </div>

              <div>
                <strong>
                  {t("auth.feature2Title")}
                </strong>

                <p>
                  {t("auth.feature2Body")}
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-check">
                ✓
              </div>

              <div>
                <strong>
                  {t("auth.feature3Title")}
                </strong>

                <p>
                  {t("auth.feature3Body")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          RIGHT SIDE
          ========================= */}

      <section
        className="register-form-panel flex min-h-0 items-center justify-center px-[8%] py-6 min-[1001px]:items-start min-[1001px]:px-[9%] min-[1001px]:pt-[var(--auth-copy-top)]"
      >
        <div
          className="w-full max-w-[560px]"
        >
          <p className="mb-2 text-xs font-bold tracking-[.12em] text-accent">
            CREATE ACCOUNT
          </p>

          <h2 className={authHeadingClassName}>
            Sign up for HousingFinder
          </h2>

          {/* =========================
              REGISTER FORM
              ========================= */}

          <form onSubmit={handleSubmit}>
            {error && <p role="alert" className="mb-4 text-sm text-accent">{error}</p>}
            {message && <p role="status" className="mb-4 text-sm text-muted">{message}</p>}
            {/* FULL NAME */}

            <div className="mb-3">
              <label className="mb-1.5 block text-[13px] font-bold">
                Full name
              </label>

              <div className={authInputClassName}>
                <UserIcon />

                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}

            <div className="mb-3">
              <label className="mb-1.5 block text-[13px] font-bold">
                Email address
              </label>

              <div className={authInputClassName}>
                <EmailIcon />

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* ACCOUNT TYPE */}

            <fieldset className="mb-3">
              <legend className="mb-2 text-[13px] font-extrabold text-[#171b20]">Account type</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="group cursor-pointer">
                  <input type="radio" name="role" value="student" required className="peer sr-only" />
                  <span className="auth-role-card relative flex min-h-16 flex-col justify-center rounded-xl border border-[#d8dee9] bg-[#fafbfc] px-4 transition-colors group-hover:border-[#8996a3] peer-checked:border-[#1c252e] peer-checked:bg-[#f0f3f5] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1c252e]">
                    <strong className="text-sm text-[#171b20]">Student</strong>
                    <small className="mt-1 text-xs text-[#647078]">Find a home</small>
                  </span>
                </label>
                <label className="group cursor-pointer">
                  <input type="radio" name="role" value="landlord" className="peer sr-only" />
                  <span className="auth-role-card relative flex min-h-16 flex-col justify-center rounded-xl border border-[#d8dee9] bg-[#fafbfc] px-4 transition-colors group-hover:border-[#8996a3] peer-checked:border-[#1c252e] peer-checked:bg-[#f0f3f5] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1c252e]">
                    <strong className="text-sm text-[#171b20]">Landlord</strong>
                    <small className="mt-1 text-xs text-[#647078]">List a property</small>
                  </span>
                </label>
              </div>
            </fieldset>

            {/* PASSWORD */}

            <div className="mb-3">
              <label className="mb-1.5 block text-[13px] font-bold">
                Password
              </label>

              <div className={authInputClassName}>
                <LockIcon />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Create password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="eye-button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
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

            {/* CONFIRM PASSWORD */}

            <div className="mb-3">
              <label className="mb-1.5 block text-[13px] font-bold">
                Confirm password
              </label>

              <div className={authInputClassName}>
                <LockIcon />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="eye-button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOpenIcon />
                  ) : (
                    <EyeClosedIcon />
                  )}
                </button>
              </div>
            </div>

            {/* TERMS */}

            <label className="terms-row terms-row-refined">
              <input
                type="checkbox"
                className="auth-checkbox"
                required
              />
              <span className="auth-checkmark" aria-hidden="true">✓</span>

              <span>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>

            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              disabled={busy}
              className="flex min-h-[58px] w-full items-center justify-center rounded-xl bg-accent text-[15px] font-black text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
            >
              Create Account
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-[#647078] [&>a]:font-bold [&>a]:text-accent [&>a]:underline [&>a]:underline-offset-4">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}


/* =========================================================
   USER ICON
   ========================================================= */

function UserIcon() {
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
        <circle
          cx="12"
          cy="8"
          r="4"
        />

        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </span>
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
   OPEN EYE
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
