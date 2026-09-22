begin;

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
commit;
