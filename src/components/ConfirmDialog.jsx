"use client";

import { useEffect, useId, useRef } from "react";
import { primaryButtonClassName, secondaryButtonClassName } from "./uiStyles";

export default function ConfirmDialog({ title, description, confirmLabel, cancelLabel, busy, error, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  return <dialog ref={dialogRef} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-busy={busy}
    onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}
    onClick={(event) => {
      if (busy || event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onCancel();
    }}
    className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl bg-canvas p-5 text-ink shadow-xl backdrop:bg-black/30 sm:p-7">
    <h2 id={`${id}-title`} className="text-lg font-semibold leading-7">{title}</h2>
    <p id={`${id}-description`} className="mt-2 text-sm leading-6 break-words text-muted">{description}</p>
    {error && <p role="alert" className="mt-4 text-sm leading-6 text-accent">{error}</p>}
    <div className="mt-6 flex flex-wrap justify-end gap-2">
      <button autoFocus type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClassName}>{cancelLabel}</button>
      <button type="button" onClick={onConfirm} disabled={busy} className={primaryButtonClassName}>{confirmLabel}</button>
    </div>
  </dialog>;
}
