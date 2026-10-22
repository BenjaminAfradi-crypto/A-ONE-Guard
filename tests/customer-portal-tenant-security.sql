-- Customer-portal cross-tenant and inactive-account regressions.
-- Run after migration or splice migration into this BEGIN/ROLLBACK.
-- Synthetic users/companies/customers only. No persistent data changes.
BEGIN;
SET LOCAL statement_timeout='45s';
SET LOCAL lock_timeout='5s';
CREATE TEMP TABLE customer_portal_security_results (
  test_name text, passed boolean, details text
) ON COMMIT DROP;
GRANT SELECT,INSERT ON customer_portal_security_results TO authenticated;

DO $test$
DECLARE
 org_a uuid:=gen_random_uuid();org_b uuid:=gen_random_uuid();
 owner_a uuid:=gen_random_uuid();owner_b uuid:=gen_random_uuid();
 portal_user uuid:=gen_random_uuid();
 ca uuid:=gen_random_uuid(); ca2 uuid:=gen_random_uuid();
 cinactive uuid:=gen_random_uuid(); cb uuid:=gen_random_uuid();
 sa uuid:=gen_random_uuid();sa2 uuid:=gen_random_uuid();sb uuid:=gen_random_uuid();
 ticket_id uuid; msg text; denied boolean; got integer;
