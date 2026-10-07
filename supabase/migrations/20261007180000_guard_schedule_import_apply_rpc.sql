-- Apply a complete Dienstplan import through one guarded server-side transaction.
-- Individual invalid rows are recorded as errors, while successful rows and the
-- import audit batch are committed together. Direct batch INSERT is no longer a
-- client capability.

create or replace function public.guard_apply_schedule_import(
  p_org uuid,
  p_file_name text,
  p_file_sha256 text,
  p_rows jsonb,
  p_create_missing_sites boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_row jsonb;
  v_employee public.guard_employees%rowtype;
  v_site public.guard_sites%rowtype;
  v_site_id uuid;
  v_requested_site_id uuid;
  v_site_name text;
  v_site_count integer;
  v_shift_id uuid;
  v_title text;
  v_required_qualification text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_created_shift_ids uuid[] := '{}'::uuid[];
  v_created_site_ids uuid[] := '{}'::uuid[];
  v_errors jsonb := '[]'::jsonb;
  v_total integer;
  v_imported integer := 0;
  v_failed integer := 0;
  v_batch uuid;
  v_status text;
  v_sheet text;
  v_row_no integer;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  v_role := guard_private.role_for(p_org, v_actor);
  if v_role not in ('owner','admin','dispatcher') then
    raise exception 'not allowed';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Importdaten müssen als Liste übergeben werden';
  end if;

  v_total := jsonb_array_length(p_rows);
  if v_total < 1 or v_total > 2000 then
    raise exception 'Dienstplanimport muss zwischen 1 und 2000 Zeilen enthalten';
  end if;

  if length(coalesce(p_file_name,'')) > 255 then
    raise exception 'Dateiname ist zu lang';
  end if;
  if p_file_sha256 is not null and p_file_sha256 <> '' and p_file_sha256 !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'Datei-Prüfsumme ist ungültig';
  end if;

  -- Serialize imports for one tenant. The shift trigger additionally serializes
  -- writes per employee before checking overlap/rest/qualification rules.
  perform pg_advisory_xact_lock(
    hashtextextended('guard-schedule-import:' || p_org::text, 0)
  );

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_sheet := left(coalesce(nullif(btrim(v_row->>'sheet'),''),'Import'),120);
    begin
      v_row_no := nullif(v_row->>'row','')::integer;
    exception when others then
      v_row_no := null;
    end;

    begin
      if jsonb_typeof(v_row) <> 'object' then
        raise exception 'Zeile hat ein ungültiges Format';
      end if;

      if coalesce(v_row->>'employee_id','') = '' then
        raise exception 'Mitarbeiterzuordnung fehlt';
      end if;

      select *
        into v_employee
        from public.guard_employees e
       where e.id = (v_row->>'employee_id')::uuid
         and e.org_id = p_org;

      if v_employee.id is null then
        raise exception 'Mitarbeiter gehört nicht zu dieser Firma';
      end if;
      if v_employee.status <> 'active' then
        raise exception 'Mitarbeiter ist nicht aktiv';
      end if;

      v_requested_site_id := null;
      if coalesce(v_row->>'site_id','') <> '' then
        v_requested_site_id := (v_row->>'site_id')::uuid;
      end if;
      v_site_name := btrim(coalesce(v_row->>'site_name',''));

      if v_requested_site_id is not null then
        select *
          into v_site
          from public.guard_sites s
         where s.id = v_requested_site_id
           and s.org_id = p_org;

        if v_site.id is null then
          raise exception 'Objekt gehört nicht zu dieser Firma';
        end if;
        if not v_site.active then
          raise exception 'Objekt ist nicht aktiv';
        end if;
        v_site_id := v_site.id;
      else
        if v_site_name = '' then
          raise exception 'Objektzuordnung fehlt';
        end if;
        if length(v_site_name) > 200 then
          raise exception 'Objektname ist zu lang';
        end if;

        select count(*), min(s.id)
          into v_site_count, v_site_id
          from public.guard_sites s
         where s.org_id = p_org
           and lower(btrim(s.name)) = lower(v_site_name);

        if v_site_count > 1 then
          raise exception 'Objektname ist nicht eindeutig';
        elsif v_site_count = 1 then
          select *
            into v_site
            from public.guard_sites s
           where s.id = v_site_id;
          if not v_site.active then
            raise exception 'Objekt ist nicht aktiv';
          end if;
        else
          if not p_create_missing_sites then
            raise exception 'Objekt existiert nicht';
          end if;

          insert into public.guard_sites(org_id,name,active)
          values(p_org,v_site_name,true)
          returning id into v_site_id;

          v_created_site_ids := array_append(v_created_site_ids,v_site_id);
        end if;
      end if;

      v_title := btrim(coalesce(nullif(v_row->>'title',''),'Sicherheitsdienst'));
      if length(v_title) > 250 then
        raise exception 'Tätigkeit ist zu lang';
      end if;

      v_required_qualification := coalesce(nullif(v_row->>'required_qualification',''),'none');
      if v_required_qualification not in ('none','unterrichtung','sachkunde') then
        raise exception 'Unbekannte Qualifikationsanforderung';
      end if;

      v_starts_at := (v_row->>'starts_at')::timestamptz;
      v_ends_at := (v_row->>'ends_at')::timestamptz;
      if v_ends_at <= v_starts_at then
        raise exception 'Dienstende muss nach Dienstbeginn liegen';
      end if;
      if v_ends_at - v_starts_at > interval '24 hours' then
        raise exception 'Ein importierter Dienst darf höchstens 24 Stunden dauern';
      end if;

      insert into public.guard_shifts(
        org_id,site_id,employee_id,title,starts_at,ends_at,
        required_qualification,status,created_by
      ) values (
        p_org,v_site_id,v_employee.id,v_title,v_starts_at,v_ends_at,
        v_required_qualification,'planned',v_actor
      )
      returning id into v_shift_id;

      v_created_shift_ids := array_append(v_created_shift_ids,v_shift_id);
      v_imported := v_imported + 1;
    exception when others then
      -- This exception block is a PostgreSQL subtransaction. Any site/shift
      -- created for this failed row is rolled back before the error is recorded.
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'sheet',v_sheet,
        'row',v_row_no,
        'reason',SQLERRM
      ));
    end;
  end loop;

  v_status := case
    when v_failed = 0 then 'completed'
    when v_imported > 0 then 'partial'
    else 'failed'
  end;

  insert into public.guard_schedule_import_batches(
    org_id,file_name,file_sha256,total_rows,imported_rows,failed_rows,
    created_shift_ids,created_site_ids,errors,status,created_by
  ) values (
    p_org,nullif(btrim(coalesce(p_file_name,'')),''),
    lower(nullif(btrim(coalesce(p_file_sha256,'')),'',
    v_total,v_imported,v_failed,
    v_created_shift_ids,v_created_site_ids,v_errors,v_status,v_actor
  )
  returning id into v_batch;

  insert into public.guard_audit_log(
    org_id,actor_user_id,entity_type,entity_id,action,after_data
  ) values (
    p_org,v_actor,'schedule_import',v_batch,'import_applied',
    jsonb_build_object(
      'file_name',nullif(btrim(coalesce(p_file_name,'')),''),
      'total_rows',v_total,
      'imported_rows',v_imported,
      'failed_rows',v_failed,
      'created_sites',cardinality(v_created_site_ids)
    )
  );

  return jsonb_build_object(
    'batch_id',v_batch,
    'status',v_status,
    'total',v_total,
    'imported',v_imported,
    'failed',v_failed,
    'errors',v_errors,
    'created_shift_ids',to_jsonb(v_created_shift_ids),
    'created_site_ids',to_jsonb(v_created_site_ids)
  );
end
$function$;

revoke insert, update, delete, truncate, references, trigger
  on table public.guard_schedule_import_batches
  from authenticated;
revoke all
  on table public.guard_schedule_import_batches
  from anon;
grant select
  on table public.guard_schedule_import_batches
  to authenticated;

revoke execute on function public.guard_apply_schedule_import(uuid,text,text,jsonb,boolean)
  from public, anon;
grant execute on function public.guard_apply_schedule_import(uuid,text,text,jsonb,boolean)
  to authenticated;
