-- READ ONLY. Run against Floot-managed Postgres, never the separate Supabase DB.
SELECT table_name,column_name,data_type,udt_name
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name IN ('users','guard_organizations','guard_memberships','guard_employees','guard_shifts','guard_import_batches')
ORDER BY table_name,ordinal_position;
SELECT org_id,btrim(employee_no) AS employee_no,count(*) AS duplicates
FROM guard_employees WHERE employee_no IS NOT NULL AND btrim(employee_no)<>''
GROUP BY org_id,btrim(employee_no) HAVING count(*)>1;
SELECT org_id,lower(btrim(email)) AS email,count(*) AS duplicates
FROM guard_employees WHERE email IS NOT NULL AND btrim(email)<>''
GROUP BY org_id,lower(btrim(email)) HAVING count(*)>1;
SELECT org_id,user_id,count(*) AS duplicates
FROM guard_employees WHERE user_id IS NOT NULL GROUP BY org_id,user_id HAVING count(*)>1;
SELECT org_id,user_id,count(*) AS duplicates
FROM guard_memberships GROUP BY org_id,user_id HAVING count(*)>1;
SELECT org_id,employee_id,site_id,starts_at,ends_at,count(*) AS duplicates
FROM guard_shifts WHERE employee_id IS NOT NULL AND status<>'canceled'
GROUP BY org_id,employee_id,site_id,starts_at,ends_at HAVING count(*)>1;
SELECT a.org_id,a.id AS first_shift,b.id AS second_shift
FROM guard_shifts a JOIN guard_shifts b
ON a.org_id=b.org_id AND a.employee_id=b.employee_id AND a.id<b.id
AND a.starts_at<b.ends_at AND a.ends_at>b.starts_at
WHERE a.status<>'canceled' AND b.status<>'canceled';