BEGIN
 INSERT INTO auth.users(id,email) VALUES
 (owner_a,'customer-a-owner-'||owner_a||'@example.invalid'),
 (owner_b,'customer-b-owner-'||owner_b||'@example.invalid'),
 (portal_user,'customer-portal-'||portal_user||'@example.invalid');
 INSERT INTO public.guard_organizations(id,name,slug) VALUES
 (org_a,'Portal test company A','portal-a-'||org_a),
 (org_b,'Portal test company B','portal-b-'||org_b);
 INSERT INTO public.guard_memberships(org_id,user_id,role,active) VALUES
 (org_a,owner_a,'owner',true),(org_b,owner_b,'owner',true);
 INSERT INTO public.guard_customers(id,org_id,company_name,status) VALUES
 (ca,org_a,'Active A customer','active'),
 (ca2,org_a,'Other A customer','active'),
 (cinactive,org_a,'Inactive A customer','inactive'),
 (cb,org_b,'Active B customer','active');
 INSERT INTO public.guard_sites(id,org_id,customer_id,name,active) VALUES
 (sa,org_a,ca,'Site A',true),
 (sa2,org_a,ca2,'Other customer site',true),
 (sb,org_b,cb,'Site B',true);
 INSERT INTO public.guard_customer_portal_access(org_id,customer_id,user_id,role,active) VALUES
 (org_a,ca,portal_user,'viewer',true),
 (org_a,cinactive,portal_user,'viewer',true);

 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 PERFORM set_config('request.jwt.claim.sub',owner_b::text,true);
 denied:=false;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  INSERT INTO public.guard_customer_portal_access(org_id,customer_id,user_id,role)
  VALUES(org_b,ca,portal_user,'viewer');
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT; RESET ROLE;
  denied := SQLSTATE='23503' OR msg LIKE '%foreign key%';
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('other org cannot grant portal access to foreign customer',denied,coalesce(msg,'unexpected grant'));

 denied:=false;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  INSERT INTO public.guard_customer_tickets(org_id,customer_id,subject,body,created_by)
  VALUES(org_b,ca,'Cross-org ticket','Forbidden cross tenant body',owner_b);
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT; RESET ROLE;
  denied := msg LIKE '%foreign key%';
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('manager cannot create ticket with customer in another org',denied,coalesce(msg,'unexpected ticket'));

 PERFORM set_config('request.jwt.claim.sub',portal_user::text,true);
 ticket_id:=null;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  ticket_id:=public.guard_customer_create_ticket(ca,sa,'Valid portal ticket','Customer reports issue','medium');
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('active customer valid site via RPC succeeds',ticket_id IS NOT NULL,coalesce(msg,'legitimate ticket'));

 denied:=false;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  ticket_id:=public.guard_customer_create_ticket(cinactive,null,'Inactive ticket','This should be denied','medium');
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT; RESET ROLE;
  denied := msg LIKE '%customer portal access not found%';
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('inactive customer RPC ticket rejected',denied,coalesce(msg,'unexpected ticket'));

 denied:=false;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  ticket_id:=public.guard_customer_create_ticket(cb,null,'Unauthorized ticket','No portal grant from B','medium');
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
  denied := msg LIKE '%customer portal access not found%';
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('foreign customer without portal grant rejected',denied,coalesce(msg,'unexpected ticket'));

 denied:=false;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  ticket_id:=public.guard_customer_create_ticket(ca,sb,'Wrong site ticket','Site belongs to org B','medium');
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
  denied := msg LIKE '%invalid site%';
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('RPC rejects site in another tenant',denied,coalesce(msg,'unexpected ticket'));

 denied:=false;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  INSERT INTO public.guard_customer_tickets(org_id,customer_id,site_id,subject,body,created_by)
  VALUES(org_a,ca,sa2,'Other customer site','Different customer same org',portal_user);
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
  denied := msg LIKE '%foreign key%';
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('direct ticket insert cannot attach same-org foreign site',denied,coalesce(msg,'unexpected ticket'));

 denied:=false;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  INSERT INTO public.guard_customer_tickets(org_id,customer_id,subject,body,created_by)
  VALUES(org_a,cinactive,'Inactive insert','Should fail RLS authorization',portal_user);
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
  denied := msg LIKE '%row-level security%';
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('inactive customer direct REST insert rejected by RLS',denied,coalesce(msg,'unexpected ticket'));

 ticket_id:=null;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  INSERT INTO public.guard_customer_tickets(org_id,customer_id,subject,body,created_by)
  VALUES(org_a,ca,'Direct legitimate ticket','Authorized portal user direct insert',portal_user)
  RETURNING id INTO ticket_id;
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('active customer direct REST insert succeeds',ticket_id IS NOT NULL,coalesce(msg,'legitimate insert'));

 got:=null;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO got FROM public.guard_customer_tickets t
  WHERE t.org_id=org_a AND t.customer_id=ca;
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('active customer can read own tickets',got=2,coalesce(msg,'count='||got));

 -- A customer can be disabled while the legacy access row stays active.
 UPDATE public.guard_customers SET status='inactive' WHERE id=ca;
 got:=null;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO got FROM public.guard_customer_tickets t
  WHERE t.org_id=org_a AND t.customer_id=ca;
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('inactive customer direct REST SELECT hides tickets',got=0,coalesce(msg,'count='||got));

 denied:=false;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM public.guard_customer_portal_snapshot(ca,'2031-01-01','2031-02-01');
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
  denied:=msg LIKE '%customer portal access not found%';
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('inactive customer portal snapshot denied',denied,coalesce(msg,'unexpected snapshot'));

 PERFORM set_config('request.jwt.claim.sub',owner_a::text,true);
 got:=null;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO got FROM public.guard_customer_tickets t
  WHERE t.org_id=org_a AND t.customer_id=ca;
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('org manager retains access to historic inactive customer tickets',got=2,coalesce(msg,'count='||got));

 PERFORM set_config('request.jwt.claim.sub',owner_b::text,true);
 ticket_id:=null;msg:=null;
 BEGIN
  SET LOCAL ROLE authenticated;
  INSERT INTO public.guard_customer_tickets(org_id,customer_id,site_id,subject,body,created_by)
  VALUES(org_b,cb,sb,'Valid manager ticket','Authorized organization B ticket',owner_b)
  RETURNING id INTO ticket_id;
  RESET ROLE;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;RESET ROLE;
 END;
 INSERT INTO customer_portal_security_results VALUES
 ('manager own org direct insert succeeds',ticket_id IS NOT NULL,coalesce(msg,'legitimate manager insert'));
END
$test$;

DO $assert$
BEGIN
  IF (SELECT count(*) FROM customer_portal_security_results)<>14
    OR EXISTS(SELECT 1 FROM customer_portal_security_results WHERE passed IS DISTINCT FROM true)
  THEN RAISE EXCEPTION 'customer security regression failure: %',
    (SELECT string_agg(test_name||' => '||coalesce(details,'null'),'; ')
     FROM customer_portal_security_results WHERE passed IS DISTINCT FROM true);
  END IF;
END
$assert$;
SELECT 'PASS' AS status,count(*) AS checks FROM customer_portal_security_results;
ROLLBACK;
