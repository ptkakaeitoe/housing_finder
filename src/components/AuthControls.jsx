"use client";

import { useState } from "react";
import { useLocale } from "../lib/i18n/LocaleContext";
import { authInputClassName, authLabelClassName, authSubmitClassName } from "../views/authStyles";

export function AuthField({ id, label, ...props }) {
  return <div className="min-w-0">
    <label htmlFor={id} className={authLabelClassName}>{label}</label>
    <input id={id} className={`${authInputClassName} px-3`} {...props} />
  </div>;
}

export function AuthPasswordField({ id, label, ...props }) {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);
  return <div className="min-w-0">
    <label htmlFor={id} className={authLabelClassName}>{label}</label>
    <div className="relative">
      <input id={id} type={visible ? "text" : "password"} className={`${authInputClassName} pl-3 pr-12`} {...props} />
      <button type="button" onClick={() => setVisible((value) => !value)} aria-controls={id} aria-pressed={visible}
        aria-label={t(visible ? "auth.hidePassword" : "auth.showPassword")}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-md text-muted transition-colors hover:text-ink disabled:opacity-50 sm:w-11" disabled={props.disabled}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
          {!visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  </div>;
}

export function AuthSubmit({ busy, children }) {
  return <button type="submit" disabled={busy} className={authSubmitClassName}>
    {busy && <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4 animate-spin motion-reduce:animate-none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity=".3" /><path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
    <span>{children}</span>
    {!busy && <span aria-hidden="true">→</span>}
  </button>;
}

export function AuthNotice({ children, success = false, id }) {
  if (!children) return null;
  return <p id={id} role={success ? "status" : "alert"} className={`flex items-start gap-2 text-sm leading-relaxed ${success ? "text-ink" : "text-accent"}`}>
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-[18px] shrink-0">
      <circle cx="12" cy="12" r="9" />{success ? <path d="m8 12 3 3 5-6" /> : <path d="M12 7v6m0 4h.01" />}
    </svg>
    {children}
  </p>;
}
