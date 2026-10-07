-- Run on the existing Guard database with a management connection.
-- All synthetic fixtures and their audit records are rolled back.
begin;
do $test$
declare
 a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); worker_user uuid:=gen_random_uuid();
 e uuid:=gen_random_uuid(); worker_e uuid:=gen_random_uuid(); site uuid:=gen_random_uuid(); inactive_site uuid:=gen_random_uuid(); foreign_site uuid:=gen_random_uuid();
 template uuid:=gen_random_uuid(); task uuid:=gen_random_uuid(); session_id uuid:=gen_random_uuid(); import_shift uuid:=gen_random_uuid(); import_batch uuid:=gen_random_uuid(); rejected boolean; tag jsonb; first_result jsonb; repeat_result jsonb; revert_result jsonb; request_id uuid:=gen_random_uuid();
begin
 insert into auth.users(id,email) values(u,'guard-test-'||u||'@example.invalid'),(outsider,'guard-test-'||outsider||'@example.invalid'),(worker_user,'guard-test-'||worker_user||'@example.invalid');
 insert into public.guard_organizations(id,name,slug) values(a,'Synthetic test A','test-'||a),(b,'Synthetic test B','test-'||b);
 insert into public.guard_memberships(org_id,user_id,role) values(a,u,'owner'),(a,worker_user,'employee');
 insert into public.guard_employees(id,org_id,user_id,display_name,status) values(e,a,u,'Synthetic owner worker','active'),(worker_e,a,worker_user,'Synthetic employee','active');
 insert into public.guard_sites(id,org_id,name,active) values(site,a,'Synthetic site',true),(inactive_site,a,'Inactive synthetic site',false),(foreign_site,b,'Foreign synthetic site',true);
 perform set_config('request.jwt.claim.sub',u::text,true);
 update public.guard_organizations set min_rest_minutes=660 where id=a;
 insert into public.guard_shifts(org_id,site_id,employee_id,title,starts_at,ends_at) values(a,site,e,'Test','2030-01-01 08:00Z','2030-01-01 16:00Z');
 rejected:=false;
 begin
  insert into public.guard_shifts(org_id,site_id,employee_id,title,starts_at,ends_at) values(a,site,e,'Overlap','2030-01-01 15:00Z','2030-01-01 18:00Z');
 exception when others then rejected:=true;
 end;
 if not rejected then raise exception 'FAIL overlapping shift was accepted'; end if;
 rejected:=false;
 begin
  insert into public.guard_shifts(org_id,site_id,employee_id,title,starts_at,ends_at) values(a,site,e,'Rest too short','2030-01-02 02:59Z','2030-01-02 04:00Z');
 exception when others then rejected:=true;
 end;
 if not rejected then raise exception 'FAIL 10h59 rest period was accepted'; end if;
 insert into public.guard_shifts(org_id,site_id,employee_id,title,starts_at,ends_at) values(a,site,e,'Rest boundary','2030-01-02 03:00Z','2030-01-02 04:00Z');
 if not exists(select 1 from pg_constraint where conrelid='public.guard_shifts'::regclass and conname='guard_shifts_no_employee_overlap' and contype='x') then raise exception 'FAIL atomic exclusion constraint missing'; end if;
 insert into public.guard_shifts(id,org_id,site_id,employee_id,title,starts_at,ends_at,status,created_by)
 values(import_shift,a,site,e,'Imported shift','2030-01-04 08:00Z','2030-01-04 16:00Z','planned',u);
 insert into public.guard_schedule_import_batches(id,org_id,file_name,total_rows,imported_rows,created_shift_ids,status,created_by)
 values(import_batch,a,'synthetic.xlsx',1,1,array[import_shift],'completed',u);
 revert_result:=public.guard_revert_schedule_import(import_batch);
 if coalesce((revert_result->>'reverted_shifts')::integer,0)<>1 then raise exception 'FAIL schedule import revert count'; end if;
 if (select status from public.guard_shifts where id=import_shift)<>'canceled' then raise exception 'FAIL imported shift was not canceled on revert'; end if;
 if (select status from public.guard_schedule_import_batches where id=import_batch)<>'reverted' then raise exception 'FAIL import batch was not marked reverted'; end if;
 rejected:=false;begin perform public.guard_revert_schedule_import(import_batch);exception when others then rejected:=true;end;
 if not rejected then raise exception 'FAIL schedule import was reverted twice'; end if;
 rejected:=false;
 begin
  insert into public.guard_shifts(org_id,site_id,title,starts_at,ends_at,status) values(a,site,'Unassigned confirmed','2030-01-03 08:00Z','2030-01-03 16:00Z','confirmed');
 exception when others then rejected:=true;
 end;
 if not rejected then raise exception 'FAIL confirmed unassigned shift was accepted'; end if;
 rejected:=false;
 begin
  insert into public.guard_shifts(org_id,site_id,title,starts_at,ends_at) values(a,inactive_site,'Inactive object','2030-01-03 08:00Z','2030-01-03 16:00Z');
 exception when others then rejected:=true;
 end;
 if not rejected then raise exception 'FAIL shift on inactive object was accepted'; end if;

 perform public.guard_set_employee_active(a,worker_e,false);
 if (select status from public.guard_employees where id=worker_e)<>'inactive' then raise exception 'FAIL employee profile was not deactivated atomically'; end if;
 if (select active from public.guard_memberships where org_id=a and user_id=worker_user) is distinct from false then raise exception 'FAIL employee access was not deactivated atomically'; end if;
 perform public.guard_set_employee_active(a,worker_e,true);
 if (select status from public.guard_employees where id=worker_e)<>'active' then raise exception 'FAIL employee profile was not reactivated atomically'; end if;
 if (select active from public.guard_memberships where org_id=a and user_id=worker_user) is distinct from true then raise exception 'FAIL employee access was not reactivated atomically'; end if;
 rejected:=false;
 begin
  insert into public.guard_tasks(org_id,site_id,title) values(a,foreign_site,'Cross-tenant task');
 exception when others then rejected:=true;
 end;
 if not rejected then raise exception 'FAIL cross-tenant site was accepted'; end if;
 insert into public.guard_tasks(id,org_id,title) values(task,a,'Unassigned task');
 insert into public.guard_lone_worker_sessions(id,org_id,employee_id,site_id,next_check_due_at) values(session_id,a,e,site,now()+interval '30 minutes');
 perform set_config('request.jwt.claim.sub',outsider::text,true);
 rejected:=false;begin perform public.guard_complete_task(task,'forbidden');exception when others then rejected:=true;end;
 if not rejected then raise exception 'FAIL outsider completed unassigned task'; end if;
 rejected:=false;begin perform public.guard_lone_worker_checkin(session_id);exception when others then rejected:=true;end;
 if not rejected then raise exception 'FAIL outsider checked in'; end if;
 rejected:=false;begin perform public.guard_lone_worker_close(session_id);exception when others then rejected:=true;end;
 if not rejected then raise exception 'FAIL outsider closed session'; end if;
 perform set_config('request.jwt.claim.sub',u::text,true);
 insert into public.guard_form_templates(id,org_id,name,site_id,fields) values(template,a,'Synthetic checklist',site,'[{"key":"checked","label":"Checked","type":"checkbox","required":true}]');
 rejected:=false;begin perform public.guard_submit_form(template,site,null,'{}');exception when others then rejected:=true;end;
 if not rejected then raise exception 'FAIL missing required answer accepted'; end if;
 perform public.guard_submit_form(template,site,null,'{"checked":true}');
 if not exists(select 1 from public.guard_form_submissions where template_id=template and template_snapshot->>'name'='Synthetic checklist') then raise exception 'FAIL form snapshot missing'; end if;
 tag:=public.guard_create_site_nfc_tag(site,'Synthetic tag');
 first_result:=public.guard_clock_nfc_once(tag->>'token',request_id,null);
 repeat_result:=public.guard_clock_nfc_once(tag->>'token',request_id,null);
 if first_result is distinct from repeat_result or first_result->>'action'<>'in' then raise exception 'FAIL NFC retry changed booking'; end if;
 if (select count(*) from public.guard_time_entries where employee_id=e and clock_out_at is null)<>1 then raise exception 'FAIL retry closed or duplicated entry'; end if;
 repeat_result:=public.guard_clock_nfc_once(tag->>'token',gen_random_uuid(),null);
 if repeat_result->>'action'<>'out' or repeat_result->>'entry_id'<>first_result->>'entry_id' then raise exception 'FAIL new scan did not close original entry'; end if;
 rejected:=false;begin perform public.guard_clock_nfc_once('other-token',request_id,null);exception when others then rejected:=true;end;
 if not rejected then raise exception 'FAIL NFC request accepted changed payload'; end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'guard_%' and has_function_privilege('anon',p.oid,'execute')) then raise exception 'FAIL anonymous RPC execute still allowed'; end if;
end $test$;
select 'PASS: overlap/rest integrity, reversible schedule imports, active-object and assignment guards, atomic employee access, tenant links, outsider denial, required fields, form snapshot, anonymous RPC grants and NFC retries' as result;
rollback;
