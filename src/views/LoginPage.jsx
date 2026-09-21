"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requireSupabase } from "../lib/supabase";

export default function LoginPage() {
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
    <main className="auth-layout">
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
            YOUR HOUSING COMMUNITY
          </p>

          <h1>
            Find your
            <br />
            student home,
            <br />

            <span>
              all in one place.
            </span>
          </h1>

          <p className="auth-brand-description">
            Search around campus, compare rent, and arrange a visit.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <div className="feature-check">
                ✓
              </div>

              <div>
                <strong>
                  Homes near campus
                </strong>

                <p>
                  Rooms, apartments and condos.
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-check">
                ✓
              </div>

              <div>
                <strong>
                  Compare rent
                </strong>

                <p>
                  See monthly prices before you visit.
                </p>
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-check">
                ✓
              </div>

              <div>
                <strong>
                  Request a viewing
                </strong>

                <p>
                  Ask to see a home in person.
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
            WELCOME BACK
          </p>

          <h2>
            Sign in to HousingFinder
          </h2>


          {/* GOOGLE */}

          <button
            type="button"
            className="google-button"
            onClick={async () => { try { const { error: authError } = await requireSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/profile` } }); if (authError) throw authError; } catch (cause) { setError(cause.message); } }}
          >
            <GoogleIcon />

            <span>
              Continue with Google
            </span>
          </button>

          {/* DIVIDER */}

          <div className="auth-divider">
            <span />

            <p>
              or continue with email
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
                Email address
              </label>

              <div className="auth-input-wrapper">
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

            {/* PASSWORD */}

            <div className="auth-input-group">
              <div className="password-label">
                <label>
                  Password
                </label>

                <Link href="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <div className="auth-input-wrapper">
                <LockIcon />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

            {/* REMEMBER ME */}

            <label className="remember-row">
              <input
                type="checkbox"
                name="remember"
              />

              <span>
                Remember me
              </span>
            </label>

            {/* SIGN IN BUTTON */}

            <button
              type="submit"
              disabled={busy}
              className="auth-submit"
            >
              Sign In
            </button>
          </form>

          <p className="auth-switch-plain">
            New to HousingFinder? <Link href="/register">Create account</Link>
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
