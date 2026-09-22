export const utilities = [
  { key: 'electricity', label: 'Electricity', unit: 'kWh' },
  { key: 'water', label: 'Water', unit: 'm³' },
  { key: 'internet', label: 'Internet', unit: null },
];
export const billingLabels = { unspecified: 'Not specified', included: 'Included in rent', metered: 'Per unit', monthly: 'Monthly fee', provider: 'Billed by provider', unavailable: 'Not provided' };
export function money(value) { return `฿${Number(value).toLocaleString('en-TH', { maximumFractionDigits: 2 })}`; }
export function utilitySummary(listing, utility) {
  const billing = listing[`${utility.key}_billing`] || 'unspecified';
  const rate = listing[`${utility.key}_rate`];
  if (billing === 'metered' || billing === 'monthly') return rate == null ? 'Rate not specified' : `${money(rate)} / ${billing === 'monthly' ? 'month' : utility.unit}`;
  return billingLabels[billing] || 'Not specified';
}
export function listingCostPayload(form) {
  const amount = name => {
    const raw = String(form.get(name) ?? '').trim();
    if (!raw) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 99999999.99) throw new Error('Enter an amount between 0 and 99,999,999.99 THB.');
    return value;
  };
  const payload = { security_deposit: amount('security_deposit'), van_service: form.get('van_service') || 'unspecified', van_details: String(form.get('van_details') ?? '').trim() };
  for (const utility of utilities) {
    const billing = form.get(`${utility.key}_billing`) || 'unspecified';
    if (!(billing in billingLabels) || (utility.key === 'internet' && billing === 'metered')) throw new Error('Choose a valid utility billing option.');
    payload[`${utility.key}_billing`] = billing;
    const rate = ['metered', 'monthly'].includes(billing) ? amount(`${utility.key}_rate`) : null;
    if (['metered', 'monthly'].includes(billing) && rate === null) throw new Error(`Enter the ${utility.label.toLowerCase()} rate.`);
    payload[`${utility.key}_rate`] = rate;
  }
  if (!['unspecified', 'included', 'paid', 'unavailable'].includes(payload.van_service)) throw new Error('Choose a valid van service option.');
  if (['unspecified', 'unavailable'].includes(payload.van_service)) payload.van_details = '';
  if (payload.van_details.length > 1000) throw new Error('Keep van service details within 1,000 characters.');
  return payload;
}
