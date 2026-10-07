-- RLS role-matrix regression for A ONE Guard.
-- Run only after all Guard migrations have been applied.
-- All fixtures and audit rows are rolled back.
begin;

create temporary table rls_results(
  role_name text,
  check_name text,
  actual integer,
  expected integer
) on commit drop;
grant insert,select on rls_results to authenticated;

insert into auth.users(id,email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','rls-owner@example.invalid'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','rls-admin@example.invalid'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','rls-dispatcher@example.invalid'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','rls-employee@example.invalid'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5','rls-outsider@example.invalid');

insert into public.guard_organizations(id,name,slug) values
 ('11111111-1111-4111-8111-111111111111','RLS Test A','rls-test-a'),
 ('22222222-2222-4222-8222-222222222222','RLS Test B','rls-test-b');

insert into public.guard_memberships(org_id,user_id,role,active) values
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','owner',true),
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','admin',true),
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','dispatcher',true),
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','employee',true),
 ('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5','owner',true);

insert into public.guard_employees(id,org_id,user_id,display_name,status) values
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','RLS Employee','active'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','11111111-1111-4111-8111-111111111111',null,'RLS Other Employee','active');

insert into public.guard_sites(id,org_id,name,active) values
 ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','11111111-1111-4111-8111-111111111111','RLS Site A',true),
 ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2','22222222-2222-4222-8222-222222222222','RLS Site B',true);

insert into public.guard_shifts(org_id,site_id,employee_id,title,starts_at,ends_at,status)
values(
 '11111111-1111-4111-8111-111111111111',
 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
 'RLS Shift','2031-01-01 08:00Z','2031-01-01 16:00Z','planned'
);

insert into public.guard_employee_private(employee_id,org_id,city)
values(
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
 '11111111-1111-4111-8111-111111111111',
 'Secret City'
);

insert into public.guard_documents(org_id,employee_id,title,category,storage_path) values
 ('11111111-1111-4111-8111-111111111111','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','Own document','other','rls/own.pdf'),
 ('11111111-1111-4111-8111-111111111111',null,'Company document','other','rls/company.pdf'),
 ('11111111-1111-4111-8111-111111111111','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','Other employee document','other','rls/other.pdf');

insert into public.guard_schedule_import_batches(id,org_id,file_name,total_rows,imported_rows,status,created_by)
values('dddddddd-dddd-4ddd-8ddd-ddddddddddd1','11111111-1111-4111-8111-111111111111','rls.xlsx',1,1,'completed','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1');

set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',true);
insert into rls_results select 'employee','organizations',count(*),1 from public.guard_organizations where id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'employee','memberships',count(*),1 from public.guard_memberships where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'employee','employees',count(*),1 from public.guard_employees where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'employee','sites',count(*),1 from public.guard_sites where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'employee','shifts',count(*),1 from public.guard_shifts where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'employee','private_hr',count(*),0 from public.guard_employee_private where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'employee','documents',count(*),2 from public.guard_documents where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'employee','schedule_import_batches',count(*),0 from public.guard_schedule_import_batches where org_id='11111111-1111-4111-8111-111111111111';
do $employee_import_write$
declare rejected boolean:=false;
begin
  begin
    insert into public.guard_schedule_import_batches(org_id,file_name,total_rows,imported_rows,status,created_by)
    values('11111111-1111-4111-8111-111111111111','forbidden.xlsx',1,1,'completed','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4');
  exception when others then rejected:=true;
  end;
  insert into rls_results values('employee','schedule_import_insert_rejected',case when rejected then 1 else 0 end,1);
end $employee_import_write$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',true);
insert into rls_results select 'dispatcher','memberships',count(*),4 from public.guard_memberships where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'dispatcher','employees',count(*),2 from public.guard_employees where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'dispatcher','private_hr',count(*),0 from public.guard_employee_private where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'dispatcher','documents',count(*),3 from public.guard_documents where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'dispatcher','schedule_import_batches',count(*),1 from public.guard_schedule_import_batches where org_id='11111111-1111-4111-8111-111111111111';
do $dispatcher_import_write$
declare rejected boolean:=false;
begin
  begin
    insert into public.guard_schedule_import_batches(org_id,file_name,total_rows,imported_rows,status,created_by)
    values('11111111-1111-4111-8111-111111111111','forbidden-direct.xlsx',1,1,'completed','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3');
  exception when others then rejected:=true;
  end;
  insert into rls_results values('dispatcher','schedule_import_direct_insert_rejected',case when rejected then 1 else 0 end,1);
