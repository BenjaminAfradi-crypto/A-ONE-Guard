-- Tested inside BEGIN/ROLLBACK on A One Postgres, 2026-10-20.
-- Warn dispatchers when an already planned shift intersects a PENDING sick note.
-- The partial unique index guard_escalations_unique_source enforces one alert per absence.
-- This is a replacement of an EXISTING private trigger function; no new public RPC.
create or replace function guard_private.leave_shift_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_first record;
  v_count integer;
  v_emp_name text;
  v_title text;
  v_description text;
  v_active boolean := new.status = 'approved'
    or (new.kind = 'sick' and new.status = 'pending');
begin
  if tg_op = 'UPDATE' then
    if (new.status,new.kind,new.starts_on,new.ends_on)
       is not distinct from (old.status,old.kind,old.starts_on,old.ends_on) then
      return new;
    end if;
  end if;

  if v_active then
    select s.site_id,s.starts_at,site.name as site_name into v_first
    from public.guard_shifts s
    join public.guard_sites site on site.id=s.site_id and site.org_id=new.org_id
    where s.org_id=new.org_id
      and s.employee_id=new.employee_id and s.status<>'canceled'
      and daterange(new.starts_on,new.ends_on,'[]')
        && daterange((s.starts_at at time zone 'Europe/Berlin')::date,
           ((s.ends_at-interval '1 second') at time zone 'Europe/Berlin')::date,'[]')
    order by s.starts_at,s.id
    limit 1;

    if v_first.site_id is not null then
      select count(*) into v_count
      from public.guard_shifts s
      where s.org_id=new.org_id
        and s.employee_id=new.employee_id and s.status<>'canceled'
        and daterange(new.starts_on,new.ends_on,'[]')
          && daterange((s.starts_at at time zone 'Europe/Berlin')::date,
             ((s.ends_at-interval '1 second') at time zone 'Europe/Berlin')::date,'[]');

      select display_name into v_emp_name from public.guard_employees
      where org_id=new.org_id and id=new.employee_id;

      v_title:=case when new.kind='sick' and new.status='pending'
        then 'Besetzungsrisiko: offene Krankmeldung'
        else 'Besetzungsrisiko durch Abwesenheit' end;
      v_description:=coalesce(v_emp_name,'Mitarbeiter')
        || case when new.kind='sick' and new.status='pending'
           then ' hat eine offene Krankmeldung für'
           else ' fehlt für' end
        || ' '||v_count||' geplante Dienste. Erster Dienst bei '
        ||coalesce(v_first.site_name,'Objekt')||'.';

      -- Upsert keeps the unique source ID stable and retains acknowledgement.
      insert into public.guard_escalations(
        org_id,site_id,source_type,source_id,event_type,severity,
        title,description,status,due_at,created_by
      ) values(
        new.org_id,v_first.site_id,'absence',new.id,'staffing','high',
        v_title,v_description,'open',v_first.starts_at,auth.uid()
      )
      on conflict (org_id,source_type,source_id) where source_id is not null
      do update set
        site_id=excluded.site_id,
        event_type='staffing',
        title=excluded.title,
        description=excluded.description,
        severity=excluded.severity,
        due_at=excluded.due_at,
        status=case when public.guard_escalations.status='resolved'
          then 'open' else public.guard_escalations.status end,
        acknowledged_by=case when public.guard_escalations.status='resolved'
          then null else public.guard_escalations.acknowledged_by end,
        acknowledged_at=case when public.guard_escalations.status='resolved'
          then null else public.guard_escalations.acknowledged_at end,
        resolved_by=null,
        resolved_at=null,
        resolution_note=case when public.guard_escalations.status='resolved'
          then null else public.guard_escalations.resolution_note end;
      return new;
    end if;
  end if;

  -- Close alerts that are no longer relevant when leave is rejected,
  -- canceled or moved to dates with no scheduled shifts.
  update public.guard_escalations e
  set status='resolved',resolved_at=now(),resolved_by=null,
      resolution_note='Automatisch erledigt: Abwesenheitsstatus oder Zeitraum geändert'
  where e.org_id=new.org_id
    and e.source_type='absence' and e.source_id=new.id
    and e.event_type='staffing'
    and e.status in ('open','acknowledged');
  return new;
end
$function$;

drop trigger if exists guard_leave_shift_escalation on public.guard_leave_requests;
create trigger guard_leave_shift_escalation
after insert or update of status,kind,starts_on,ends_on
on public.guard_leave_requests
for each row execute function guard_private.leave_shift_escalation();
