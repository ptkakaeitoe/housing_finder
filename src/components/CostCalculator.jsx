"use client";

import { useEffect, useId, useRef, useState } from "react";
import { money, utilities } from "../lib/listingCosts";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

const amount = value => Math.min(99999999, Math.max(0, Number(value) || 0));

export default function CostCalculator({ listing }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);
  const id = useId();
  const [usage, setUsage] = useState({ electricity: 150, water: 5 });
  const [rates, setRates] = useState({});
  const [extra, setExtra] = useState(0);

  function reset() {
    setUsage({ electricity: 150, water: 5 });
    setRates(Object.fromEntries(utilities.map(({ key }) => [key, ['metered', 'monthly'].includes(listing[`${key}_billing`]) ? amount(listing[`${key}_rate`]) : 0])));
    setExtra(0);
  }

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [open]);

  const charges = utilities.map(utility => ({ ...utility, cost: amount(rates[utility.key]) * (listing[`${utility.key}_billing`] === 'metered' ? amount(usage[utility.key]) : 1) }));
  const total = amount(listing.monthly_rent) + charges.reduce((sum, utility) => sum + utility.cost, 0) + amount(extra);
  const inputClass = "mt-1 min-h-9 w-full rounded-lg border border-line bg-transparent px-3 text-ink";

  return <>
    <button type="button" onClick={() => { reset(); setOpen(true); }} className="min-h-9 rounded-lg border border-line px-3 text-xs font-medium text-ink hover:border-accent hover:text-accent">{t("calculator.button")}</button>
    {open && <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl border border-line bg-surface p-4 text-ink shadow-xl backdrop:bg-black/40">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id={`${id}-title`} className="text-base font-semibold">{t("calculator.button")}</h2><p className="mt-1 truncate text-xs text-muted">{getLocalizedTitle(listing, locale)}</p></div>
        <button autoFocus type="button" onClick={() => setOpen(false)} aria-label={t("calculator.close")} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-xl">×</button>
      </div>
      <div aria-live="polite" className="mt-3 flex items-center justify-between gap-3 border-b border-line py-3">
        <div><p className="text-xs text-muted">{t("calculator.total")}</p><p className="mt-1 text-xs text-muted">{t("calculator.rent")} {money(listing.monthly_rent)}</p></div>
        <strong className="text-2xl font-semibold tracking-tight tabular-nums text-ink">{money(total)}</strong>
      </div>
      <p id={`${id}-description`} className="sr-only">{t("calculator.description")}</p>
      {utilities.some(({ key }) => listing[`${key}_billing`] === 'metered') && <div className="mt-3 flex items-center gap-1.5"><span className="mr-auto text-[11px] text-muted">{t("calculator.presets")}</span>{[[75, 3], [150, 5], [300, 10]].map(([electricity, water], index) => <button type="button" key={electricity} aria-pressed={Number(usage.electricity) === electricity && Number(usage.water) === water} onClick={() => setUsage({ electricity, water })} className={`min-h-8 rounded-lg border px-2.5 text-xs ${Number(usage.electricity) === electricity && Number(usage.water) === water ? 'border-ink text-ink' : 'border-line text-muted hover:text-ink'}`}>{t(`calculator.preset${index}`)}</button>)}</div>}
      <div className="mt-2 divide-y divide-line">
        {utilities.map(({ key, unit }) => {
          const billing = listing[`${key}_billing`] || 'unspecified';
          const knownRate = ['metered', 'monthly'].includes(billing) && listing[`${key}_rate`] != null;
          const free = ['included', 'unavailable'].includes(billing);
          const cost = charges.find(charge => charge.key === key).cost;
          return <div key={key} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold">{t(`common.utility.${key}`)}</p><p className="mt-0.5 text-[11px] text-muted">{knownRate && billing === 'metered' ? `${money(listing[`${key}_rate`])} / ${unit}` : knownRate ? null : t(`common.billing.${billing}`)}</p></div>
              {billing === 'metered' ? <label className="w-28 text-[10px] text-muted"><span className="sr-only">{t(`common.utility.${key}`)} {t("calculator.usage")}</span>{unit}<input type="number" min="0" max="99999999" step="any" value={usage[key] ?? ''} onChange={event => setUsage(current => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label> : knownRate || free ? <span className="text-sm font-medium tabular-nums">{money(cost)}</span> : <label className="w-28 text-[10px] text-muted"><span className="sr-only">{t(`common.utility.${key}`)} {t("calculator.monthlyAmount")}</span>THB<input type="number" min="0" max="99999999" step="any" value={rates[key] ?? ''} onChange={event => setRates(current => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label>}
            </div>
            {billing === 'metered' && <p className="mt-1 text-right text-[11px] text-muted">{money(cost)}</p>}
            {billing === 'metered' && !knownRate && <label className="mt-2 block text-[10px] text-muted">{t("calculator.rate")} (THB)<input type="number" min="0" max="99999999" step="any" value={rates[key] ?? ''} onChange={event => setRates(current => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label>}
          </div>;
        })}
        <label className="flex items-center justify-between gap-3 py-3 text-xs font-semibold">{t("calculator.extra")} (THB)<input type="number" min="0" max="99999999" step="any" value={extra} onChange={event => setExtra(event.target.value)} className="min-h-9 w-28 rounded-lg border border-line bg-transparent px-3 font-normal text-ink" /></label>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{t("calculator.deposit")} {listing.security_deposit == null ? t("common.notSpecified") : money(listing.security_deposit)}. {t("calculator.depositNote")}</p>
      <button type="button" onClick={reset} className="mt-3 min-h-9 rounded-lg border border-line px-3 text-xs font-medium">{t("calculator.reset")}</button>
    </dialog>}
  </>;
}