end $dispatcher_import_write$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',true);
insert into rls_results select 'admin','memberships',count(*),4 from public.guard_memberships where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'admin','employees',count(*),2 from public.guard_employees where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'admin','private_hr',count(*),1 from public.guard_employee_private where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'admin','documents',count(*),3 from public.guard_documents where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'admin','schedule_import_batches',count(*),1 from public.guard_schedule_import_batches where org_id='11111111-1111-4111-8111-111111111111';

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',true);
insert into rls_results select 'owner','memberships',count(*),4 from public.guard_memberships where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'owner','private_hr',count(*),1 from public.guard_employee_private where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'owner','schedule_import_batches',count(*),1 from public.guard_schedule_import_batches where org_id='11111111-1111-4111-8111-111111111111';

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',true);
insert into rls_results select 'outsider','org_a',count(*),0 from public.guard_organizations where id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'outsider','site_a',count(*),0 from public.guard_sites where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'outsider','employee_a',count(*),0 from public.guard_employees where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'outsider','shift_a',count(*),0 from public.guard_shifts where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'outsider','documents_a',count(*),0 from public.guard_documents where org_id='11111111-1111-4111-8111-111111111111';
insert into rls_results select 'outsider','schedule_import_batches_a',count(*),0 from public.guard_schedule_import_batches where org_id='11111111-1111-4111-8111-111111111111';

reset role;
insert into rls_results values(
 'all','question_keys_select_grant',
 case when has_table_privilege('authenticated','public.guard_question_keys','select') then 1 else 0 end,
 0
);
insert into rls_results values(
 'all','membership_direct_insert_grant',
 case when has_table_privilege('authenticated','public.guard_memberships','insert') then 1 else 0 end,
 0
);
insert into rls_results values(
 'all','membership_direct_update_grant',
 case when has_table_privilege('authenticated','public.guard_memberships','update') then 1 else 0 end,
 0
);
insert into rls_results values(
 'all','membership_direct_delete_grant',
 case when has_table_privilege('authenticated','public.guard_memberships','delete') then 1 else 0 end,
 0
);
insert into rls_results values(
 'all','schedule_import_direct_insert_grant',
 case when has_table_privilege('authenticated','public.guard_schedule_import_batches','insert') then 1 else 0 end,
 0
);
insert into rls_results values(
 'all','schedule_import_direct_update_grant',
 case when has_table_privilege('authenticated','public.guard_schedule_import_batches','update') then 1 else 0 end,
 0
);
insert into rls_results values(
 'all','schedule_import_direct_delete_grant',
 case when has_table_privilege('authenticated','public.guard_schedule_import_batches','delete') then 1 else 0 end,
 0
);

set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',true);
do $membership_rpc$
declare
  rejected boolean:=false;
  changed text;
begin
  begin
    perform public.guard_set_member_role(
      '11111111-1111-4111-8111-111111111111',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'employee'
    );
  exception when others then
    rejected:=true;
  end;
  insert into rls_results values('admin','rpc_owner_role_change_rejected',case when rejected then 1 else 0 end,1);

  changed:=public.guard_set_member_role(
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    'employee'
  );
  insert into rls_results values('admin','rpc_dispatcher_role_change',case when changed='employee' then 1 else 0 end,1);
end
$membership_rpc$;

reset role;
insert into rls_results
select 'all','owner_role_preserved',case when role='owner' then 1 else 0 end,1
from public.guard_memberships
where org_id='11111111-1111-4111-8111-111111111111'
  and user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

do $assert$
begin
  if exists(select 1 from rls_results where actual is distinct from expected) then
    raise exception 'RLS matrix failed: %',
      (select string_agg(role_name||'/'||check_name||'='||actual||' expected '||expected, ', ')
         from rls_results where actual is distinct from expected);
  end if;
end
$assert$;

select jsonb_build_object(
  'status','PASS',
  'checks',(select count(*) from rls_results),
  'matrix',(select jsonb_agg(to_jsonb(r) order by role_name,check_name) from rls_results r)
) as result;

rollback;
