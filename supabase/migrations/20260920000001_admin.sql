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
