-- Central authorization fix for employee-scoped SECURITY DEFINER RPCs.
-- Only active staff with active membership in the SAME tenant can be resolved.
-- Existing function signature and GRANTs remain unchanged; do not break RLS
-- policy callers that may need this helper.
CREATE OR REPLACE FUNCTION guard_private.employee_id_for(p_org uuid, p_user uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select e.id
  from public.guard_employees e
  where e.org_id=p_org and e.user_id=p_user and e.status='active'
    and exists(
      select 1 from public.guard_memberships gm
      where gm.org_id=p_org and gm.user_id=p_user and gm.active=true
    )
  order by e.created_at,e.id
  limit 1
$function$;
