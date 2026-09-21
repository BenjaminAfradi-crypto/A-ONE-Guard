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
  if not exists(select 1 from jsonb_array_elements(t.fields) as field_entry(value) where field_entry.value->>'key'=k) then raise exception 'Unbekanntes Formularfeld'; end if;
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
