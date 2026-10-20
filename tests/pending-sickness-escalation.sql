-- Run ONLY after the pending-sickness escalation migration has been applied
-- on an isolated test database or when deliberately wrapping both files
-- in one transaction. These fixtures use fake identifiers and roll back.
begin;
set local statement_timeout='30s';
set local lock_timeout='5s';
do $verify$
declare
  org uuid:=gen_random_uuid(); usr uuid:=gen_random_uuid();
  emp uuid:=gen_random_uuid(); site uuid:=gen_random_uuid();
  leave_id uuid:=gen_random_uuid(); next_leave uuid:=gen_random_uuid();
  second_site uuid:=gen_random_uuid(); cnt int; total int; st text; title text;
begin
  insert into auth.users(id,email) values(usr,'pilot-pending-'||usr||'@example.invalid');
  insert into public.guard_organizations(id,name,slug)
  values(org,'Pilot alert test','test-'||org);
  insert into public.guard_memberships(org_id,user_id,role)
  values(org,usr,'owner');
  insert into public.guard_employees(id,org_id,user_id,display_name,status)
  values(emp,org,usr,'Synthetic employee','active');
  insert into public.guard_sites(id,org_id,name,active)
  values(site,org,'Synthetic site',true);
  perform set_config('request.jwt.claim.sub',usr::text,true);
  insert into public.guard_shifts(org_id,site_id,employee_id,title,starts_at,ends_at,status)
  values(org,site,emp,'Pre-existing confirmed shift',
         '2031-03-18 08:00+01','2031-03-18 16:00+01','confirmed');
  insert into public.guard_leave_requests(id,org_id,employee_id,kind,starts_on,ends_on,status)
  values(leave_id,org,emp,'sick','2031-03-18','2031-03-18','pending');

  select count(*),max(e.title) into cnt,title from public.guard_escalations e
  where e.org_id=org and e.source_type='absence' and e.source_id=leave_id and e.status<>'resolved';
  if cnt<>1 or title<>'Besetzungsrisiko: offene Krankmeldung' then raise exception 'pending alert missing'; end if;

  update public.guard_escalations set status='acknowledged'
  where org_id=org and source_id=leave_id;
  update public.guard_leave_requests set status='approved' where id=leave_id;
  select count(*),max(status) into cnt,st from public.guard_escalations
  where org_id=org and source_id=leave_id and status<>'resolved';
  if cnt<>1 or st<>'acknowledged' then raise exception 'approved: duplicate or acknowledgement lost'; end if;

  update public.guard_leave_requests set starts_on='2031-03-20',ends_on='2031-03-20' where id=leave_id;
  select count(*) into cnt from public.guard_escalations
  where org_id=org and source_id=leave_id and status<>'resolved';
  if cnt<>0 then raise exception 'moving leave did not close warning'; end if;

  update public.guard_leave_requests set starts_on='2031-03-18',ends_on='2031-03-18' where id=leave_id;
  select count(*),max(status) into total,st from public.guard_escalations
  where org_id=org and source_id=leave_id;
  if total<>1 or st<>'open' then raise exception 'restored leave did not reactivate unique warning'; end if;

  update public.guard_leave_requests set status='rejected' where id=leave_id;
  select count(*) into cnt from public.guard_escalations
  where org_id=org and source_id=leave_id and status<>'resolved';
  if cnt<>0 then raise exception 'reject left stale warning'; end if;

  update public.guard_leave_requests set kind='vacation',status='approved' where id=leave_id;
  select count(*) into cnt from public.guard_escalations
  where org_id=org and source_id=leave_id and status<>'resolved';
  if cnt<>1 then raise exception 'approved vacation regressed'; end if;

  update public.guard_leave_requests set status='approved' where id=leave_id;
  select count(*) into cnt from public.guard_escalations
  where org_id=org and source_id=leave_id;
  if cnt<>1 then raise exception 'repeated status created duplicate'; end if;

  update public.guard_leave_requests set status='canceled' where id=leave_id;
  select count(*) into cnt from public.guard_escalations
  where org_id=org and source_id=leave_id and status<>'resolved';
  if cnt<>0 then raise exception 'cancel left stale warning'; end if;

  -- A leave can affect multiple sites, but uniqueness requires one alert
  -- that summarizes the count and points at the earliest impacted shift.
  insert into public.guard_sites(id,org_id,name,active)
  values(second_site,org,'Second synthetic site',true);
  insert into public.guard_shifts(org_id,site_id,employee_id,title,starts_at,ends_at,status)
  values(org,second_site,emp,'Second shift next day',
         '2031-03-19 08:00+01','2031-03-19 16:00+01','confirmed');
  insert into public.guard_leave_requests(id,org_id,employee_id,kind,starts_on,ends_on,status)
  values(next_leave,org,emp,'sick','2031-03-18','2031-03-19','pending');
  select count(*),max(site_id::text),max(description) into cnt,st,title
  from public.guard_escalations
  where org_id=org and source_type='absence' and source_id=next_leave;
  if cnt<>1 or st<>site::text or title not like '%2 geplante Dienste%' then
    raise exception 'multi-site alert must summarize two shifts at the first site';
  end if;

  update public.guard_leave_requests
  set starts_on='2031-03-19',ends_on='2031-03-19' where id=next_leave;
  select count(*),max(site_id::text),max(description) into cnt,st,title
  from public.guard_escalations
  where org_id=org and source_type='absence' and source_id=next_leave
    and status<>'resolved';
  if cnt<>1 or st<>second_site::text or title not like '%1 geplante Dienste%' then
    raise exception 'moving pending leave must update site and shift count';
  end if;

  update public.guard_leave_requests
  set kind='vacation' where id=next_leave;
  select count(*) into cnt from public.guard_escalations
  where org_id=org and source_id=next_leave and status<>'resolved';
  if cnt<>0 then raise exception 'pending vacation must not keep sickness warning'; end if;

  update public.guard_leave_requests set status='approved' where id=next_leave;
  select count(*) into cnt from public.guard_escalations
  where org_id=org and source_id=next_leave and status<>'resolved';
  if cnt<>1 then raise exception 'approved vacation must restore staffing alert'; end if;
end
$verify$;
select 'PASS: 12 escalation lifecycle scenarios; all fixtures rolled back' as result;
rollback;
