-- Security: always retain at least one ACTIVE organization owner.
-- Acquires the same per-organization transaction advisory lock in both
-- owner-role and access-active mutation RPCs; signatures and grants unchanged.
-- No direct membership UPDATE role is granted to authenticated in RLS.
CREATE OR REPLACE FUNCTION public.guard_set_member_role(p_org uuid, p_user uuid, p_role text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_target_role text;
  v_owner_count int;
begin
  if v_actor is null then raise exception 'authentication required'; end if;
  if p_role not in ('owner','admin','dispatcher','employee') then raise exception 'invalid role'; end if;
  -- Serialize membership/owner changes in this organization. Concurrent
  -- demotions and suspensions must not both pass a stale owner count.
  perform pg_advisory_xact_lock(
    hashtextextended('aone:membership-owner-state:'||p_org::text,0)
  );
  v_actor_role := guard_private.role_for(p_org,v_actor);
  v_target_role := guard_private.role_for(p_org,p_user);
  if v_target_role is null then raise exception 'member not found'; end if;

  if v_actor_role='owner' then
    if v_target_role='owner' and p_role<>'owner' then
      select count(*) into v_owner_count from public.guard_memberships where org_id=p_org and role='owner' and active=true;
      if v_owner_count <= 1 then raise exception 'last owner cannot be demoted'; end if;
    end if;
  elsif v_actor_role='admin' then
    if v_target_role in ('owner','admin') or p_role in ('owner','admin') then
      raise exception 'admin cannot change owner/admin roles';
    end if;
  else
    raise exception 'not allowed';
  end if;

  update public.guard_memberships set role=p_role where org_id=p_org and user_id=p_user;
  insert into public.guard_audit_log(org_id,actor_user_id,entity_type,entity_id,action,before_data,after_data)
  values(p_org,v_actor,'membership',p_user,'role_changed',jsonb_build_object('role',v_target_role),jsonb_build_object('role',p_role));
  return p_role;
end
$function$;

CREATE OR REPLACE FUNCTION public.guard_set_member_active(p_org uuid, p_user uuid, p_active boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid:=auth.uid(); v_actor_role text; v_target_role text; v_target_active boolean; v_owner_count int;
begin
 if v_actor is null then raise exception 'authentication required'; end if;
 if p_user=v_actor and p_active=false then raise exception 'cannot suspend your own access'; end if;
  -- Serialize membership/owner changes in this organization. Concurrent
  -- demotions and suspensions must not both pass a stale owner count.
  perform pg_advisory_xact_lock(
    hashtextextended('aone:membership-owner-state:'||p_org::text,0)
  );
 v_actor_role:=guard_private.role_for(p_org,v_actor);
 select gm.role,gm.active into v_target_role,v_target_active from public.guard_memberships gm where gm.org_id=p_org and gm.user_id=p_user;
 if v_target_role is null then raise exception 'member not found'; end if;
 if v_actor_role='owner' then
  if p_active=false and v_target_role='owner' and v_target_active=true then select count(*) into v_owner_count from public.guard_memberships where org_id=p_org and role='owner' and active=true; if v_owner_count<=1 then raise exception 'last active owner cannot be disabled'; end if; end if;
 elsif v_actor_role='admin' then if v_target_role in ('owner','admin') then raise exception 'admin cannot disable owner/admin'; end if;
 else raise exception 'not allowed'; end if;
 update public.guard_memberships set active=p_active where org_id=p_org and user_id=p_user;
 insert into public.guard_audit_log(org_id,actor_user_id,entity_type,entity_id,action,before_data,after_data) values(p_org,v_actor,'membership',p_user,case when p_active then 'access_reactivated' else 'access_suspended' end,jsonb_build_object('active',v_target_active,'role',v_target_role),jsonb_build_object('active',p_active,'role',v_target_role));
 return p_active;
end $function$;
