export const utilities = [
  { key: 'electricity', unit: 'kWh' },
  { key: 'water', unit: 'm³' },
  { key: 'internet', unit: null },
];
export const billingKeys = ['unspecified', 'included', 'metered', 'monthly', 'provider', 'unavailable'];
export function money(value) { return `฿${Number(value).toLocaleString('en-TH', { maximumFractionDigits: 2 })}`; }
export function utilitySummary(listing, utility, t) {
  const billing = listing[`${utility.key}_billing`] || 'unspecified';
  const rate = listing[`${utility.key}_rate`];
  if (billing === 'metered' || billing === 'monthly') return rate == null ? t("common.rateNotSpecified") : `${money(rate)} / ${billing === 'monthly' ? t("common.month") : utility.unit}`;
  return t(`common.billing.${billing}`) || t("common.notSpecified");
}
export function listingCostPayload(form, t) {
  const amount = name => {
    const raw = String(form.get(name) ?? '').trim();
    if (!raw) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 99999999.99) throw new Error(t("costsErrors.amountRange"));
    return value;
  };
  const payload = { security_deposit: amount('security_deposit'), van_service: form.get('van_service') || 'unspecified', van_details: String(form.get('van_details') ?? '').trim() };
  for (const utility of utilities) {
    const billing = form.get(`${utility.key}_billing`) || 'unspecified';
    if (!billingKeys.includes(billing) || (utility.key === 'internet' && billing === 'metered')) throw new Error(t("costsErrors.invalidBilling"));
    payload[`${utility.key}_billing`] = billing;
    const rate = ['metered', 'monthly'].includes(billing) ? amount(`${utility.key}_rate`) : null;
    if (['metered', 'monthly'].includes(billing) && rate === null) throw new Error(t("costsErrors.utilityRateRequired", { utility: t(`common.utility.${utility.key}`).toLowerCase() }));
    payload[`${utility.key}_rate`] = rate;
  }
  if (!['unspecified', 'included', 'paid', 'unavailable'].includes(payload.van_service)) throw new Error(t("costsErrors.invalidVanService"));
  if (['unspecified', 'unavailable'].includes(payload.van_service)) payload.van_details = '';
  if (payload.van_details.length > 1000) throw new Error(t("costsErrors.vanDetailsTooLong"));
  return payload;
}
