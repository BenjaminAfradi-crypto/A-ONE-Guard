-- Regression for guard_private.employee_id_for membership gating.
-- Use against staging after the migration or combine migration + this test
-- within the same transaction. Synthetic tenants/users; full ROLLBACK.
BEGIN;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
CREATE TEMP TABLE member_helper_results(
  scenario text, actual integer, expected integer, detail text
) ON COMMIT DROP;
GRANT INSERT,SELECT ON member_helper_results TO authenticated;
DO $test$
DECLARE
  org_a uuid:=gen_random_uuid();org_b uuid:=gen_random_uuid();
  site_a uuid:=gen_random_uuid();
  active_uid uuid:=gen_random_uuid();
  suspended_uid uuid:=gen_random_uuid();
  inactive_uid uuid:=gen_random_uuid();
  outsider_uid uuid:=gen_random_uuid();
  active_emp uuid:=gen_random_uuid();
  suspended_emp uuid:=gen_random_uuid();
  inactive_emp uuid:=gen_random_uuid();
  second_org_emp uuid:=gen_random_uuid();
  active_shift uuid:=gen_random_uuid();
  suspended_shift uuid:=gen_random_uuid();
  result_id uuid; denied boolean; err text;
BEGIN
 INSERT INTO auth.users(id,email) VALUES
   (active_uid,'helper-active-'||active_uid||'@example.invalid'),
   (suspended_uid,'helper-suspended-'||suspended_uid||'@example.invalid'),
   (inactive_uid,'helper-inactive-'||inactive_uid||'@example.invalid'),
   (outsider_uid,'helper-outsider-'||outsider_uid||'@example.invalid');
 INSERT INTO public.guard_organizations(id,name,slug) VALUES
   (org_a,'Helper tenant A','helper-a-'||org_a),
   (org_b,'Helper tenant B','helper-b-'||org_b);
 INSERT INTO public.guard_memberships(org_id,user_id,role,active) VALUES
   (org_a,active_uid,'employee',true),
   (org_a,suspended_uid,'employee',true),
   (org_b,suspended_uid,'employee',true),
   (org_a,inactive_uid,'employee',true);
 INSERT INTO public.guard_employees(id,org_id,user_id,display_name,status) VALUES
   (active_emp,org_a,active_uid,'Active fixture','active'),
   (suspended_emp,org_a,suspended_uid,'Suspended fixture','active'),
   (second_org_emp,org_b,suspended_uid,'Other tenant fixture','active'),
   (inactive_emp,org_a,inactive_uid,'Inactive fixture','active');
 INSERT INTO public.guard_sites(id,org_id,name,active)
 VALUES(site_a,org_a,'Helper test site',true);
 INSERT INTO public.guard_shifts(id,org_id,site_id,employee_id,title,starts_at,ends_at,status)
 VALUES
   (active_shift,org_a,site_a,active_emp,'Authorized shift','2031-07-10 08:00+02','2031-07-10 16:00+02','planned'),
   (suspended_shift,org_a,site_a,suspended_emp,'Suspended shift','2031-07-10 08:00+02','2031-07-10 16:00+02','planned');

 UPDATE public.guard_memberships SET active=false WHERE org_id=org_a AND user_id=suspended_uid;
 UPDATE public.guard_employees SET status='inactive' WHERE id=inactive_emp;

 INSERT INTO member_helper_results VALUES
  ('active employee resolves',
     case when guard_private.employee_id_for(org_a,active_uid)=active_emp then 1 else 0 end,1,
     'active member and employee'),
  ('suspended tenant does not resolve',
     case when guard_private.employee_id_for(org_a,suspended_uid) is null then 1 else 0 end,1,
     'user remains active in another organization'),
  ('active second tenant resolves',
     case when guard_private.employee_id_for(org_b,suspended_uid)=second_org_emp then 1 else 0 end,1,
     'tenant scoped'),
  ('inactive employee denied',
     case when guard_private.employee_id_for(org_a,inactive_uid) is null then 1 else 0 end,1,
     'membership active but employee inactive'),
  ('outsider does not resolve',
     case when guard_private.employee_id_for(org_a,outsider_uid) is null then 1 else 0 end,1,
     'no membership or employee profile');

 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 PERFORM set_config('request.jwt.claim.sub',suspended_uid::text,true);
 denied:=false;
 BEGIN
   SET LOCAL ROLE authenticated;
   result_id:=public.guard_request_shift_swap(suspended_shift,null,'Forbidden from suspended tenant');
   RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS err=MESSAGE_TEXT;
   RESET ROLE;
   denied:=true;
 END;
 INSERT INTO member_helper_results VALUES
 ('suspended shift swap denied',case when denied then 1 else 0 end,1,
  case when denied then left(err,90) else 'unexpected swap created' end);

 PERFORM set_config('request.jwt.claim.sub',active_uid::text,true);
 BEGIN
   SET LOCAL ROLE authenticated;
   result_id:=public.guard_request_shift_swap(active_shift,null,'Legitimate swap');
   RESET ROLE;
   INSERT INTO member_helper_results VALUES
   ('active shift swap allowed',case when result_id is not null then 1 else 0 end,1,'active employee flow');
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS err=MESSAGE_TEXT;
   RESET ROLE;
   INSERT INTO member_helper_results VALUES ('active shift swap allowed',0,1,left(err,90));
 END;

 UPDATE public.guard_memberships SET active=true WHERE org_id=org_a AND user_id=suspended_uid;
 INSERT INTO member_helper_results VALUES
  ('reactivated employee resolves',
   case when guard_private.employee_id_for(org_a,suspended_uid)=suspended_emp then 1 else 0 end,1,
   'restored membership without new employee record');
 PERFORM set_config('request.jwt.claim.sub',suspended_uid::text,true);
 BEGIN
   SET LOCAL ROLE authenticated;
   result_id:=public.guard_request_shift_swap(suspended_shift,null,'Legitimate after reactivation');
   RESET ROLE;
   INSERT INTO member_helper_results VALUES
   ('restored shift swap allowed',case when result_id is not null then 1 else 0 end,1,
   'permission restored after membership reactivated');
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS err=MESSAGE_TEXT;
   RESET ROLE;
   INSERT INTO member_helper_results VALUES('restored shift swap allowed',0,1,left(err,90));
 END;
END
$test$;
DO $assert$
BEGIN
  IF (select count(*) from member_helper_results)<>9
     or exists(select 1 from member_helper_results where actual is distinct from expected)
  THEN raise exception 'employee_id_for authorization failed: %',
    (select string_agg(scenario||' => '||actual||' expected '||expected||' ('||coalesce(detail,'')||')','; ')
     from member_helper_results where actual is distinct from expected);
  END IF;
END
$assert$;
SELECT 'PASS' AS status, count(*) AS checks FROM member_helper_results;
ROLLBACK;
