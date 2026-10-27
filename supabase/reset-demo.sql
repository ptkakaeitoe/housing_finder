-- HousingFinder complete application reset.
-- Step 1 (local terminal): npm run reset:demo:clear
--   Deletes ALL Auth accounts, Storage files, and buckets in this project.
-- Step 2 (Supabase SQL Editor): run this ENTIRE file.
--   Removes and rebuilds all HousingFinder tables, functions, triggers,
--   policies, required buckets, and the six university records.
-- Step 3 (local terminal): npm run setup:demo
-- Step 4 (local terminal): npm run verify:demo
-- Destructive. Stop the app while resetting to prevent new signups/uploads.
-- This SQL step rolls back on failure; earlier API deletions cannot roll back.
-- Bundles all current supabase/migrations in filename order.

begin;

-- Require API cleanup first; never delete Storage metadata directly with SQL.
do $$
begin
  if exists (select 1 from auth.users) or exists (select 1 from storage.buckets) then
    raise exception 'Run npm run reset:demo:clear first. Auth accounts and Storage buckets must be empty.';
  end if;
end;
$$;

-- Policies on Storage survive dropping the application's public tables.
drop policy if exists "Listing images public" on storage.objects;
drop policy if exists "Landlords upload own images" on storage.objects;
drop policy if exists "Landlords delete own images" on storage.objects;
drop policy if exists "Landlords upload verification documents" on storage.objects;
drop policy if exists "Landlords read own verification documents" on storage.objects;
drop policy if exists "Admins read verification documents" on storage.objects;
drop policy if exists "Active accounts upload" on storage.objects;
drop policy if exists "Active accounts update files" on storage.objects;
drop policy if exists "Active accounts delete files" on storage.objects;

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists
  public.listing_reviews,
  public.verification_requests,
  public.viewing_requests,
  public.saved_listings,
  public.listings,
  public.universities,
  public.profiles,
  public.categories,
  public.resources,
  public.search_runs
cascade;

drop function if exists public.listing_poster(uuid);
drop function if exists public.reset_listing_review();
drop function if exists public.valid_listing_photos(text[], uuid);
drop function if exists public.set_viewing_status(uuid, text);
drop function if exists public.has_active_account();
drop function if exists public.is_admin();
drop function if exists public.create_profile();

-- Source: supabase/migrations/20260920000000_core.sql
-- Run in a new Supabase project with the SQL editor or Supabase CLI.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student','landlord','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''),
    case when new.raw_user_meta_data->>'role' = 'landlord' then 'landlord' else 'student' end);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile();

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 3 and 120),
  property_type text not null check (property_type in ('apartment','condo','room')),
  monthly_rent numeric(10,2) not null check (monthly_rent >= 0),
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  description text not null default '',
  image_path text,
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);
create index listings_status_rent_idx on public.listings(status, monthly_rent);
create index listings_landlord_idx on public.listings(landlord_id);

create table public.saved_listings (
  student_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, listing_id)
);

create table public.viewing_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  preferred_at timestamptz not null,
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now()
);
create index viewing_requests_student_idx on public.viewing_requests(student_id);
create index viewing_requests_listing_idx on public.viewing_requests(listing_id);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.saved_listings enable row level security;
alter table public.viewing_requests enable row level security;

revoke all on public.profiles, public.listings, public.saved_listings, public.viewing_requests from anon, authenticated;
grant select on public.profiles to authenticated;
grant update(full_name) on public.profiles to authenticated;
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;
grant select, insert, delete on public.saved_listings to authenticated;
grant select, insert on public.viewing_requests to authenticated;

create policy "Own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Edit own name" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Published listings are public" on public.listings for select to anon, authenticated using (status = 'published');
create policy "Owners see drafts" on public.listings for select to authenticated using (landlord_id = (select auth.uid()));
create policy "Landlords create listings" on public.listings for insert to authenticated with check (
  landlord_id = (select auth.uid()) and (image_path is null or split_part(image_path, '/', 1) = (select auth.uid())::text) and
  exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'landlord')
);
create policy "Landlords edit own listings" on public.listings for update to authenticated using (landlord_id = (select auth.uid())) with check (
  landlord_id = (select auth.uid()) and (image_path is null or split_part(image_path, '/', 1) = (select auth.uid())::text)
);
create policy "Landlords delete own listings" on public.listings for delete to authenticated using (landlord_id = (select auth.uid()));
create policy "Students see own saves" on public.saved_listings for select to authenticated using (student_id = (select auth.uid()));
create policy "Students save listings" on public.saved_listings for insert to authenticated with check (student_id = (select auth.uid()) and exists(select 1 from public.listings where id = listing_id and status = 'published'));
create policy "Students remove own saves" on public.saved_listings for delete to authenticated using (student_id = (select auth.uid()));
create policy "Students see own requests" on public.viewing_requests for select to authenticated using (student_id = (select auth.uid()));
create policy "Landlords see listing requests" on public.viewing_requests for select to authenticated using (exists(select 1 from public.listings where id = listing_id and landlord_id = (select auth.uid())));
create policy "Students request viewings" on public.viewing_requests for insert to authenticated with check (
  student_id = (select auth.uid()) and status = 'pending' and preferred_at > now() and
  exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'student') and
  exists(select 1 from public.listings where id = listing_id and status = 'published')
);

