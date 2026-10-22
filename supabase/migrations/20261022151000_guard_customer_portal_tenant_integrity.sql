-- Customer portal tenant and lifecycle integrity.
-- On deployment, this migration requires no preexisting cross-org portal/ticket
-- links and no mismatched ticket site links. Preflight counts: all zero on 2026-10-22.
-- A composite foreign key is stronger than an RPC-only authorization check:
-- it protects service-role writes and direct Data API inserts as well.
ALTER TABLE public.guard_customers
  ADD CONSTRAINT guard_customers_org_id_id_unique UNIQUE (org_id,id);

ALTER TABLE public.guard_sites
  ADD CONSTRAINT guard_sites_org_customer_id_unique UNIQUE (org_id,customer_id,id);

ALTER TABLE public.guard_customer_portal_access
  ADD CONSTRAINT guard_customer_portal_access_org_customer_fk
  FOREIGN KEY (org_id,customer_id)
  REFERENCES public.guard_customers (org_id,id);

ALTER TABLE public.guard_customer_tickets
  ADD CONSTRAINT guard_customer_tickets_org_customer_fk
  FOREIGN KEY (org_id,customer_id)
  REFERENCES public.guard_customers (org_id,id);

ALTER TABLE public.guard_customer_tickets
  ADD CONSTRAINT guard_customer_tickets_org_customer_site_fk
  FOREIGN KEY (org_id,customer_id,site_id)
  REFERENCES public.guard_sites (org_id,customer_id,id);

-- Previously this SECURITY DEFINER RPC trusted the org_id of a portal access
-- row without checking that the related customer belongs to that org and is active.
CREATE OR REPLACE FUNCTION public.guard_customer_create_ticket(
  p_customer uuid,p_site uuid,p_subject text,p_body text,
  p_priority text DEFAULT 'medium'
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_org uuid;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF p_priority NOT IN ('low','medium','high') THEN
    RAISE EXCEPTION 'invalid priority';
  END IF;

  SELECT a.org_id INTO v_org
  FROM public.guard_customer_portal_access a
  JOIN public.guard_customers c
    ON c.id=a.customer_id AND c.org_id=a.org_id
  WHERE a.customer_id=p_customer AND a.user_id=v_uid
    AND a.active AND c.status='active'
  LIMIT 1;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'customer portal access not found';
  END IF;
  IF p_site IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.guard_sites s
    WHERE s.id=p_site AND s.org_id=v_org AND s.customer_id=p_customer
  ) THEN
    RAISE EXCEPTION 'invalid site';
  END IF;

  INSERT INTO public.guard_customer_tickets
    (org_id,customer_id,site_id,subject,body,priority,created_by)
  VALUES (v_org,p_customer,p_site,trim(p_subject),trim(p_body),p_priority,v_uid)
  RETURNING id INTO v_id;
  RETURN v_id;
END
$function$;

-- Direct REST reads and inserts must obey the same active-customer rule as
-- guard_customer_portal_snapshot(). Managers retain their existing access.
ALTER POLICY guard_customer_tickets_insert ON public.guard_customer_tickets
WITH CHECK (
  guard_private.can_manage(org_id,auth.uid())
  OR (
    created_by=auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.guard_customer_portal_access a
      JOIN public.guard_customers c
        ON c.id=a.customer_id AND c.org_id=a.org_id
      WHERE a.org_id=guard_customer_tickets.org_id
        AND a.customer_id=guard_customer_tickets.customer_id
        AND a.user_id=auth.uid() AND a.active AND c.status='active'
    )
  )
);

ALTER POLICY guard_customer_tickets_select ON public.guard_customer_tickets
USING (
  guard_private.can_manage(org_id,auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.guard_customer_portal_access a
    JOIN public.guard_customers c
      ON c.id=a.customer_id AND c.org_id=a.org_id
    WHERE a.org_id=guard_customer_tickets.org_id
      AND a.customer_id=guard_customer_tickets.customer_id
      AND a.user_id=auth.uid() AND a.active AND c.status='active'
  )
);
