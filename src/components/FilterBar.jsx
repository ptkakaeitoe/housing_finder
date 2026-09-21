"use client";

import { useEffect, useRef, useState } from "react";

const TYPES = [
  { value: "", label: "All homes" },
  { value: "room", label: "Rooms" },
  { value: "apartment", label: "Apartments" },
  { value: "condo", label: "Condos" },
];

function Chevron({ className = "" }) {
  return (
    <svg aria-hidden viewBox="0 0 10 6" className={`h-1.5 w-2.5 fill-none stroke-current ${className}`}>
      <path d="M1 1L5 5L9 1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <circle cx="11" cy="11" r="7" strokeWidth="2.2" />
      <path d="M21 21l-4.3-4.3" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current">
      <path d="M4 6h10M18 6h2M4 18h2M8 18h12M4 12h6M14 12h6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="6" r="2.2" strokeWidth="2" />
      <circle cx="6" cy="12" r="2.2" strokeWidth="2" />
      <circle cx="10" cy="18" r="2.2" strokeWidth="2" />
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

// Note: button/input/select/textarea text sizing can't rely on a Tailwind
// text-* class placed directly on the element — globals.css has an
// unlayered `button, input, select, textarea { font: inherit }` reset that
// (per CSS cascade-layer rules) always wins over layered Tailwind utilities,
// so the element inherits the page's 16px instead. Wrapping the label in a
// <span> (not targeted by that reset) sidesteps it reliably.
function Chip({ selected, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`min-h-10 shrink-0 whitespace-nowrap rounded-full border px-4 transition-colors ${selected ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink hover:border-ink"}`}
      {...props}
    >
      <span className="text-sm font-semibold">{children}</span>
    </button>
  );
}

// Small option pill used inside the Filters panel (lease length, distance).
function MiniChip({ selected, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      style={{ outline: "none" }}
      className={`min-h-7 shrink-0 whitespace-nowrap rounded-full border px-2.5 transition-colors ${selected ? "border-ink bg-ink text-canvas" : "border-line bg-surface text-ink hover:border-accent"}`}
      {...props}
    >
      <span className="text-[11px] font-semibold">{children}</span>
    </button>
  );
}

// A custom-styled combobox replacing the native <select> — the browser's
// own dropdown can't be restyled, and this keeps the same rounded-card
// look (with an optional secondary line per option) as the rest of the app.
// Used for both University and Type, as segments of the same search pill.
function Picker({ heading, value, onChange, items, placeholder, variant, panelWidth = "16rem", mutedPlaceholder = false }) {
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

const LEASE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "3", label: "3 mo or less" },
  { value: "6", label: "6 mo or less" },
  { value: "12", label: "12 mo or less" },
];

const DISTANCE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1 km" },
  { value: "3", label: "3 km" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
];

