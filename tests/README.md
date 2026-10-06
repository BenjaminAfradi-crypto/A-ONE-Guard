# Guard regression tests

Requirements: Node.js 20+ and Playwright 1.62.1.

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
node --test --test-concurrency=1 tests/*.browser.cjs
```

The suite opens the real planner HTML, CSS, core client and planner JavaScript in Chromium. Every network request is intercepted; Supabase responses and writes are simulated. It requires no credentials and never writes to the live database.

Coverage: weekday recurrence, overnight shifts, a prior-week conflict, adjacent shifts, editing with self-exclusion, day/week copying into occupied periods, canceled shifts, partial failures and retry, failed conflict lookups, invalid recurrence ranges, the Europe/Berlin daylight-saving change, and mobile horizontal overflow at 390px. Browser JavaScript errors also fail the tests.

Optional environment variables: `AONE_CHROMIUM_PATH` selects an installed Chromium executable, `AONE_CHROMIUM_ARGS` supplies a JSON array of launch arguments, and `AONE_SCREENSHOT` saves the mobile screenshot.

## Limits before production release

Client preflight checks are now backed by the exclusion constraint in `supabase/migrations/20260921094206_guard_operational_integrity.sql`. The live SQL regression checks its presence and overlapping/adjacent shifts. A concurrent load test and the full role/RLS matrix remain outside this suite.

Series are saved one shift at a time. The result reports individual failures; successful writes are retained. Retrying assigned shifts skips existing overlapping assignments. Unassigned shifts can intentionally coexist and are not deduplicated.


The operations suite covers tasks, quality audits, form creation/submission/review, automation configuration, lone worker RPC flows, hashed API keys/revocation, mobile rendering, permission UI, error handling, pagination and escaping. The NFC suite simulates a lost response, retry, reload and a fresh scan. All browser network calls are intercepted.

`backend-integrity.sql` must run on an existing Guard database with a management connection. It creates synthetic fixtures inside a transaction and rolls them back, including audit records. It is not a schema bootstrap or a complete RLS test.

## Pilot time integrity (no browser or dependencies)

```sh
node --test tests/time-integrity.test.cjs
```

15 tests exercise the actual shared calculation, paginated API client, employee
access transition, payroll and time-management scripts with mocked API/DOM
boundaries. Cases include pauses, overlap, corrected boundaries, open pauses,
month rollover, DST, more than one API page, missing pause data, disabled exports
and partial access-update failures. These do not prove RLS or real browser behavior.

## Planning integrity (no browser or dependencies)

```sh
node --test tests/*.test.cjs
```

30 tests across time and planning integrity. The planning suite executes the
actual planner functions with API/DOM boundaries simulated: approved absences,
pending sickness, night shifts, midnight boundaries, mandatory qualification
validity and renewal, unavailable checks, stale assignments, partial weekly
release and copying into absences. Browser fixtures support the additional
lookups, but browser execution still requires the documented Chromium setup.


## RLS role matrix

`tests/rls-matrix.sql` is a transactional role-isolation regression for the existing Guard database.

It creates synthetic owner, admin, dispatcher, employee and outsider accounts, then executes reads under the real `authenticated` database role with different JWT subjects. It verifies:

- employees only see their own employee row, assigned shifts and allowed documents;
- dispatchers can manage operational team data but cannot read private HR rows;
- admins/owners can read private HR data;
- outsiders cannot read another tenant's organization, sites, employees, shifts or documents;
- authenticated clients have no direct SELECT grant on `guard_question_keys`.

The test rolls back all fixtures and audit rows. It assumes all Guard migrations in the candidate branch are already applied. It is not a substitute for application-level authorization tests of every RPC/write path.

### Audit trigger regression found during RLS verification

The role-matrix dry run exposed that `guard_private.audit_guard_ops_change()` assumed every audited table had an `id` column. `guard_employee_private` uses `employee_id` as its primary key, so inserts could fail before RLS evaluation. Migration `20261006141000_guard_audit_generic_row_id.sql` fixes the generic trigger to resolve row identity safely from JSON data.

The migration plus the RLS matrix were executed together inside a real Supabase transaction and fully rolled back; all matrix checks passed.
