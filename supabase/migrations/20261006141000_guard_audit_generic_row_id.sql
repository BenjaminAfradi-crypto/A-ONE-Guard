-- Fix generic Guard audit trigger for tables whose primary key is not named id.
-- guard_employee_private uses employee_id as its primary key.

create or replace function guard_private.audit_guard_ops_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  j_new jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else '{}'::jsonb end;
  j_old jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else '{}'::jsonb end;
  v_org uuid;
  v_id uuid;
  v_org_text text;
  v_id_text text;
begin
  v_org_text := coalesce(j_new->>'org_id',j_old->>'org_id');
  if v_org_text is null then
    raise exception 'audit row has no org_id';
  end if;
  v_org := v_org_text::uuid;

  v_id_text := coalesce(
    j_new->>'id',
    j_old->>'id',
    j_new->>'employee_id',
    j_old->>'employee_id'
  );
  if v_id_text is not null then
    v_id := v_id_text::uuid;
  end if;

  insert into public.guard_audit_log(
    org_id,actor_user_id,entity_type,entity_id,action,before_data,after_data
  ) values (
    v_org,
    auth.uid(),
    tg_table_name,
    v_id,
    lower(tg_op),
    case when tg_op in ('UPDATE','DELETE') then j_old else null end,
    case when tg_op in ('INSERT','UPDATE') then j_new else null end
  );

  if tg_op='DELETE' then
    return old;
  end if;
  return new;
end
$function$;
