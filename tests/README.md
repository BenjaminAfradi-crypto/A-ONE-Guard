# Dienstplan regression tests

Requirements: Node.js 20+ and Playwright 1.62.1.

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
node --test tests/dienstplan.browser.cjs
```

The suite opens the real planner HTML, CSS, core client and planner JavaScript in Chromium. Every network request is intercepted; Supabase responses and writes are simulated. It requires no credentials and never writes to the live database.

Coverage: weekday recurrence, overnight shifts, a prior-week conflict, adjacent shifts, editing with self-exclusion, day/week copying into occupied periods, canceled shifts, partial failures and retry, failed conflict lookups, invalid recurrence ranges, the Europe/Berlin daylight-saving change, and mobile horizontal overflow at 390px. Browser JavaScript errors also fail the tests.

Optional environment variables: `AONE_CHROMIUM_PATH` selects an installed Chromium executable, `AONE_CHROMIUM_ARGS` supplies a JSON array of launch arguments, and `AONE_SCREENSHOT` saves the mobile screenshot.

## Limits before production release

The conflict check is a client preflight query against the saved shifts visible to the manager. It is not an atomic database constraint: concurrent writes by multiple dispatchers still require server-side enforcement. The repository does not contain the database schema, RLS policies or migrations needed to verify or implement that enforcement safely. Live Supabase integration, permissions and concurrent submissions have not been verified by this suite.

Series are saved one shift at a time. The result reports individual failures; successful writes are retained. Retrying assigned shifts skips existing overlapping assignments. Unassigned shifts can intentionally coexist and are not deduplicated.
