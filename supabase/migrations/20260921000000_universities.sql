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
