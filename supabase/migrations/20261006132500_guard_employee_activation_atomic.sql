-- Make employee profile activation and login access a single transaction.
-- Frontend should call guard_set_employee_active instead of changing status directly.

create or replace function public.guard_set_employee_active(
  p_org uuid,
  p_employee uuid,
  p_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_employee public.guard_employees%rowtype;
  v_access boolean := null;
  v_next_status text := case when p_active then 'active' else 'inactive' end;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  v_actor_role := guard_private.role_for(p_org, v_actor);
  if v_actor_role not in ('owner','admin','dispatcher') then
    raise exception 'not allowed';
  end if;

  select *
    into v_employee
    from public.guard_employees
   where id = p_employee
     and org_id = p_org
   for update;

  if v_employee.id is null then
    raise exception 'employee not found';
  end if;

  -- Existing membership helper contains owner/admin/self-lockout protections.
  -- Dispatchers may still activate/deactivate personnel records without a login,
  -- but cannot change another user's application access.
  if v_employee.user_id is not null then
    v_access := public.guard_set_member_active(p_org, v_employee.user_id, p_active);
  end if;

  update public.guard_employees
     set status = v_next_status,
         updated_at = now()
   where id = v_employee.id
     and org_id = p_org;

  insert into public.guard_audit_log(
    org_id, actor_user_id, entity_type, entity_id, action, before_data, after_data
  ) values (
    p_org,
    v_actor,
    'employee',
    v_employee.id,
    case when p_active then 'employee_reactivated' else 'employee_deactivated' end,
    jsonb_build_object('status', v_employee.status, 'user_id', v_employee.user_id),
    jsonb_build_object('status', v_next_status, 'user_id', v_employee.user_id, 'access_active', v_access)
  );

  return jsonb_build_object(
    'employee_id', v_employee.id,
    'employee_status', v_next_status,
    'has_login', v_employee.user_id is not null,
    'access_active', v_access
  );
end
$function$;

revoke execute on function public.guard_set_employee_active(uuid,uuid,boolean) from public, anon;
grant execute on function public.guard_set_employee_active(uuid,uuid,boolean) to authenticated;
