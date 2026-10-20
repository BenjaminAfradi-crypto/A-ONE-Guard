-- Regressions for suspended account RPC authorization.
-- Execute only after applying corresponding migration to test/staging, or
-- combine migration+this test inside a single BEGIN/ROLLBACK transaction.
BEGIN;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
CREATE TEMP TABLE rpc_audit_results (
  scenario text, actual integer, expected integer, details text
) ON COMMIT DROP;
GRANT SELECT,INSERT ON rpc_audit_results TO authenticated;

DO $verify$
DECLARE
  v_org uuid:=gen_random_uuid();
  v_second_org uuid:=gen_random_uuid();
  v_suspended uuid:=gen_random_uuid();
  v_active uuid:=gen_random_uuid();
  v_fresh uuid:=gen_random_uuid();
  v_result jsonb;
  v_created uuid;
  v_denied boolean;
  v_error text;
BEGIN
  INSERT INTO auth.users(id,email)
  VALUES(v_suspended,'rpc-suspended-'||v_suspended||'@example.invalid'),
        (v_active,'rpc-active-'||v_active||'@example.invalid'),
        (v_fresh,'rpc-fresh-'||v_fresh||'@example.invalid');
  INSERT INTO public.guard_organizations(id,name,slug)
  VALUES(v_org,'RPC audit primary tenant','rpc-audit-'||v_org),
        (v_second_org,'RPC audit former tenant','rpc-audit-'||v_second_org);
  INSERT INTO public.guard_memberships(org_id,user_id,role,active)
  VALUES(v_org,v_suspended,'employee',false),
        (v_org,v_active,'employee',true),
        (v_second_org,v_active,'employee',false);
  INSERT INTO public.guard_employees(org_id,user_id,display_name,status,hourly_rate_cents)
  VALUES(v_org,v_suspended,'Suspended employee','active',1987),
        (v_org,v_active,'Active employee','active',2450),
        (v_second_org,v_active,'Inactive tenant employee','active',9999);

  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  PERFORM set_config('request.jwt.claim.sub',v_suspended::text,true);

  v_denied:=false;
  BEGIN
    SET LOCAL ROLE authenticated;
    v_result:=public.guard_my_month_summary('2031-03-01');
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error=MESSAGE_TEXT;
    RESET ROLE;
    v_denied:=true;
  END;
  INSERT INTO rpc_audit_results VALUES
    ('suspended salary summary denied',case when v_denied then 1 else 0 end,1,
     case when v_denied then left(v_error,90) else 'unexpected response' end);

  v_denied:=false;
  BEGIN
    SET LOCAL ROLE authenticated;
    v_created:=public.guard_create_organization('Suspension bypass attempt');
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error=MESSAGE_TEXT;
    RESET ROLE;
    v_denied:=true;
  END;
  INSERT INTO rpc_audit_results VALUES
    ('suspended tenant creation denied',case when v_denied then 1 else 0 end,1,
     case when v_denied then left(v_error,90) else 'unexpected tenant' end);

  PERFORM set_config('request.jwt.claim.sub',v_active::text,true);
  BEGIN
    SET LOCAL ROLE authenticated;
    v_result:=public.guard_my_month_summary('2031-03-01');
    RESET ROLE;
    INSERT INTO rpc_audit_results VALUES
      ('active salary summary allowed',case when (v_result->>'hourly_rate_cents')::integer=2450 then 1 else 0 end,1,
       'active tenant only; excludes inactive second organization');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error=MESSAGE_TEXT;
    RESET ROLE;
    INSERT INTO rpc_audit_results VALUES('active salary summary allowed',0,1,left(v_error,90));
  END;

  BEGIN
    SET LOCAL ROLE authenticated;
    v_created:=public.guard_create_organization('Second Legitimate Company');
    RESET ROLE;
    INSERT INTO rpc_audit_results VALUES
      ('active account additional tenant',case when v_created is not null then 1 else 0 end,1,
       'multi-tenant owner creation still permitted');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error=MESSAGE_TEXT;
    RESET ROLE;
    INSERT INTO rpc_audit_results VALUES('active account additional tenant',0,1,left(v_error,90));
  END;

  PERFORM set_config('request.jwt.claim.sub',v_fresh::text,true);
  BEGIN
    SET LOCAL ROLE authenticated;
    v_created:=public.guard_create_organization('Brand New Legitimate Company');
    RESET ROLE;
    INSERT INTO rpc_audit_results VALUES
      ('fresh user onboarding allowed',case when v_created is not null then 1 else 0 end,1,
       'no memberships before signup');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error=MESSAGE_TEXT;
    RESET ROLE;
    INSERT INTO rpc_audit_results VALUES('fresh user onboarding allowed',0,1,left(v_error,90));
  END;
END
$verify$;
DO $assert$
BEGIN
  IF (select count(*) from rpc_audit_results)<>5
     or EXISTS(select 1 from rpc_audit_results where actual is distinct from expected)
  THEN RAISE EXCEPTION 'RPC security checks failed: %',
    (select string_agg(scenario||' => '||actual||' expected '||expected||' ('||coalesce(details,'')||')','; ')
     from rpc_audit_results where actual is distinct from expected);
  END IF;
END
$assert$;
SELECT 'PASS' AS status,count(*) AS checks FROM rpc_audit_results;
ROLLBACK;
