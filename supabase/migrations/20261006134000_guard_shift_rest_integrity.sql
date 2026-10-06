-- Server-side planning integrity for A ONE Guard pilot.
-- Adds a configurable minimum rest period (default: 11 hours) and enforces it
-- together with active object/employee, absence and qualification checks.

alter table public.guard_organizations
  add column if not exists min_rest_minutes integer not null default 660;

do $block$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.guard_organizations'::regclass
      and conname='guard_organizations_min_rest_minutes_check'
  ) then
    alter table public.guard_organizations
      add constraint guard_organizations_min_rest_minutes_check
      check (min_rest_minutes between 0 and 1440);
  end if;
end
$block$;

create or replace function guard_private.validate_shift_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_emp_org uuid;
  v_emp_status text;
  v_emp_qual text;
  v_site_org uuid;
  v_site_active boolean;
  v_missing text;
  v_start_date date;
  v_end_date date;
  v_rest_minutes integer := 660;
  v_neighbor public.guard_shifts%rowtype;
begin
  if new.ends_at <= new.starts_at then
    raise exception 'Dienstende muss nach Dienstbeginn liegen';
  end if;

  select s.org_id,s.active
    into v_site_org,v_site_active
    from public.guard_sites s
   where s.id=new.site_id;

  if v_site_org is null or v_site_org<>new.org_id then
    raise exception 'Objekt gehört nicht zu dieser Firma';
  end if;
  if not coalesce(v_site_active,false) and new.status<>'canceled' then
    raise exception 'Objekt ist nicht aktiv';
  end if;

  if new.status='confirmed' and new.employee_id is null then
    raise exception 'Unbesetzte Dienste können nicht freigegeben werden';
  end if;

  if new.employee_id is not null then
    select e.org_id,e.status,e.qualification_level
      into v_emp_org,v_emp_status,v_emp_qual
      from public.guard_employees e
     where e.id=new.employee_id;

    if v_emp_org is null or v_emp_org<>new.org_id then
      raise exception 'Mitarbeiter gehört nicht zu dieser Firma';
    end if;
    if v_emp_status<>'active' and new.status<>'canceled' then
      raise exception 'Mitarbeiter ist nicht aktiv';
    end if;
    if new.status<>'canceled'
       and guard_private.qualification_rank(v_emp_qual)
           < guard_private.qualification_rank(new.required_qualification) then
      raise exception 'Mitarbeiter erfüllt die erforderliche Qualifikation nicht';
    end if;

    if new.status<>'canceled' then
      -- Serialize planning writes for one employee so two concurrent requests
      -- cannot both pass the rest/overlap pre-check.
      perform pg_advisory_xact_lock(
        hashtextextended(new.org_id::text||':'||new.employee_id::text,0)
      );

      v_start_date := (new.starts_at at time zone 'Europe/Berlin')::date;
      v_end_date := ((new.ends_at-interval '1 second') at time zone 'Europe/Berlin')::date;

      if exists(
        select 1
          from public.guard_leave_requests l
         where l.org_id=new.org_id
           and l.employee_id=new.employee_id
           and (
             l.status='approved'
             or (l.kind='sick' and l.status='pending')
           )
           and daterange(l.starts_on,l.ends_on,'[]')
               && daterange(v_start_date,v_end_date,'[]')
      ) then
        raise exception 'Mitarbeiter hat in diesem Zeitraum eine Abwesenheit oder offene Krankmeldung';
      end if;

      select r.label
        into v_missing
        from public.guard_compliance_requirements r
       where r.org_id=new.org_id
         and r.active
         and r.mandatory
         and r.requirement_type='qualification'
         and (r.site_id is null or r.site_id=new.site_id)
         and not (
           (r.requirement_key='unterrichtung'
             and guard_private.qualification_rank(v_emp_qual)
                 >= guard_private.qualification_rank('unterrichtung'))
           or
           (r.requirement_key='sachkunde'
             and guard_private.qualification_rank(v_emp_qual)
                 >= guard_private.qualification_rank('sachkunde'))
           or exists(
             select 1
               from public.guard_qualifications q
              where q.org_id=new.org_id
                and q.employee_id=new.employee_id
                and q.kind=r.requirement_key
                and q.verified_at is not null
                and (q.valid_from is null or q.valid_from<=v_start_date)
                and (q.valid_until is null or q.valid_until>=v_end_date)
           )
         )
       order by r.site_id nulls last,r.label
       limit 1;

      if v_missing is not null then
        raise exception 'Pflichtnachweis fehlt oder ist abgelaufen: %',v_missing;
      end if;

      select coalesce(o.min_rest_minutes,660)
        into v_rest_minutes
        from public.guard_organizations o
       where o.id=new.org_id;

      select s.*
        into v_neighbor
        from public.guard_shifts s
       where s.org_id=new.org_id
         and s.employee_id=new.employee_id
         and s.id<>coalesce(new.id,'00000000-0000-0000-0000-000000000000'::uuid)
         and s.status<>'canceled'
         and s.starts_at < new.ends_at + make_interval(mins=>v_rest_minutes)
         and s.ends_at > new.starts_at - make_interval(mins=>v_rest_minutes)
       order by
         case when tstzrange(s.starts_at,s.ends_at,'[)')
                   && tstzrange(new.starts_at,new.ends_at,'[)')
              then 0 else 1 end,
         abs(extract(epoch from (s.starts_at-new.starts_at)))
       limit 1;

      if v_neighbor.id is not null then
        if tstzrange(v_neighbor.starts_at,v_neighbor.ends_at,'[)')
             && tstzrange(new.starts_at,new.ends_at,'[)') then
          raise exception 'Mitarbeiter hat bereits einen überschneidenden Dienst';
        end if;
        raise exception 'Mindestruhezeit von % Minuten zwischen Diensten wird unterschritten',
          v_rest_minutes;
      end if;
    end if;
  end if;

  return new;
end
$function$;