create or replace function public.set_viewing_status(request_id uuid, next_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if next_status not in ('accepted','declined') then raise exception 'Invalid status'; end if;
  update public.viewing_requests vr set status = next_status
  where vr.id = request_id and vr.status = 'pending' and exists (
    select 1 from public.listings l where l.id = vr.listing_id and l.landlord_id = auth.uid()
  );
  if not found then raise exception 'Request not found or access denied'; end if;
end; $$;
revoke all on function public.set_viewing_status(uuid,text) from public;
grant execute on function public.set_viewing_status(uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('listing-images','listing-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Listing images public" on storage.objects for select to anon, authenticated using (bucket_id = 'listing-images');
create policy "Landlords upload own images" on storage.objects for insert to authenticated with check (
  bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text and
  exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'landlord')
);
create policy "Landlords delete own images" on storage.objects for delete to authenticated using (
  bucket_id = 'listing-images' and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Source: supabase/migrations/20260920000001_admin.sql
-- Admin accounts are promoted manually by a project owner in the SQL Editor.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy "Admins see profiles" on public.profiles for select to authenticated using (public.is_admin());
create policy "Admins see all listings" on public.listings for select to authenticated using (public.is_admin());
create policy "Admins edit listings" on public.listings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete listings" on public.listings for delete to authenticated using (public.is_admin());
create policy "Admins see viewing requests" on public.viewing_requests for select to authenticated using (public.is_admin());

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  landlord_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) between 6 and 30),
  document_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index verification_requests_landlord_idx on public.verification_requests(landlord_id);
alter table public.verification_requests enable row level security;
revoke all on public.verification_requests from anon, authenticated;
grant select, insert on public.verification_requests to authenticated;
grant update(status, reviewed_at) on public.verification_requests to authenticated;
create policy "Landlords see own verification" on public.verification_requests for select to authenticated using (landlord_id = (select auth.uid()));
create policy "Admins see verification" on public.verification_requests for select to authenticated using (public.is_admin());
create policy "Landlords submit verification" on public.verification_requests for insert to authenticated with check (
  landlord_id = (select auth.uid()) and status = 'pending' and reviewed_at is null and
  split_part(document_path, '/', 1) = (select auth.uid())::text and
  exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'landlord')
);
create policy "Admins review verification" on public.verification_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('verification-documents','verification-documents',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;
create policy "Landlords upload verification documents" on storage.objects for insert to authenticated with check (
  bucket_id = 'verification-documents' and (storage.foldername(name))[1] = (select auth.uid())::text and
  exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'landlord')
);
create policy "Landlords read own verification documents" on storage.objects for select to authenticated using (
  bucket_id = 'verification-documents' and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Admins read verification documents" on storage.objects for select to authenticated using (
  bucket_id = 'verification-documents' and public.is_admin()
);

-- Source: supabase/migrations/20260921000000_universities.sql
-- Reference table of supported universities. Ids are fixed so the client
-- (src/lib/universities.js) can reference them without an extra round trip.
create table public.universities (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  city text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);

insert into public.universities (id, slug, name, city, latitude, longitude) values
  ('e956675d-085e-4716-940c-02424174c782', 'chula', 'Chulalongkorn University', 'Bangkok', 13.7367, 100.5231),
  ('1c731019-d77a-4533-aea4-1c63c7f951d0', 'thammasat-rangsit', 'Thammasat University (Rangsit Campus)', 'Pathum Thani', 14.0733, 100.6067),
  ('91e61342-49ef-4b9c-b23e-2694744aee80', 'kasetsart', 'Kasetsart University', 'Bangkok', 13.8467, 100.5697),
  ('01c42f18-6683-475a-b970-f963f6469ac8', 'mahidol-salaya', 'Mahidol University (Salaya Campus)', 'Nakhon Pathom', 13.7963, 100.3241),
  ('044680d9-498a-4f58-b937-f74459d39c7d', 'chiang-mai', 'Chiang Mai University', 'Chiang Mai', 18.8032, 98.9530),
  ('10ffe474-15b6-470f-9073-9f5a71c122b1', 'rangsit', 'Rangsit University', 'Pathum Thani', 13.9639, 100.6108);

alter table public.listings add column university_id uuid references public.universities(id) on delete set null;
create index listings_university_idx on public.listings(university_id);

alter table public.universities enable row level security;
revoke all on public.universities from anon, authenticated;
grant select on public.universities to anon, authenticated;
create policy "Universities are public" on public.universities for select to anon, authenticated using (true);

-- Source: supabase/migrations/20260922000000_lease_duration.sql
-- Minimum lease term a landlord requires, in months. Optional: null means
-- the landlord hasn't specified one, so filtering treats it as flexible.
alter table public.listings add column lease_duration_months smallint check (lease_duration_months is null or lease_duration_months > 0);

