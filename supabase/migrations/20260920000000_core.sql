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
