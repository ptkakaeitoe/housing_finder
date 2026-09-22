begin;
alter table public.listings
  add column security_deposit numeric(10,2) check (security_deposit >= 0),
  add column van_service text not null default 'unspecified' check (van_service in ('unspecified','included','paid','unavailable')),
  add column van_details text not null default '' check (char_length(van_details) <= 1000),
  add column electricity_billing text not null default 'unspecified' check (electricity_billing in ('unspecified','included','monthly','provider','unavailable','metered')),
  add column electricity_rate numeric(10,2) check (electricity_rate >= 0),
  add constraint electricity_rate_required check ((electricity_billing in ('metered','monthly') and electricity_rate is not null) or (electricity_billing not in ('metered','monthly') and electricity_rate is null)),
  add column water_billing text not null default 'unspecified' check (water_billing in ('unspecified','included','monthly','provider','unavailable','metered')),
  add column water_rate numeric(10,2) check (water_rate >= 0),
  add constraint water_rate_required check ((water_billing in ('metered','monthly') and water_rate is not null) or (water_billing not in ('metered','monthly') and water_rate is null)),
  add column internet_billing text not null default 'unspecified' check (internet_billing in ('unspecified','included','monthly','provider','unavailable')),
  add column internet_rate numeric(10,2) check (internet_rate >= 0),
  add constraint internet_rate_required check ((internet_billing in ('metered','monthly') and internet_rate is not null) or (internet_billing not in ('metered','monthly') and internet_rate is null));
notify pgrst, 'reload schema';
commit;
