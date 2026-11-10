"use client";

import Link from "next/link";
import CostCalculator from "./CostCalculator";
import ListingTrust from "./ListingTrust";
import { publicPageLinkClassName } from "./layoutStyles";
import { utilities, utilitySummary, money } from "../lib/listingCosts";
import { listingUniversity } from "../lib/universities";
import { getLocalizedDescription } from "../lib/listingFields";
import { useLocale } from "../lib/i18n/LocaleContext";

const headingClassName = "text-lg font-semibold tracking-tight text-ink";

export default function ListingInformation({ listing, mapHref }) {
  const { t, locale } = useLocale();
  const nearest = listingUniversity(listing);
  const description = getLocalizedDescription(listing, locale);
  const costs = [
    { key: "rent", label: t("roomDetails.monthlyRent"), value: t("roomDetails.perMonthValue", { amount: money(listing.monthly_rent, locale) }) },
    { key: "deposit", label: t("roomDetails.securityDeposit"), empty: listing.security_deposit == null, value: listing.security_deposit == null ? t("common.notSpecified") : Number(listing.security_deposit) === 0 ? t("roomDetails.noDepositRequired") : money(listing.security_deposit, locale) },
    ...utilities.map((utility) => ({ key: utility.key, label: t(`common.utility.${utility.key}`), empty: !listing[`${utility.key}_billing`] || listing[`${utility.key}_billing`] === "unspecified", value: utilitySummary(listing, utility, t, locale) })),
  ];

  return <div className="space-y-9">
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
      <div className="min-w-0"><dt className="text-xs leading-5 text-muted">{t("roomDetails.homeType")}</dt><dd className="mt-1 text-sm font-medium leading-6">{t(`common.propertyType.${listing.property_type}`)}</dd></div>
      <div className="min-w-0"><dt className="text-xs leading-5 text-muted">{t("roomDetails.minimumLease")}</dt><dd className="mt-1 text-sm font-medium leading-6">{listing.lease_duration_months ? t("roomDetails.leaseMonths", { count: listing.lease_duration_months }) : t("common.notSpecified")}</dd></div>
      <div className="min-w-0"><dt className="text-xs leading-5 text-muted">{t("roomDetails.campusDistance")}</dt><dd className="mt-1 text-sm font-medium leading-6">{nearest ? t("roomDetails.distanceKm", { distance: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(nearest.distanceKm) }) : t("common.notSpecified")}</dd></div>
    </dl>

    <section aria-labelledby="about-home">
      <h2 id="about-home" className={headingClassName}>{t("roomDetails.aboutHeading")}</h2>
      <p className="mt-3 max-w-prose text-sm leading-7 whitespace-pre-line break-words text-muted">{description || t("roomDetails.noDescription")}</p>
    </section>

    <section aria-labelledby="costs-lease">
      <h2 id="costs-lease" className={headingClassName}>{t("roomDetails.costsHeading")}</h2>
      <p className="mt-1 text-xs leading-6 text-muted">{t("roomDetails.costsSubheading")}</p>
      <dl className="mt-3 divide-y divide-line/60">
        {costs.map((cost) => <div key={cost.key} className="grid grid-cols-2 items-start gap-4 py-3">
          <dt className="text-sm leading-6 text-muted">{cost.label}</dt>
          <dd className={`min-w-0 text-right text-sm leading-6 break-words tabular-nums ${cost.empty ? "text-muted" : "font-medium text-ink"}`}>{cost.value}</dd>
        </div>)}
      </dl>
      <div className="mt-4"><CostCalculator listing={listing} /></div>
    </section>

    <section aria-labelledby="campus-transport">
      <h2 id="campus-transport" className={headingClassName}>{t("roomDetails.vanServiceHeading")}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{{ included: t("roomDetails.vanIncluded"), paid: t("roomDetails.vanPaid"), unavailable: t("roomDetails.vanUnavailable"), unspecified: t("common.notSpecified") }[listing.van_service || "unspecified"]}</p>
      {["included", "paid"].includes(listing.van_service) && <p className="mt-2 max-w-prose text-sm leading-7 whitespace-pre-line break-words text-muted">{listing.van_details || t("roomDetails.vanDefaultDetails")}</p>}
    </section>

    <section aria-labelledby="home-location">
      <h2 id="home-location" className={headingClassName}>{t("roomDetails.locationHeading")}</h2>
      <dl className="mt-3 grid gap-5 sm:grid-cols-2">
        <div className="min-w-0"><dt className="text-xs leading-5 text-muted">{t("listingForm.address")}</dt><dd className="mt-1 text-sm leading-6 break-words">{listing.address}</dd></div>
        {nearest && <div className="min-w-0"><dt className="text-xs leading-5 text-muted">{t("filters.university")}</dt><dd className="mt-1 text-sm leading-6">{nearest.university.name}</dd></div>}
      </dl>
      {mapHref && <Link href={mapHref} className={`mt-3 ${publicPageLinkClassName}`}>{t("roomDetails.exploreOnMap")}</Link>}
    </section>

    <ListingTrust listingId={listing.id} />
  </div>;
}
