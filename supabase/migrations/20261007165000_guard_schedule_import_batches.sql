-- Track Dienstplan imports so a dispatcher can audit and safely revert a fresh import.
create table if not exists public.guard_schedule_import_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.guard_organizations(id) on delete cascade,
  file_name text,
  file_sha256 text,
  total_rows integer not null default 0 check (total_rows >= 0),
  imported_rows integer not null default 0 check (imported_rows >= 0),
  failed_rows integer not null default 0 check (failed_rows >= 0),
  created_shift_ids uuid[] not null default '{}'::uuid[],
  created_site_ids uuid[] not null default '{}'::uuid[],
  errors jsonb not null default '[]'::jsonb,
  status text not null default 'completed' check (status in ('completed','partial','failed','reverted')),
  created_by uuid,
  created_at timestamptz not null default now(),
  reverted_at timestamptz,
  reverted_by uuid
);

create index if not exists guard_schedule_import_batches_org_created_idx
  on public.guard_schedule_import_batches(org_id, created_at desc);

alter table public.guard_schedule_import_batches enable row level security;

drop policy if exists guard_schedule_import_batches_select on public.guard_schedule_import_batches;
create policy guard_schedule_import_batches_select
on public.guard_schedule_import_batches
for select
to authenticated
using (guard_private.can_manage(org_id, (select auth.uid())));

drop policy if exists guard_schedule_import_batches_insert on public.guard_schedule_import_batches;
create policy guard_schedule_import_batches_insert
on public.guard_schedule_import_batches
for insert
to authenticated
with check (
  guard_private.can_manage(org_id, (select auth.uid()))
  and created_by = (select auth.uid())
);

revoke all on table public.guard_schedule_import_batches from anon;
grant select, insert on table public.guard_schedule_import_batches to authenticated;

create or replace function public.guard_revert_schedule_import(p_batch uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_batch public.guard_schedule_import_batches%rowtype;
  v_role text;
  v_reverted integer := 0;
  v_blocked integer := 0;
begin
  if v_actor is null then raise exception 'authentication required'; end if;

  select * into v_batch
  from public.guard_schedule_import_batches
  where id = p_batch
  for update;

  if v_batch.id is null then raise exception 'Import nicht gefunden'; end if;

  v_role := guard_private.role_for(v_batch.org_id, v_actor);
  if v_role not in ('owner','admin','dispatcher') then raise exception 'not allowed'; end if;
  if v_batch.reverted_at is not null or v_batch.status = 'reverted' then
    raise exception 'Import wurde bereits zurückgenommen';
  end if;

  select count(*) into v_blocked
  from public.guard_shifts s
  where s.org_id = v_batch.org_id
    and s.id = any(v_batch.created_shift_ids)
    and (
      s.status <> 'planned'
      or exists (
        select 1 from public.guard_time_entries t
        where t.org_id = s.org_id and t.shift_id = s.id
      )
    );

  if v_blocked > 0 then
    raise exception 'Import kann nicht vollständig zurückgenommen werden: % Schichten wurden bereits verändert oder verwendet', v_blocked;
  end if;

  update public.guard_shifts s
  set status = 'canceled',
      notes = concat_ws(E'\n', nullif(s.notes,''), 'Import zurückgenommen'),
      updated_at = now()
  where s.org_id = v_batch.org_id
    and s.id = any(v_batch.created_shift_ids)
    and s.status = 'planned';

  get diagnostics v_reverted = row_count;

  update public.guard_schedule_import_batches
  set status = 'reverted', reverted_at = now(), reverted_by = v_actor
  where id = v_batch.id;

  insert into public.guard_audit_log(
    org_id, actor_user_id, entity_type, entity_id, action, after_data
  ) values (
    v_batch.org_id, v_actor, 'schedule_import', v_batch.id, 'import_reverted',
    jsonb_build_object('reverted_shifts',v_reverted,'file_name',v_batch.file_name)
  );

  return jsonb_build_object('batch_id',v_batch.id,'reverted_shifts',v_reverted);
end
$function$;

revoke execute on function public.guard_revert_schedule_import(uuid) from public, anon;
grant execute on function public.guard_revert_schedule_import(uuid) to authenticated;
