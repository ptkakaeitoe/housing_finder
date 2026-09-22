"use client";
import { useState } from 'react';
import ListingIcon from './ListingIcon';
import { utilities, billingLabels } from '../lib/listingCosts';
const input = 'mt-2 min-h-12 w-full rounded-xl border border-line bg-canvas px-4 text-sm text-ink focus:border-accent focus:outline-none';
export default function ListingCostsForm({ listing }) {
  const [van, setVan] = useState(listing?.van_service || 'unspecified');
  return <section className="space-y-5 rounded-2xl border border-line bg-surface p-5 sm:col-span-2 sm:p-6" aria-labelledby="listing-costs-heading">
    <div><h2 id="listing-costs-heading" className="text-xl font-semibold text-ink">Costs & campus transport</h2><p className="mt-1 text-sm leading-6 text-muted">Help students understand what they will pay and how they can reach campus.</p></div>
    <label className="block text-sm font-semibold text-ink"><span className="flex items-center gap-2"><ListingIcon name="deposit" />Security deposit (THB)</span><input className={input} type="number" name="security_deposit" min="0" max="99999999.99" step="0.01" defaultValue={listing?.security_deposit ?? ''} placeholder="e.g. 10000" /><span className="mt-2 block text-xs font-normal text-muted">Total deposit amount. Enter 0 for no deposit; leave blank if undecided.</span></label>
    <div className="grid gap-4 sm:grid-cols-3">{utilities.map(utility => <UtilityField key={utility.key} utility={utility} listing={listing} />)}</div>
    <div className="border-t border-line pt-5">
      <label className="block text-sm font-semibold text-ink"><span className="flex items-center gap-2"><ListingIcon name="van" />Van service to university</span><select name="van_service" className={input} value={van} onChange={e => setVan(e.target.value)}><option value="unspecified">Not specified</option><option value="included">Available · included in rent</option><option value="paid">Available · extra charge</option><option value="unavailable">No van service</option></select></label>
      {['included', 'paid'].includes(van) && <label className="mt-4 block text-sm font-semibold text-ink">Route, schedule & fare<textarea name="van_details" maxLength={1000} className={`${input} min-h-24 py-3`} defaultValue={listing?.van_details || ''} placeholder="e.g. Rangsit University main gate, weekdays 07:00–18:00, every 30 minutes. 20 THB per trip." /><span className="mt-1 block text-xs font-normal text-muted">Include the destination campus, pickup point, operating times and any extra charge.</span></label>}
    </div>
  </section>;
}
function UtilityField({ utility, listing }) {
  const [billing, setBilling] = useState(listing?.[`${utility.key}_billing`] || 'unspecified');
  return <div className="rounded-xl border border-line p-4">
    <label className="block text-sm font-semibold text-ink"><span className="flex items-center gap-2 text-accent"><ListingIcon name={utility.key} />{utility.label}</span><select className={input} name={`${utility.key}_billing`} value={billing} onChange={e => setBilling(e.target.value)}>{Object.entries(billingLabels).filter(([key]) => key !== 'metered' || utility.unit).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {['metered', 'monthly'].includes(billing) && <label className="mt-3 block text-xs font-semibold text-ink">THB / {billing === 'monthly' ? 'month' : utility.unit}<input className={input} type="number" required name={`${utility.key}_rate`} min="0" max="99999999.99" step="0.01" defaultValue={listing?.[`${utility.key}_rate`] ?? ''} /></label>}
  </div>;
}
