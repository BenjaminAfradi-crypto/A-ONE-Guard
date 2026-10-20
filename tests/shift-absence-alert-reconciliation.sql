-- Database-integrity regression. Synthetic fixtures rollback at end.
-- Run after applying guard_shift_absence_alert_reconcile migration.
begin;
set local statement_timeout='30s';
set local lock_timeout='5s';
do $test$
declare
  o uuid:=gen_random_uuid(); u uuid:=gen_random_uuid();
  e uuid:=gen_random_uuid(); e2 uuid:=gen_random_uuid();
  a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
  s1 uuid:=gen_random_uuid(); s2 uuid:=gen_random_uuid();
  s3 uuid:=gen_random_uuid(); s4 uuid:=gen_random_uuid();
  s5 uuid:=gen_random_uuid();
  l1 uuid:=gen_random_uuid(); l2 uuid:=gen_random_uuid();
  l3 uuid:=gen_random_uuid(); l4 uuid:=gen_random_uuid();
  n int; st text; site uuid; v_desc text; ack uuid;
begin
  insert into auth.users(id,email) values(u,'cancel-shift-'||u||'@example.invalid');
  insert into public.guard_organizations(id,name,slug)
  values(o,'Shift reconciliation test','test-'||o);
  insert into public.guard_memberships(org_id,user_id,role)
  values(o,u,'owner');
  insert into public.guard_employees(id,org_id,user_id,display_name,status)
  values(e,o,u,'Primary employee','active'),
        (e2,o,null,'Replacement employee','active');
  insert into public.guard_sites(id,org_id,name,active)
  values(a,o,'First test site',true),(b,o,'Second test site',true);
  perform set_config('request.jwt.claim.sub',u::text,true);

  -- The alert begins with two existing duties at different sites.
  insert into public.guard_shifts(id,org_id,site_id,employee_id,title,starts_at,ends_at,status)
  values (s1,o,a,e,'Planned day 1','2031-03-18 08:00+01','2031-03-18 16:00+01','confirmed'),
         (s2,o,b,e,'Planned day 2','2031-03-20 08:00+01','2031-03-20 16:00+01','confirmed');
  insert into public.guard_leave_requests(id,org_id,employee_id,kind,starts_on,ends_on,status)
  values(l1,o,e,'sick','2031-03-18','2031-03-20','pending');
  select count(*),max(description) into n,v_desc from public.guard_escalations
  where source_type='absence' and source_id=l1 and status='open';
  if n<>1 or v_desc not like '%2 geplante Dienste%' then
    raise exception 'initial two-shift alarm absent'; end if;

  update public.guard_escalations set status='acknowledged',acknowledged_by=u,
       acknowledged_at=now() where source_id=l1;
  update public.guard_shifts set status='canceled' where id=s1;

  select count(*) into n from public.guard_escalations
   where source_type='absence' and source_id=l1 and status<>'resolved';
  select status,site_id,description,acknowledged_by
    into st,site,v_desc,ack from public.guard_escalations
   where source_type='absence' and source_id=l1 and status<>'resolved'
   limit 1;
  if n<>1 or st<>'acknowledged' or site<>b or ack<>u
     or description not like '%1 geplante Dienste%' then
    raise exception 'cancellation failed to preserve remaining risk and acknowledgement';
  end if;

  -- The last canceled shift must immediately close the alarm.
  update public.guard_shifts set status='canceled' where id=s2;
  select count(*),max(status) into n,st from public.guard_escalations where source_id=l1;
  if n<>1 or st<>'resolved' then raise exception 'last cancellation did not resolve risk'; end if;

  -- Moving a shift outside the leave date must resolve the risk.
  insert into public.guard_shifts(id,org_id,site_id,employee_id,title,starts_at,ends_at,status)
  values(s3,o,a,e,'Change day','2031-04-10 08:00+02','2031-04-10 16:00+02','confirmed');
  insert into public.guard_leave_requests(id,org_id,employee_id,kind,starts_on,ends_on,status)
  values(l2,o,e,'sick','2031-04-10','2031-04-10','pending');
  update public.guard_shifts set starts_at='2031-04-12 08:00+02',
                                  ends_at='2031-04-12 16:00+02' where id=s3;
  select status into st from public.guard_escalations where source_id=l2;
  if st<>'resolved' then raise exception 'move outside leave did not close risk'; end if;

  -- Assigning a previously warned shift to another employee must close risk.
  insert into public.guard_shifts(id,org_id,site_id,employee_id,title,starts_at,ends_at,status)
  values(s4,o,a,e,'Reassigned','2031-05-10 08:00+02','2031-05-10 16:00+02','confirmed');
  insert into public.guard_leave_requests(id,org_id,employee_id,kind,starts_on,ends_on,status)
  values(l3,o,e,'sick','2031-05-10','2031-05-10','pending');
  update public.guard_shifts set employee_id=e2 where id=s4;
  select status into st from public.guard_escalations where source_id=l3;
  if st<>'resolved' then raise exception 'reassignment did not close original alert'; end if;

  -- A site change must correct the alert without discarding acknowledgement.
  insert into public.guard_shifts(id,org_id,site_id,employee_id,title,starts_at,ends_at,status)
  values(s5,o,a,e,'Change site','2031-06-10 08:00+02','2031-06-10 16:00+02','confirmed');
  insert into public.guard_leave_requests(id,org_id,employee_id,kind,starts_on,ends_on,status)
  values(l4,o,e,'vacation','2031-06-10','2031-06-10','approved');
  update public.guard_escalations set status='acknowledged',acknowledged_by=u
  where source_id=l4;
  update public.guard_shifts set site_id=b where id=s5;
  select status,site_id into st,site from public.guard_escalations where source_id=l4;
  if st<>'acknowledged' or site<>b then
    raise exception 'site update changed acknowledgement or did not update site'; end if;

  -- Delete has the same lifecycle effect as cancellation.
  delete from public.guard_shifts where id=s5;
  select status into st from public.guard_escalations where source_id=l4;
  if st<>'resolved' then raise exception 'delete did not close risk'; end if;

  -- No duplicate alerts from repeated updates.
  select count(*) into n from public.guard_escalations
  where source_type='absence' and source_id in (l1,l2,l3,l4);
  if n<>4 then raise exception 'duplicates or missing unique alerts: %',n; end if;
end
$test$;
select 'PASS: 7 shift change/cancellation regressions; fixtures rolled back' as result;
rollback;