-- Source: supabase/migrations/20260922000001_listing_photos.sql
alter table public.listings add column image_paths text[] not null default '{}';
update public.listings set image_paths = array[image_path] where image_path is not null;

-- Keep gallery references inside the listing owner's storage folder.
create function public.valid_listing_photos(paths text[], owner_id uuid) returns boolean
language sql immutable set search_path = '' as $$
  select cardinality(paths) <= 10 and not exists (
    select 1 from unnest(paths) as p(path)
    where path is null or split_part(path, '/', 1) <> owner_id::text
  );
$$;
alter table public.listings add constraint listing_photos_valid
  check (public.valid_listing_photos(image_paths, landlord_id));

notify pgrst, 'reload schema';

-- Source: supabase/migrations/20260922000002_listing_costs_transport.sql
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

-- Source: supabase/migrations/20260922000003_listing_verification.sql
-- Expose only the display name and verification result, never private documents.
create function public.listing_poster(listing_id uuid)
returns table(full_name text, verified boolean)
language sql stable security definer set search_path = '' as $$
  select p.full_name, coalesce((
    select v.status = 'approved' from public.verification_requests v
    where v.landlord_id = p.id order by v.created_at desc, v.id desc limit 1
  ), false)
  from public.listings l join public.profiles p on p.id = l.landlord_id
  where l.id = listing_id and (l.status = 'published' or l.landlord_id = auth.uid() or public.is_admin());
$$;
revoke all on function public.listing_poster(uuid) from public;
grant execute on function public.listing_poster(uuid) to anon, authenticated;

create table public.listing_reviews (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  status text not null check (status in ('approved','rejected')),
  reviewed_at timestamptz not null default now()
);
alter table public.listing_reviews enable row level security;
revoke all on public.listing_reviews from anon, authenticated;
grant select on public.listing_reviews to anon, authenticated;
grant insert, update on public.listing_reviews to authenticated;
create policy "Visible listing review" on public.listing_reviews for select to anon, authenticated
using (exists(select 1 from public.listings l where l.id = listing_id));
create policy "Admins create listing reviews" on public.listing_reviews for insert to authenticated with check (public.is_admin());
create policy "Admins update listing reviews" on public.listing_reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Edited content must be reviewed again. Publication alone is not verification.
create function public.reset_listing_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (to_jsonb(new) - 'status' - 'created_at') is distinct from (to_jsonb(old) - 'status' - 'created_at') then
    delete from public.listing_reviews where listing_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.reset_listing_review() from public;
create trigger reset_listing_review after update on public.listings for each row execute function public.reset_listing_review();
notify pgrst, 'reload schema';

-- Source: supabase/migrations/20260922000004_account_moderation.sql
alter table public.profiles add column account_status text not null default 'active' check (account_status in ('active','suspended'));
-- No client receives permission to update this column.
create function public.has_active_account() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = auth.uid() and account_status = 'active');
$$;
revoke all on function public.has_active_account() from public;
grant execute on function public.has_active_account() to authenticated;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and account_status = 'active');
$$;
-- Restrictive policies also block already-issued sessions. Public browsing remains possible.
do $$
declare target text;
begin
 foreach target in array array['profiles','listings','saved_listings','viewing_requests','verification_requests','listing_reviews'] loop
  if to_regclass('public.' || target) is not null then
   execute format('create policy "Active accounts only" on public.%I as restrictive for all to authenticated using (public.has_active_account()) with check (public.has_active_account())', target);
  end if;
 end loop;
end $$;
create policy "Active accounts upload" on storage.objects as restrictive for insert to authenticated with check (public.has_active_account());
create policy "Active accounts update files" on storage.objects as restrictive for update to authenticated using (public.has_active_account()) with check (public.has_active_account());
create policy "Active accounts delete files" on storage.objects as restrictive for delete to authenticated using (public.has_active_account());

create or replace function public.set_viewing_status(request_id uuid, next_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not public.has_active_account() then raise exception 'Account suspended or unavailable'; end if;
 if next_status not in ('accepted','declined') then raise exception 'Invalid status'; end if;
 update public.viewing_requests vr set status = next_status
 where vr.id = request_id and vr.status = 'pending' and exists (
  select 1 from public.listings l where l.id = vr.listing_id and l.landlord_id = auth.uid()
 );
 if not found then raise exception 'Request not found or access denied'; end if;
end; $$;
notify pgrst, 'reload schema';

-- Source: supabase/migrations/20260922000005_listing_translations.sql
-- Machine-translated copies of title/description, populated at write time by the app.
-- English (title/description) stays the source of truth; these are best-effort and may be null.
alter table public.listings
  add column title_th text,
  add column title_my text,
  add column title_zh text,
  add column description_th text,
  add column description_my text,
  add column description_zh text;
notify pgrst, 'reload schema';

notify pgrst, 'reload schema';
commit;

-- Expected immediately after reset: universities = 6, listings = 0.
-- setup:demo adds the six homes, photos, and three demo accounts.
select 'universities' as item, count(*) as total from public.universities
union all
select 'listings', count(*) from public.listings
union all
select 'profiles', count(*) from public.profiles;
