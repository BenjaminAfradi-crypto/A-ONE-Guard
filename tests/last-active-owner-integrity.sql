-- Proves at least one active owner survives role and access mutations.
-- Execute with migration in one transaction or after migration on staging.
-- No real customers/accounts: synthetic fixtures and full ROLLBACK.
BEGIN;
SET LOCAL statement_timeout='30s';
SET LOCAL lock_timeout='5s';
CREATE TEMP TABLE owner_integrity_results(
  scenario text, passed boolean, details text
) ON COMMIT DROP;
GRANT SELECT,INSERT ON owner_integrity_results TO authenticated;

DO $test$
DECLARE
  o uuid:=gen_random_uuid();
  owner1 uuid:=gen_random_uuid();
  disabled_owner uuid:=gen_random_uuid();
  admin1 uuid:=gen_random_uuid();
  worker uuid:=gen_random_uuid();
  outsider uuid:=gen_random_uuid();
  response text;
  msg text;
  flagged boolean;
  owner_count integer;
BEGIN
  INSERT INTO auth.users(id,email) VALUES
    (owner1,'owner-active-'||owner1||'@example.invalid'),
    (disabled_owner,'owner-disabled-'||disabled_owner||'@example.invalid'),
    (admin1,'owner-admin-'||admin1||'@example.invalid'),
    (worker,'owner-worker-'||worker||'@example.invalid'),
    (outsider,'owner-outsider-'||outsider||'@example.invalid');
  INSERT INTO public.guard_organizations(id,name,slug)
  VALUES(o,'Owner integrity fixture','owner-integrity-'||o);
  INSERT INTO public.guard_memberships(org_id,user_id,role,active)
  VALUES(o,owner1,'owner',true),
        (o,disabled_owner,'owner',false),
        (o,admin1,'admin',true),
        (o,worker,'employee',true);

  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  PERFORM set_config('request.jwt.claim.sub',owner1::text,true);

  flagged:=false; msg:=null;
  BEGIN
    SET LOCAL ROLE authenticated;
    response:=public.guard_set_member_role(o,owner1,'admin');
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
    RESET ROLE;
    flagged := msg LIKE '%last owner%';
  END;
  INSERT INTO owner_integrity_results VALUES
    ('cannot demote sole active owner while other owner inactive',
     flagged AND (SELECT role='owner' FROM public.guard_memberships WHERE org_id=o AND user_id=owner1),
     coalesce(msg,'unexpected demotion'));
  
  flagged:=false; msg:=null;
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM public.guard_set_member_active(o,owner1,false);
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
    RESET ROLE;
    flagged := msg LIKE '%cannot suspend your own access%';
  END;
  INSERT INTO owner_integrity_results VALUES
    ('owner cannot self-suspend',flagged,coalesce(msg,'unexpected suspension'));

  flagged:=false; msg:=null;
  PERFORM set_config('request.jwt.claim.sub',outsider::text,true);
  BEGIN
    SET LOCAL ROLE authenticated;
    response:=public.guard_set_member_role(o,worker,'owner');
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
    RESET ROLE;
    flagged:=msg LIKE '%not allowed%';
  END;
  INSERT INTO owner_integrity_results VALUES
    ('outsider cannot change owner role',flagged,coalesce(msg,'unexpected role change'));

  flagged:=false; msg:=null;
  PERFORM set_config('request.jwt.claim.sub',admin1::text,true);
  BEGIN
    SET LOCAL ROLE authenticated;
    response:=public.guard_set_member_role(o,worker,'owner');
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
    RESET ROLE;
    flagged:=msg LIKE '%admin cannot%';
  END;
  INSERT INTO owner_integrity_results VALUES
    ('admin cannot promote new owner',flagged,coalesce(msg,'unexpected role change'));

  PERFORM set_config('request.jwt.claim.sub',owner1::text,true);
  SET LOCAL ROLE authenticated;
  response:=public.guard_set_member_role(o,worker,'owner');
  RESET ROLE;
  INSERT INTO owner_integrity_results VALUES
    ('current owner may appoint second active owner',
     response='owner' AND
      (SELECT role='owner' FROM public.guard_memberships WHERE org_id=o AND user_id=worker),
      'owner promotion');

  SET LOCAL ROLE authenticated;
  response:=public.guard_set_member_role(o,owner1,'admin');
  RESET ROLE;
  SELECT count(*) INTO owner_count FROM public.guard_memberships
  WHERE org_id=o AND role='owner' AND active=true;
  INSERT INTO owner_integrity_results VALUES
    ('original owner may step down only with another active owner',
     response='admin' AND owner_count=1,
     'count active owners: '||owner_count);

  PERFORM set_config('request.jwt.claim.sub',worker::text,true);
  flagged:=false; msg:=null;
  BEGIN
    SET LOCAL ROLE authenticated;
    response:=public.guard_set_member_role(o,worker,'admin');
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
    RESET ROLE;
    flagged:=msg LIKE '%last owner%';
  END;
  INSERT INTO owner_integrity_results VALUES
    ('new last active owner also protected from demotion',flagged,coalesce(msg,'unexpected demotion'));

  flagged:=false; msg:=null;
  PERFORM set_config('request.jwt.claim.sub',admin1::text,true);
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM public.guard_set_member_active(o,worker,false);
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
    RESET ROLE;
    flagged:=msg LIKE '%admin cannot%';
  END;
  INSERT INTO owner_integrity_results VALUES
    ('admin cannot suspend owner',flagged,coalesce(msg,'unexpected suspension'));

  PERFORM set_config('request.jwt.claim.sub',worker::text,true);
  SET LOCAL ROLE authenticated;
  PERFORM public.guard_set_member_active(o,admin1,false);
  RESET ROLE;
  INSERT INTO owner_integrity_results VALUES
    ('owner can suspend administrator',
    (SELECT NOT active FROM public.guard_memberships WHERE org_id=o AND user_id=admin1),'disabled admin');

  SET LOCAL ROLE authenticated;
  PERFORM public.guard_set_member_active(o,admin1,true);
  RESET ROLE;
  INSERT INTO owner_integrity_results VALUES
    ('owner can reactivate administrator',
    (SELECT active FROM public.guard_memberships WHERE org_id=o AND user_id=admin1),'enabled admin');

  SELECT count(*) INTO owner_count FROM public.guard_memberships
  WHERE org_id=o AND role='owner' AND active=true;
  INSERT INTO owner_integrity_results VALUES
    ('active owner invariant holds after all mutations',
     owner_count=1,'count='||owner_count);
END $test$;

DO $assert$
BEGIN
  IF (SELECT count(*) FROM owner_integrity_results)<>11
  OR EXISTS (SELECT 1 FROM owner_integrity_results WHERE NOT passed OR passed IS NULL)
  THEN RAISE EXCEPTION 'Owner integrity assertions failed: %',
    (SELECT string_agg(scenario||': '||coalesce(details,'null'),'; ')
    FROM owner_integrity_results WHERE passed IS DISTINCT FROM true);
  END IF;
END $assert$;

SELECT 'PASS' status,count(*) checks FROM owner_integrity_results;
ROLLBACK;
