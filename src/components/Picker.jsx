"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

function Chevron({ className = "" }) {
  return <svg aria-hidden="true" viewBox="0 0 10 6" className={`h-1.5 w-2.5 shrink-0 fill-none stroke-current ${className}`}><path d="M1 1L5 5L9 1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function Picker({ heading, value, onChange, items, placeholder, variant, panelWidth = "16rem", mutedPlaceholder = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [alignRight, setAlignRight] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const optionsRef = useRef([]);
  const panelId = useId();
  const selected = items.find((item) => item.value === value);
  const plain = variant === "plain";
  const block = variant === "block" || plain;

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;
    const trigger = rootRef.current.getBoundingClientRect();
    const menuHeight = panelRef.current.offsetHeight;
    const navigation = document.querySelector("[data-mobile-navigation]")?.getBoundingClientRect();
    const bottom = navigation?.height ? Math.min(window.innerHeight, navigation.top) : window.innerHeight;
    setOpenAbove(trigger.bottom + menuHeight + 16 > bottom && trigger.top > menuHeight + 16);
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const index = Math.max(0, items.findIndex((item) => item.value === value));
    optionsRef.current[index]?.focus({ preventScroll: plain });
    if (panelRef.current && !alignRight && panelRef.current.getBoundingClientRect().right > window.innerWidth - 20) setAlignRight(true);
    function onPointerDown(event) { if (!rootRef.current?.contains(event.target)) setOpen(false); }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, value, items, plain]);

  function close() { setOpen(false); triggerRef.current?.focus(); }
  function handleKeyDown(event) {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (!open) { setOpen(true); return; }
    const current = optionsRef.current.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    optionsRef.current[next]?.focus();
  }

  return <div ref={rootRef} onKeyDown={handleKeyDown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} className={`relative min-w-0 ${block ? "" : "flex-1"}`}>
    <button ref={triggerRef} type="button" aria-label={heading} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => setOpen((current) => !current)}
      className={plain
        ? "flex min-h-11 w-full items-center justify-between gap-2 rounded-md bg-transparent text-left text-sm text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        : block
        ? `flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm text-ink transition-colors hover:bg-surface-muted ${open ? "border-ink" : "border-line"}`
        : `flex min-h-16 w-full min-w-0 items-center justify-between gap-3 rounded-md px-5 py-2.5 text-left transition-colors hover:bg-surface-muted ${open ? "bg-surface-muted" : ""}`}>
      {block ? <span className="truncate">{selected?.label || placeholder}</span> : <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-muted">{heading}</span><span className={`mt-0.5 block truncate text-sm ${!selected?.value && mutedPlaceholder ? "text-muted" : "text-ink"}`}>{selected?.value ? selected.label : placeholder}</span></span>}
      <Chevron className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div ref={panelRef} id={panelId} role="listbox" aria-label={heading} className={`absolute ${openAbove ? "bottom-[calc(100%+.5rem)]" : "top-[calc(100%+.5rem)]"} z-30 max-h-80 max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-lg border border-line bg-surface p-1.5 shadow-[var(--shadow)] ${alignRight ? "right-0" : "left-0"}`} style={{ width: panelWidth }}>
      {items.map((item, index) => <button ref={(node) => { optionsRef.current[index] = node; }} key={item.value} type="button" role="option" tabIndex={-1} aria-selected={value === item.value} onClick={() => { onChange(item.value); close(); }} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${value === item.value ? "bg-surface-muted" : ""}`}>
        <span className="min-w-0"><span className={`block text-sm ${value === item.value ? "font-semibold" : ""}`}>{item.label}</span>{item.sub && <span className="mt-0.5 block text-xs text-muted">{item.sub}</span>}</span>
        {value === item.value && <svg aria-hidden="true" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-4 shrink-0"><path d="m1.5 6 4 4 9-9" /></svg>}
      </button>)}
    </div>}
  </div>;
}
