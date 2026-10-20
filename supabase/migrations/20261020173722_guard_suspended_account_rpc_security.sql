-- Security fix: prevent fully suspended accounts bypassing organization lockout
-- and reading employee compensation through a SECURITY DEFINER RPC.
-- All three functions retain their existing public signatures and GRANTs.
-- Tested with role authenticated and synthetic tenant users in BEGIN/ROLLBACK.

CREATE OR REPLACE FUNCTION public.guard_create_organization(p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid := auth.uid(); v_org uuid; v_slug text; v_name text := trim(p_name);
begin
  if v_uid is null then raise exception 'authentication required'; end if;
  -- Match guard_ensure_organization: a fully suspended account must not
  -- bypass its lockout by invoking the alternative creation RPC.
  if exists (
    select 1 from public.guard_memberships m where m.user_id=v_uid and not m.active
  ) and not exists (
    select 1 from public.guard_memberships m where m.user_id=v_uid and m.active
  ) then
    raise exception 'account access is suspended';
  end if;
  if char_length(v_name) < 2 then raise exception 'organization name too short'; end if;
  v_slug := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  insert into public.guard_organizations(name, slug) values (v_name, v_slug) returning id into v_org;
  insert into public.guard_memberships(org_id, user_id, role) values (v_org, v_uid, 'owner');
  insert into public.guard_employees(org_id, user_id, display_name, email, qualification_level)
  select v_org, v_uid, coalesce(nullif(u.raw_user_meta_data->>'full_name',''), split_part(u.email,'@',1), 'Owner'), u.email, 'none'
  from auth.users u where u.id = v_uid;
  return v_org;
end;
$function$;

CREATE OR REPLACE FUNCTION public.guard_my_month_summary(p_month date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid(); v_emp uuid; v_rate integer; v_vac numeric(5,2);
  v_start timestamptz; v_end timestamptz; v_work numeric := 0; v_break numeric := 0; v_net numeric := 0; v_gross integer := null; v_vac_used numeric := 0;
begin
  select e.id,e.hourly_rate_cents,e.vacation_days_annual into v_emp,v_rate,v_vac from public.guard_employees e
    where e.user_id=v_uid and e.status='active'
      and exists (
        select 1 from public.guard_memberships m
        where m.org_id=e.org_id and m.user_id=v_uid and m.active=true
      )
    order by e.created_at,e.id limit 1;
  if v_emp is null then raise exception 'employee not found'; end if;
  v_start := date_trunc('month',p_month::timestamp) at time zone 'Europe/Berlin';
  v_end := (date_trunc('month',p_month::timestamp)+interval '1 month') at time zone 'Europe/Berlin';
  select coalesce(sum(greatest(0,extract(epoch from (least(coalesce(t.clock_out_at,now()),v_end)-greatest(t.clock_in_at,v_start)))/60)),0)
    into v_work from public.guard_time_entries t where t.employee_id=v_emp and t.clock_in_at<v_end and coalesce(t.clock_out_at,now())>v_start;
  select coalesce(sum(greatest(0,extract(epoch from (least(coalesce(b.ended_at,now()),v_end)-greatest(b.started_at,v_start)))/60)),0)
    into v_break from public.guard_breaks b join public.guard_time_entries t on t.id=b.time_entry_id where t.employee_id=v_emp and b.started_at<v_end and coalesce(b.ended_at,now())>v_start;
  v_net:=greatest(0,v_work-v_break);
  if v_rate is not null then v_gross:=round(v_net*v_rate/60); end if;
  select coalesce(sum((l.ends_on-l.starts_on)+1),0) into v_vac_used from public.guard_leave_requests l where l.employee_id=v_emp and l.kind='vacation' and l.status='approved' and extract(year from l.starts_on)=extract(year from p_month);
  return jsonb_build_object('worked_minutes',round(v_net),'break_minutes',round(v_break),'gross_estimate_cents',v_gross,'hourly_rate_cents',v_rate,'vacation_days_annual',v_vac,'approved_vacation_calendar_days',v_vac_used);
end;
$function$;


CREATE OR REPLACE FUNCTION public.guard_finish_attempt(p_attempt uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid(); v_total int; v_correct int; v_score numeric(5,2); v_pass int; v_passed boolean; v_xp int;
begin
  if not exists(select 1 from public.guard_training_attempts a join public.guard_employees e on e.id=a.employee_id where a.id=p_attempt and e.user_id=v_uid and a.completed_at is null
    and e.org_id=a.org_id and e.status='active'
    and exists(select 1 from public.guard_memberships m
      where m.org_id=a.org_id and m.user_id=v_uid and m.active=true)) then raise exception 'attempt not available'; end if;
  select count(*) into v_total from public.guard_question_prompts q join public.guard_training_attempts a on a.course_id=q.course_id where a.id=p_attempt;
  select count(*) into v_correct from public.guard_training_answers where attempt_id=p_attempt and is_correct;
  select c.pass_percent,c.points into v_pass,v_xp from public.guard_courses c join public.guard_training_attempts a on a.course_id=c.id where a.id=p_attempt;
  v_score := case when v_total=0 then 0 else round((v_correct::numeric/v_total::numeric)*100,2) end;
  v_passed := v_score >= v_pass;
  update public.guard_training_attempts set completed_at=now(),score_percent=v_score,passed=v_passed,xp_earned=case when v_passed then v_xp else 0 end where id=p_attempt;
  return jsonb_build_object('score_percent',v_score,'passed',v_passed,'xp_earned',case when v_passed then v_xp else 0 end);
end;
$function$;
