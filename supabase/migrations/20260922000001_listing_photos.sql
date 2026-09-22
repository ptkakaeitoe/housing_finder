begin;

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
commit;
