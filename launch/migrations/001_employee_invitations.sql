-- Floot-managed Postgres only. Do not apply to the separate Supabase project.
BEGIN;
CREATE TABLE IF NOT EXISTS guard_employee_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES guard_organizations(id),
  employee_id uuid NOT NULL REFERENCES guard_employees(id),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_by bigint NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS guard_employee_invites_employee_idx ON guard_employee_invitations(org_id,employee_id);
-- Private server access only; no browser/PostgREST grants.
REVOKE ALL ON guard_employee_invitations FROM PUBLIC;
COMMIT;
