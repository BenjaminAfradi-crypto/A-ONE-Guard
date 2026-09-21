-- Additive integrity changes for the existing A ONE Guard database.
-- Requires the existing guard tables, guard_private helpers and RPC functions.
create extension if not exists btree_gist with schema extensions;
set search_path = public, extensions;
alter table public.guard_shifts add constraint guard_shifts_no_employee_overlap
 exclude using gist (org_id with =, employee_id with =, tstzrange(starts_at,ends_at,'[)') with &&)
 where (employee_id is not null and status <> 'canceled');
reset search_path;

-- NULL employee IDs must never authorize another employee's operations.
CREATE OR REPLACE FUNCTION public.guard_lone_worker_checkin(p_session uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid(); v_s public.guard_lone_worker_sessions%rowtype; v_emp uuid;
begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select * into v_s from public.guard_lone_worker_sessions where id=p_session for update;
 if v_s.id is null or v_s.status not in ('active','overdue','escalated') then raise exception 'active session not found'; end if;
 v_emp:=guard_private.employee_id_for(v_s.org_id,v_uid);
 if v_emp is null or not guard_private.is_member(v_s.org_id,v_uid) or v_s.employee_id is distinct from v_emp then raise exception 'not allowed'; end if;
 update public.guard_lone_worker_sessions set last_checkin_at=now(),next_check_due_at=now()+make_interval(mins=>interval_minutes),status='active',updated_at=now() where id=p_session;
 insert into public.guard_audit_log(org_id,actor_user_id,entity_type,entity_id,action) values(v_s.org_id,v_uid,'lone_worker',p_session,'checkin');
 return p_session;
end $function$
;
CREATE OR REPLACE FUNCTION public.guard_lone_worker_close(p_session uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid(); v_s public.guard_lone_worker_sessions%rowtype; v_emp uuid;
begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select * into v_s from public.guard_lone_worker_sessions where id=p_session for update;
 if v_s.id is null then raise exception 'session not found'; end if;
 v_emp:=guard_private.employee_id_for(v_s.org_id,v_uid);
 if not guard_private.can_manage(v_s.org_id,v_uid) and (v_emp is null or not guard_private.is_member(v_s.org_id,v_uid) or v_s.employee_id is distinct from v_emp) then raise exception 'not allowed'; end if;
 update public.guard_lone_worker_sessions set status='closed',closed_at=now(),updated_at=now() where id=p_session;
 insert into public.guard_audit_log(org_id,actor_user_id,entity_type,entity_id,action) values(v_s.org_id,v_uid,'lone_worker',p_session,'closed');
 return p_session;
end $function$
;
CREATE OR REPLACE FUNCTION public.guard_complete_task(p_task uuid, p_note text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid(); v_t public.guard_tasks%rowtype; v_emp uuid;
begin
 if v_uid is null then raise exception 'authentication required'; end if;
 select * into v_t from public.guard_tasks where id=p_task for update;
 if v_t.id is null then raise exception 'task not found'; end if;
 v_emp:=guard_private.employee_id_for(v_t.org_id,v_uid);
 if not guard_private.can_manage(v_t.org_id,v_uid) and (v_emp is null or not guard_private.is_member(v_t.org_id,v_uid) or v_t.employee_id is distinct from v_emp) then raise exception 'not allowed'; end if;
 update public.guard_tasks set status='done',completed_at=now(),completion_note=nullif(trim(coalesce(p_note,'')),''),updated_at=now() where id=p_task;
 insert into public.guard_audit_log(org_id,actor_user_id,entity_type,entity_id,action,after_data) values(v_t.org_id,v_uid,'task',p_task,'completed',jsonb_build_object('completion_note',p_note));
 return p_task;
end $function$
;

-- Preserve authenticated access while removing inherited public/anonymous access.
do $block$ declare r record; begin
 for r in select p.oid::regprocedure as signature,
 has_function_privilege('authenticated',p.oid,'execute') as authenticated_access
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname like 'guard_%' loop
  execute format('revoke execute on function %s from public, anon',r.signature);
  if r.authenticated_access then execute format('grant execute on function %s to authenticated',r.signature); end if;
 end loop;
end $block$;

-- Retain the exact questions that were answered when a template later changes.
alter table public.guard_form_submissions add column template_snapshot jsonb;

create or replace function guard_private.validate_module_links() returns trigger
language plpgsql security invoker set search_path='' as $function$
declare j jsonb:=to_jsonb(new); v uuid;
begin
 if j->>'site_id' is not null and not exists(select 1 from public.guard_sites where id=(j->>'site_id')::uuid and org_id=new.org_id) then raise exception 'Objekt gehört nicht zu dieser Firma'; end if;
 v:=coalesce((j->>'employee_id')::uuid,(j->>'responsible_employee_id')::uuid);
 if v is not null and not exists(select 1 from public.guard_employees where id=v and org_id=new.org_id) then raise exception 'Mitarbeiter gehört nicht zu dieser Firma'; end if;
 if j->>'customer_id' is not null and not exists(select 1 from public.guard_customers where id=(j->>'customer_id')::uuid and org_id=new.org_id) then raise exception 'Kunde gehört nicht zu dieser Firma'; end if;
 return new;
end $function$;
create trigger guard_tasks_tenant before insert or update on public.guard_tasks for each row execute function guard_private.validate_module_links();
create trigger guard_quality_tenant before insert or update on public.guard_quality_audits for each row execute function guard_private.validate_module_links();
create trigger guard_forms_tenant before insert or update on public.guard_form_templates for each row execute function guard_private.validate_module_links();
create trigger guard_tasks_audit after insert or update or delete on public.guard_tasks for each row execute function guard_private.audit_guard_row('task');
create trigger guard_quality_audit after insert or update or delete on public.guard_quality_audits for each row execute function guard_private.audit_guard_row('quality_audit');
create trigger guard_templates_audit after insert or update or delete on public.guard_form_templates for each row execute function guard_private.audit_guard_row('form_template');

create or replace function guard_private.validate_form_template() returns trigger
language plpgsql security invoker set search_path='' as $function$
declare f jsonb; keys text[]:='{}'; k text;
begin
 if jsonb_typeof(new.fields) <> 'array' or jsonb_array_length(new.fields) not between 1 and 50 then raise exception 'Ein Formular benötigt 1 bis 50 Felder'; end if;
 for f in select value from jsonb_array_elements(new.fields) loop
  k:=f->>'key';
  if k is null or k !~ '^[a-zA-Z][a-zA-Z0-9_]{0,63}$' or k=any(keys) then raise exception 'Feldschlüssel fehlt oder ist doppelt'; end if;
  keys:=array_append(keys,k);
  if coalesce(length(trim(f->>'label')),0)=0 or coalesce(f->>'type','') not in ('text','textarea','number','date','checkbox','select') then raise exception 'Ungültige Felddefinition'; end if;
  if f ? 'required' and jsonb_typeof(f->'required')<>'boolean' then raise exception 'Pflichtfeld muss true oder false sein'; end if;
  if f->>'type'='select' then
   if jsonb_typeof(f->'options') is distinct from 'array' then raise exception 'Auswahloptionen fehlen'; end if;
   if jsonb_array_length(f->'options')=0 or exists(select 1 from jsonb_array_elements(f->'options') opt where jsonb_typeof(opt)<>'string') then raise exception 'Ungültige Auswahloptionen'; end if;
  end if;
 end loop;
 return new;
end $function$;
create trigger guard_template_validation before insert or update of fields on public.guard_form_templates for each row execute function guard_private.validate_form_template();

create or replace function guard_private.validate_form_response() returns trigger
language plpgsql security invoker set search_path='' as $function$
declare t public.guard_form_templates%rowtype; f jsonb; v jsonb; k text;
begin
 select * into t from public.guard_form_templates where id=new.template_id and org_id=new.org_id and active;
 if t.id is null then raise exception 'Formular nicht verfügbar'; end if;
 if t.site_id is not null and t.site_id is distinct from new.site_id then raise exception 'Formular gehört zu einem anderen Objekt'; end if;
 if new.shift_id is not null and not exists(select 1 from public.guard_shifts where id=new.shift_id and org_id=new.org_id and employee_id=new.employee_id and site_id is not distinct from new.site_id) then raise exception 'Dienst gehört nicht zu diesem Objekt oder Mitarbeiter'; end if;
 if jsonb_typeof(new.responses)<>'object' then raise exception 'Antworten müssen ein Objekt sein'; end if;
 for k in select jsonb_object_keys(new.responses) loop
  if not exists(select 1 from jsonb_array_elements(t.fields) f where f->>'key'=k) then raise exception 'Unbekanntes Formularfeld'; end if;
 end loop;
 for f in select value from jsonb_array_elements(t.fields) loop
  k:=f->>'key'; v:=new.responses->k;
  if coalesce((f->>'required')::boolean,false) and (v is null or v='null'::jsonb or v='""'::jsonb or (f->>'type'='checkbox' and v<>'true'::jsonb)) then raise exception 'Pflichtfeld fehlt: %',f->>'label'; end if;
  if v is null or v='null'::jsonb or v='""'::jsonb then continue; end if;
  if f->>'type'='number' and jsonb_typeof(v)<>'number' then raise exception 'Zahl erwartet: %',f->>'label'; end if;
  if f->>'type'='checkbox' and jsonb_typeof(v)<>'boolean' then raise exception 'Bestätigung erwartet: %',f->>'label'; end if;
  if f->>'type' in ('text','textarea','date','select') and jsonb_typeof(v)<>'string' then raise exception 'Text erwartet: %',f->>'label'; end if;
  if f->>'type'='select' and not (f->'options' @> jsonb_build_array(v)) then raise exception 'Ungültige Auswahl: %',f->>'label'; end if;
  if f->>'type'='date' then perform (new.responses->>k)::date; end if;
 end loop;
 new.template_snapshot:=jsonb_build_object('name',t.name,'fields',t.fields,'description',t.description);
 return new;
end $function$;
create trigger guard_form_response_validation before insert on public.guard_form_submissions for each row execute function guard_private.validate_form_response();
