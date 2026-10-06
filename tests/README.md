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