export default function FilterBar({
  search, setSearch,
  universitySlug, setUniversitySlug, universities,
  type, setType,
  minRent, setMinRent,
  maxRent, setMaxRent,
  leaseMax, setLeaseMax,
  maxDistanceKm, setMaxDistanceKm,
  trailing,
}) {
  const searchRef = useRef(null);
  const filtersRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [minRent, maxRent, leaseMax, maxDistanceKm].filter(Boolean).length;
  const hasFilters = Boolean(search || universitySlug || type) || activeFilterCount > 0;

  const universityItems = [{ value: "", label: "Any university" }, ...universities.map((u) => ({ value: u.slug, label: u.name, sub: u.city }))];
  const typeItems = TYPES.map((t) => ({ value: t.value, label: t.label }));

  useEffect(() => {
    if (!filtersOpen) return;
    function onPointerDown(event) { if (!filtersRef.current?.contains(event.target)) setFiltersOpen(false); }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [filtersOpen]);

  function clearAll() {
    setSearch(""); setUniversitySlug(""); setType("");
    setMinRent(""); setMaxRent(""); setLeaseMax(""); setMaxDistanceKm("");
    setFiltersOpen(false);
  }

  return (
    <div className="mt-6">
      <div className="flex items-stretch divide-x divide-line rounded-3xl border border-line bg-surface shadow-[var(--shadow)]">
        <div onClick={() => searchRef.current?.focus()} className="flex min-w-0 flex-1 flex-col items-start rounded-l-3xl px-7 py-3.5 transition-colors hover:bg-surface-muted focus-within:bg-surface-muted">
          <span className="text-[11px] font-semibold text-ink">Search</span>
          <input
            ref={searchRef}
            aria-label="Search properties"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or area"
            style={{ outline: "none", fontSize: "0.875rem" }}
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted"
          />
        </div>

        <div className="relative hidden min-w-0 flex-[1.3] sm:flex">
          <Picker heading="University" value={universitySlug} onChange={setUniversitySlug} items={universityItems} placeholder="Any university" variant="pill" panelWidth="18rem" mutedPlaceholder />
        </div>

        <div className="relative hidden min-w-0 flex-[.8] sm:flex">
          <Picker heading="Type" value={type} onChange={setType} items={typeItems} placeholder="All homes" variant="pill" panelWidth="11rem" mutedPlaceholder />
        </div>

        <div className="flex items-center pl-2 pr-2.5">
          <button
            type="button"
            onClick={() => searchRef.current?.focus()}
            aria-label="Search"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-transform hover:scale-105"
          >
            <SearchIcon />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[.1em] text-muted">University</span>
          <Picker heading="University" value={universitySlug} onChange={setUniversitySlug} items={universityItems} placeholder="Any university" variant="block" panelWidth="16rem" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[.1em] text-muted">Type</span>
          <Picker heading="Type" value={type} onChange={setType} items={typeItems} placeholder="All homes" variant="block" panelWidth="11rem" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div ref={filtersRef} className="relative">
          <Chip selected={activeFilterCount > 0 || filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
            <span className="inline-flex items-center gap-1.5"><SlidersIcon />Filters{activeFilterCount > 0 && <span className="ml-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span>}</span>
          </Chip>
          {filtersOpen && <div className="absolute left-0 top-[calc(100%+.5rem)] z-10 w-[19rem] rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow)]">
            <div>
              <span className="text-xs font-semibold text-ink">Cost per month</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-line px-3 py-2 transition-colors focus-within:border-accent focus-within:bg-surface-muted">
                  <span className="text-xs font-semibold text-muted">฿</span>
                  <input type="number" min="0" inputMode="numeric" value={minRent} onChange={(e) => setMinRent(e.target.value)} placeholder="Min" style={{ outline: "none", fontSize: "0.75rem" }} className="w-full min-w-0 bg-transparent text-xs font-semibold text-ink placeholder:font-normal placeholder:text-muted" />
                </span>
                <span className="text-xs text-muted">–</span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-line px-3 py-2 transition-colors focus-within:border-accent focus-within:bg-surface-muted">
                  <span className="text-xs font-semibold text-muted">฿</span>
                  <input type="number" min="0" inputMode="numeric" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} placeholder="Max" style={{ outline: "none", fontSize: "0.75rem" }} className="w-full min-w-0 bg-transparent text-xs font-semibold text-ink placeholder:font-normal placeholder:text-muted" />
                </span>
              </div>
            </div>

            <div className="mt-5">
              <span className="text-xs font-semibold text-ink">Minimum lease</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LEASE_OPTIONS.map((o) => <MiniChip key={o.value} selected={leaseMax === o.value} onClick={() => setLeaseMax(o.value)}>{o.label}</MiniChip>)}
              </div>
            </div>

            <div className="mt-5">
              <span className="text-xs font-semibold text-ink">Distance from university</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DISTANCE_OPTIONS.map((o) => <MiniChip key={o.value} selected={maxDistanceKm === o.value} onClick={() => setMaxDistanceKm(o.value)}>{o.label}</MiniChip>)}
              </div>
            </div>

            <button type="button" onClick={() => setFiltersOpen(false)} className="mt-5 min-h-10 w-full rounded-full bg-ink text-canvas"><span className="text-sm font-bold">Show results</span></button>
          </div>}
        </div>

        {hasFilters && <button type="button" onClick={clearAll} className="text-muted underline decoration-line underline-offset-4 hover:text-accent"><span className="text-sm font-semibold">Clear all</span></button>}
        {trailing}
      </div>
    </div>
  );
}
