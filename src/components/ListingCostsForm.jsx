"use client";
import { useState } from 'react';
import ListingIcon from './ListingIcon';
import { utilities, billingKeys } from '../lib/listingCosts';
import { useLocale } from '../lib/i18n/LocaleContext';
import { inputClassName } from './uiStyles';
const input = `mt-2 ${inputClassName}`;
export default function ListingCostsForm({ listing }) {
  const { t } = useLocale();
  const [van, setVan] = useState(listing?.van_service || 'unspecified');
  return <section className="space-y-5 py-4 sm:col-span-2" aria-labelledby="listing-costs-heading">
    <div><h2 id="listing-costs-heading" className="text-lg font-semibold text-ink">{t("listingCostsForm.heading")}</h2><p className="mt-1 text-sm leading-6 text-muted">{t("listingCostsForm.subheading")}</p></div>
    <label className="block min-w-0 text-xs font-medium text-muted"><span className="flex items-center gap-2"><ListingIcon name="deposit" />{t("listingCostsForm.securityDeposit")}</span><input className={input} type="number" name="security_deposit" min="0" max="99999999.99" step="0.01" defaultValue={listing?.security_deposit ?? ''} placeholder={t("listingCostsForm.securityDepositPlaceholder")} /><span className="mt-2 block text-xs font-normal text-muted">{t("listingCostsForm.securityDepositHint")}</span></label>
    <div className="grid gap-4 sm:grid-cols-3">{utilities.map(utility => <UtilityField key={utility.key} utility={utility} listing={listing} />)}</div>
    <div className="pt-2">
      <label className="block min-w-0 text-xs font-medium text-muted"><span className="flex items-center gap-2"><ListingIcon name="van" />{t("listingCostsForm.vanServiceToUniversity")}</span><select name="van_service" className={input} value={van} onChange={e => setVan(e.target.value)}><option value="unspecified">{t("common.notSpecified")}</option><option value="included">{t("roomDetails.vanIncluded")}</option><option value="paid">{t("roomDetails.vanPaid")}</option><option value="unavailable">{t("roomDetails.vanUnavailable")}</option></select></label>
      {['included', 'paid'].includes(van) && <label className="mt-4 block min-w-0 text-xs font-medium text-muted">{t("listingCostsForm.routeScheduleFare")}<textarea name="van_details" maxLength={1000} className={`${input} min-h-24 py-3`} defaultValue={listing?.van_details || ''} placeholder={t("listingCostsForm.routePlaceholder")} /><span className="mt-1 block text-xs font-normal text-muted">{t("listingCostsForm.routeHint")}</span></label>}
    </div>
  </section>;
}
function UtilityField({ utility, listing }) {
  const { t } = useLocale();
  const [billing, setBilling] = useState(listing?.[`${utility.key}_billing`] || 'unspecified');
  return <div className="min-w-0">
    <label className="block min-w-0 text-xs font-medium text-muted"><span className="flex items-center gap-2 text-muted"><ListingIcon name={utility.key} />{t(`common.utility.${utility.key}`)}</span><select className={input} name={`${utility.key}_billing`} value={billing} onChange={e => setBilling(e.target.value)}>{billingKeys.filter((key) => key !== 'metered' || utility.unit).map((key) => <option key={key} value={key}>{t(`common.billing.${key}`)}</option>)}</select></label>
    {['metered', 'monthly'].includes(billing) && <label className="mt-3 block text-xs font-medium text-muted">THB / {billing === 'monthly' ? t("common.month") : utility.unit}<input className={input} type="number" required name={`${utility.key}_rate`} min="0" max="99999999.99" step="0.01" defaultValue={listing?.[`${utility.key}_rate`] ?? ''} /></label>}
  </div>;
}
