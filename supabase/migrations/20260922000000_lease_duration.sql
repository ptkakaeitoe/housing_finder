-- Minimum lease term a landlord requires, in months. Optional: null means
-- the landlord hasn't specified one, so filtering treats it as flexible.
alter table public.listings add column lease_duration_months smallint check (lease_duration_months is null or lease_duration_months > 0);
