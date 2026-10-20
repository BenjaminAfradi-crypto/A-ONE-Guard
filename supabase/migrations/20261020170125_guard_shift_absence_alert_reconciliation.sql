-- A One Guard: reconcile open staffing alerts after shift cancellation or reassignment.
-- Private trigger helper only. No new exposed RPC and no changes to tenant RLS.
create or replace function guard_private.reconcile_shift_absence_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_leave record;
  v_first record;
  v_count integer;
  v_employee_name text;
  v_description text;
begin
  if tg_op = 'UPDATE' then
    if (old.org_id,old.employee_id,old.site_id,old.starts_at,old.ends_at,old.status)
       is not distinct from
       (new.org_id,new.employee_id,new.site_id,new.starts_at,new.ends_at,new.status) then
      return new;
    end if;
  end if;

  -- Already canceled or unassigned shifts cannot be the source of an
  -- existing employee absence conflict.
  if old.employee_id is null or old.status = 'canceled' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  -- Only reconcile CURRENTLY ACTIVE alerts affected by the OLD shift.
  -- Previously manually resolved alerts are not reopened by a plan edit.
  for v_leave in
    select l.id,l.org_id,l.employee_id,l.kind,l.status
    from public.guard_leave_requests l
    join public.guard_escalations a
      on a.org_id = l.org_id
     and a.source_type = 'absence'
     and a.source_id = l.id
     and a.event_type = 'staffing'
     and a.status in ('open','acknowledged')
    where l.org_id = old.org_id
      and l.employee_id = old.employee_id
      and (l.status = 'approved' or (l.kind = 'sick' and l.status = 'pending'))
      and daterange(l.starts_on,l.ends_on,'[]')
          && daterange(
               (old.starts_at at time zone 'Europe/Berlin')::date,
               ((old.ends_at - interval '1 second') at time zone 'Europe/Berlin')::date,
               '[]'
             )
  loop
    -- Serialize related alerts across concurrent changes for the same leave.
    perform pg_advisory_xact_lock(
      hashtextextended('guard-staffing-alert:'||v_leave.org_id::text||':'||v_leave.id::text,0)
    );

    select s.site_id,s.starts_at,site.name as site_name
      into v_first
    from public.guard_shifts s
    join public.guard_sites site
      on site.id = s.site_id and site.org_id = v_leave.org_id
    where s.org_id = v_leave.org_id
      and s.employee_id = v_leave.employee_id
      and s.status <> 'canceled'
      and daterange(
            (s.starts_at at time zone 'Europe/Berlin')::date,
            ((s.ends_at - interval '1 second') at time zone 'Europe/Berlin')::date,
            '[]'
          )
          && (select daterange(l.starts_on,l.ends_on,'[]')
              from public.guard_leave_requests l where l.id=v_leave.id and l.org_id=v_leave.org_id)
    order by s.starts_at,s.id
    limit 1;

    if not found then
      update public.guard_escalations a
      set status = 'resolved',
          resolved_at = now(),
          resolved_by = null,
          resolution_note = 'Automatisch erledigt: kein betroffener Dienst mehr'
      where a.org_id = v_leave.org_id
        and a.source_type = 'absence'
        and a.source_id = v_leave.id
        and a.event_type = 'staffing'
        and a.status in ('open','acknowledged');
    else
      select count(*) into v_count
      from public.guard_shifts s
      join public.guard_leave_requests l
        on l.id=v_leave.id and l.org_id=s.org_id
      where s.org_id = v_leave.org_id
        and s.employee_id = v_leave.employee_id
        and s.status <> 'canceled'
        and daterange(l.starts_on,l.ends_on,'[]')
          && daterange(
               (s.starts_at at time zone 'Europe/Berlin')::date,
               ((s.ends_at-interval '1 second') at time zone 'Europe/Berlin')::date,
               '[]'
             );

      select e.display_name into v_employee_name
      from public.guard_employees e
      where e.id=v_leave.employee_id and e.org_id=v_leave.org_id;

      v_description := coalesce(v_employee_name,'Mitarbeiter')
        || case when v_leave.kind='sick' and v_leave.status='pending'
           then ' hat eine offene Krankmeldung für'
           else ' fehlt für' end
        || ' '||v_count||' geplante Dienste. Erster Dienst bei '
        ||coalesce(v_first.site_name,'Objekt')||'.';

      update public.guard_escalations a
      set site_id = v_first.site_id,
          due_at = v_first.starts_at,
          description = v_description
      where a.org_id = v_leave.org_id
        and a.source_type = 'absence'
        and a.source_id = v_leave.id
        and a.event_type = 'staffing'
        and a.status in ('open','acknowledged');
    end if;
  end loop;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$function$;

-- Internal only: the trigger executes with its function owner.
revoke execute on function guard_private.reconcile_shift_absence_alert()
  from public, anon, authenticated;

drop trigger if exists guard_shift_absence_alert_reconcile on public.guard_shifts;
create trigger guard_shift_absence_alert_reconcile
after update of org_id,site_id,employee_id,starts_at,ends_at,status or delete
on public.guard_shifts
for each row execute function guard_private.reconcile_shift_absence_alert();
