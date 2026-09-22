"use client";
import { useState } from 'react';
import { Picker } from './Picker';
import { INTL_LOCALES } from '../lib/i18n/config';
import { useLocale } from '../lib/i18n/LocaleContext';

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const pad = value => String(value).padStart(2, '0');
const WEEKDAY_REFERENCE = [4, 5, 6, 7, 8, 9, 10]; // Jan 4-10, 1971: a Mon-Sun week
export default function ViewingDateTimePicker({ date, time, onDateChange, onTimeChange, disabled }) {
  const { t, locale } = useLocale();
  const intlLocale = INTL_LOCALES[locale];
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const today = new Date();
  const todayKey = dateKey(today);
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const [hour, minute] = time ? time.split(':') : ['', ''];
  const futureTime = value => !date || new Date(`${date}T${value}`) > new Date();
  const selected = date && time ? new Date(`${date}T${time}`) : null;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const weekdayLabels = WEEKDAY_REFERENCE.map(day => new Date(1971, 0, day).toLocaleDateString(intlLocale, { weekday: 'short' }));
  return <fieldset disabled={disabled} className="min-w-0 space-y-5 disabled:opacity-60">
    <legend className="mb-4 text-lg font-semibold text-ink">{t("viewingPicker.heading")}</legend>
    <section aria-label={t("viewingPicker.chooseDateAria")} className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("viewingPicker.preferredDate")}</p><h2 aria-live="polite" className="mt-1 text-lg font-semibold text-ink">{month.toLocaleDateString(intlLocale, { month: 'long', year: 'numeric' })}</h2></div>
        <div className="flex gap-2">{[-1, 1].map(direction => <button key={direction} type="button" disabled={direction === -1 && month <= new Date(today.getFullYear(), today.getMonth(), 1)} aria-label={direction === -1 ? t("viewingPicker.previousMonth") : t("viewingPicker.nextMonth")} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1))} className="flex size-10 items-center justify-center rounded-full border border-line text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-30"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden="true"><path d={direction === -1 ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'} /></svg></button>)}</div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">{weekdayLabels.map(day => <span key={day} className="pb-2 text-xs font-medium text-muted">{day}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}
        {Array.from({ length: days }, (_, index) => {
          const day = new Date(month.getFullYear(), month.getMonth(), index + 1);
          const value = dateKey(day);
          return <button type="button" key={value} disabled={value < todayKey} aria-label={day.toLocaleDateString(intlLocale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} aria-pressed={date === value} aria-current={value === todayKey ? 'date' : undefined} onClick={() => onDateChange(value)} className={`relative min-h-11 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-25 ${date === value ? 'bg-ink text-canvas' : 'text-ink enabled:hover:bg-surface-muted'}`}>
            {index + 1}{value === todayKey && <span className={`absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${date === value ? 'bg-canvas' : 'bg-accent'}`} />}
          </button>;
        })}
      </div>
    </section>
    <section aria-labelledby="preferred-time-heading" className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <h2 id="preferred-time-heading" className="text-base font-semibold text-ink">{t("viewingPicker.preferredTime")}</h2><p className="mt-1 text-xs leading-5 text-muted">{t("viewingPicker.timeZoneNote", { zone })}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div><p className="mb-2 text-xs font-medium text-muted">{t("viewingPicker.hour")}</p><Picker heading={t("viewingPicker.hour")} variant="block" value={hour} onChange={value => onTimeChange(`${value}:${minute || '00'}`)} items={Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) }))} placeholder={t("viewingPicker.chooseHour")} panelWidth="100%" /></div>
        <div><p className="mb-2 text-xs font-medium text-muted">{t("viewingPicker.minute")}</p><Picker heading={t("viewingPicker.minute")} variant="block" value={minute} onChange={value => onTimeChange(`${hour || '09'}:${value}`)} items={Array.from({ length: 60 }, (_, i) => ({ value: pad(i), label: pad(i) }))} placeholder={t("viewingPicker.chooseMinute")} panelWidth="100%" /></div>
      </div>
      <p className="mt-4 text-xs font-medium text-muted">{t("viewingPicker.quickSuggestions")}</p>
      <div className="mt-2 flex flex-wrap gap-2">{['09:00','10:30','13:00','14:30','16:00'].map(value => <button type="button" key={value} disabled={!futureTime(value)} aria-pressed={time === value} onClick={() => onTimeChange(value)} className={`min-h-10 rounded-full border px-4 text-sm font-medium disabled:opacity-30 ${time === value ? 'border-ink bg-ink text-canvas' : 'border-line text-ink hover:bg-surface-muted'}`}>{value}</button>)}</div>
    </section>
    <div role="status" className="flex items-start gap-3 rounded-xl bg-surface-muted p-4 text-sm text-ink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-14 5 3 3 6-6" /></svg><div><p className="font-semibold">{selected ? selected.toLocaleString(intlLocale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : date ? t("viewingPicker.chooseTimeToComplete") : t("viewingPicker.choosePreferred")}</p><p className="mt-1 text-xs text-muted">{selected && selected <= today ? t("viewingPicker.timePassed") : t("viewingPicker.confirmedNote")}</p></div></div>
  </fieldset>;
}
