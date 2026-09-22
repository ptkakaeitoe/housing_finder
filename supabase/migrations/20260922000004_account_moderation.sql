begin;
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
commit;
