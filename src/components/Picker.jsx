"use client";

import { useEffect, useRef, useState } from "react";

function Chevron({ className = "" }) {
  return (
    <svg aria-hidden viewBox="0 0 10 6" className={`h-1.5 w-2.5 fill-none stroke-current ${className}`}>
      <path d="M1 1L5 5L9 1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 12" className="h-3 w-3.5 shrink-0 fill-none stroke-current text-accent">
      <path d="M1.5 6L5.5 10L14.5 1.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A custom-styled combobox replacing the native <select> — the browser's
// own dropdown can't be restyled, and this keeps the same rounded-card
// look (with an optional secondary line per option) as the rest of the app.
export function Picker({ heading, value, onChange, items, placeholder, variant, panelWidth = "16rem", mutedPlaceholder = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = items.find((i) => i.value === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event) { if (!rootRef.current?.contains(event.target)) setOpen(false); }
    function onKeyDown(event) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("mousedown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  function choose(val) { onChange(val); setOpen(false); }

  const panel = open && (
    <div role="listbox" aria-label={heading} className="absolute left-0 top-[calc(100%+.5rem)] z-20 max-h-80 overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow)]" style={{ width: panelWidth }}>
      {items.map((item) => (
        <button key={item.value} type="button" role="option" aria-selected={value === item.value} onClick={() => choose(item.value)} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-muted ${value === item.value ? "bg-surface-muted" : ""}`}>
          <span className="min-w-0">
            <span className={`block truncate text-sm ${value === item.value ? "font-semibold text-ink" : "text-ink"}`}>{item.label}</span>
            {item.sub && <span className="block truncate text-xs text-muted">{item.sub}</span>}
          </span>
          {value === item.value && <CheckIcon />}
        </button>
      ))}
    </div>
  );

  if (variant === "block") {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ outline: "none" }}
          className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-4 text-left text-sm font-semibold text-ink transition-colors ${open ? "border-accent bg-surface-muted" : "border-line bg-surface"}`}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <Chevron className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {panel}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ outline: "none" }}
        className={`flex w-full min-w-0 flex-col items-start px-7 py-3.5 text-left transition-colors hover:bg-surface-muted ${open ? "bg-surface-muted" : ""}`}
      >
        <span className="text-[11px] font-semibold text-ink">{heading}</span>
        <span className="w-full truncate text-sm text-ink">{selected && selected.value ? selected.label : mutedPlaceholder ? <span className="text-muted">{placeholder}</span> : placeholder}</span>
      </button>
      <Chevron className={`pointer-events-none absolute bottom-4 right-7 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      {panel}
    </div>
  );
}
