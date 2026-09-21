-- One-time cleanup for the user's former project, after checking that it has
-- zero Auth users and zero Storage buckets. This file is not a migration.
-- It deletes all rows in these three old app tables. Review before running.
begin;

drop table if exists
  public.categories,
  public.resources,
  public.search_runs;

commit;
