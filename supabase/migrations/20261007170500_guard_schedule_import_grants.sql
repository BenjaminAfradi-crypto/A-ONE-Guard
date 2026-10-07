-- Tighten direct client privileges on schedule import audit batches.
-- Mutations after creation are only allowed through guarded RPCs.
revoke update, delete, truncate, references, trigger
  on table public.guard_schedule_import_batches
  from authenticated;
revoke all
  on table public.guard_schedule_import_batches
  from anon;
grant select, insert
  on table public.guard_schedule_import_batches
  to authenticated;
