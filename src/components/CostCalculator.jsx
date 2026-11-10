"use client";

import { useEffect, useId, useRef, useState } from "react";
import { money, utilities } from "../lib/listingCosts";
import { getLocalizedTitle } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";
import { inputClassName, secondaryButtonClassName, quietButtonClassName } from "./uiStyles";

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
  const inputClass = `mt-1 ${inputClassName}`;

  return <>
    <button type="button" onClick={() => { reset(); setOpen(true); }} className={secondaryButtonClassName}>{t("calculator.button")}</button>
    {open && <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain rounded-xl bg-canvas p-5 text-ink shadow-xl backdrop:bg-black/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1"><h2 id={`${id}-title`} className="text-lg font-semibold">{t("calculator.button")}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 break-words text-muted">{getLocalizedTitle(listing, locale)}</p></div>
        <button autoFocus type="button" onClick={() => setOpen(false)} aria-label={t("calculator.close")} className="flex size-11 shrink-0 items-center justify-center rounded-lg text-xl text-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-ink">×</button>
      </div>
      <div aria-live="polite" className="mt-3 flex flex-wrap items-center justify-between gap-3 py-3">
        <div><p className="text-xs text-muted">{t("calculator.total")}</p><p className="mt-1 text-xs text-muted">{t("calculator.rent")} {money(listing.monthly_rent)}</p></div>
        <strong className="max-w-full text-2xl font-semibold tracking-tight break-words text-ink tabular-nums">{money(total)}</strong>
      </div>
      <p id={`${id}-description`} className="sr-only">{t("calculator.description")}</p>
      {utilities.some(({ key }) => listing[`${key}_billing`] === 'metered') && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="mr-auto text-xs text-muted">{t("calculator.presets")}</span>{[[75, 3], [150, 5], [300, 10]].map(([electricity, water], index) => <button type="button" key={electricity} aria-pressed={Number(usage.electricity) === electricity && Number(usage.water) === water} onClick={() => setUsage({ electricity, water })} className={`min-h-11 rounded-lg px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-ink ${Number(usage.electricity) === electricity && Number(usage.water) === water ? 'bg-ink text-canvas' : 'bg-surface-muted text-muted hover:text-ink'}`}>{t(`calculator.preset${index}`)}</button>)}</div>}
      <div className="mt-2">
        {utilities.map(({ key, unit }) => {
          const billing = listing[`${key}_billing`] || 'unspecified';
          const knownRate = ['metered', 'monthly'].includes(billing) && listing[`${key}_rate`] != null;
          const free = ['included', 'unavailable'].includes(billing);
          const cost = charges.find(charge => charge.key === key).cost;
          return <div key={key} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-medium">{t(`common.utility.${key}`)}</p><p className="mt-0.5 text-xs text-muted">{knownRate && billing === 'metered' ? `${money(listing[`${key}_rate`])} / ${unit}` : knownRate ? null : t(`common.billing.${billing}`)}</p></div>
              {billing === 'metered' ? <label className="w-32 max-w-[45%] shrink-0 text-xs text-muted"><span className="sr-only">{t(`common.utility.${key}`)} {t("calculator.usage")}</span>{unit}<input type="number" min="0" max="99999999" step="any" value={usage[key] ?? ''} onChange={event => setUsage(current => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label> : knownRate || free ? <span className="text-sm font-medium tabular-nums">{money(cost)}</span> : <label className="w-32 max-w-[45%] shrink-0 text-xs text-muted"><span className="sr-only">{t(`common.utility.${key}`)} {t("calculator.monthlyAmount")}</span>THB<input type="number" min="0" max="99999999" step="any" value={rates[key] ?? ''} onChange={event => setRates(current => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label>}
            </div>
            {billing === 'metered' && <p className="mt-1 text-right text-xs text-muted">{money(cost)}</p>}
            {billing === 'metered' && !knownRate && <label className="mt-2 block text-xs text-muted">{t("calculator.rate")} (THB)<input type="number" min="0" max="99999999" step="any" value={rates[key] ?? ''} onChange={event => setRates(current => ({ ...current, [key]: event.target.value }))} className={inputClass} /></label>}
          </div>;
        })}
        <label className="flex items-center justify-between gap-3 py-3 text-sm font-medium">{t("calculator.extra")} (THB)<input type="number" min="0" max="99999999" step="any" value={extra} onChange={event => setExtra(event.target.value)} className={`${inputClassName} max-w-[45%] shrink-0 basis-32 font-normal`} /></label>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{t("calculator.deposit")} {listing.security_deposit == null ? t("common.notSpecified") : money(listing.security_deposit)}. {t("calculator.depositNote")}</p>
      <button type="button" onClick={reset} className={`mt-3 ${quietButtonClassName}`}>{t("calculator.reset")}</button>
    </dialog>}
  </>;
}
