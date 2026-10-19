-- Run preflight first. These indexes intentionally fail on conflicting data.
-- Do not resolve duplicates by deleting or overwriting real employee records.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS guard_launch_employee_no_unique
  ON guard_employees(org_id,btrim(employee_no))
  WHERE employee_no IS NOT NULL AND btrim(employee_no)<>'';
CREATE UNIQUE INDEX IF NOT EXISTS guard_launch_employee_email_unique
  ON guard_employees(org_id,lower(btrim(email)))
  WHERE email IS NOT NULL AND btrim(email)<>'';
CREATE UNIQUE INDEX IF NOT EXISTS guard_launch_employee_account_unique
  ON guard_employees(org_id,user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS guard_launch_membership_unique
  ON guard_memberships(org_id,user_id);
CREATE UNIQUE INDEX IF NOT EXISTS guard_launch_shift_exact_unique
  ON guard_shifts(org_id,employee_id,site_id,starts_at,ends_at)
  WHERE employee_id IS NOT NULL AND status<>'canceled';
COMMIT;
