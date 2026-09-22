begin;
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
commit;
