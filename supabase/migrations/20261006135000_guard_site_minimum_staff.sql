-- Pilot staffing target per object. The planner surfaces under-staffed scheduled periods.
alter table public.guard_sites
  add column if not exists minimum_staff integer not null default 1;

do $block$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.guard_sites'::regclass
      and conname='guard_sites_minimum_staff_check'
  ) then
    alter table public.guard_sites
      add constraint guard_sites_minimum_staff_check
      check (minimum_staff between 1 and 50);
  end if;
end
$block$;
