# Blocking checks before an EGNAS pilot

Record date, tester, project version and evidence for each check. All are currently unrun on Floot unless explicitly noted.

| Check | Expected result | Status |
|---|---|---|
| Existing owner login | Existing manager reaches the correct tenant; no new account receives owner automatically | Pending live |
| Dependency review | Supported patched Excel reader installed; unused xlsx removed; actual DB/router dependencies reviewed | Pending actual platform |
| Real Floot typecheck | Full project compiles after schema regeneration; existing auth/UI interfaces are compatible | Pending live |
| Database migrations | Preflight has no conflicting identities; migrations and regenerated schema succeed | Pending live |
| Employee XLSX import | Preview identifies rows; apply creates/updates exactly the accepted count | Local parser/planner pass; live pending |
| Repeat import | No duplicate employees or shifts; no extra successful batch for an empty repeat | Local planner pass; live pending |
| Partial import | Invalid rows remain visible and skipped; manager explicitly imports the accepted count | Local planner pass; UI/live pending |
| Manual/import overlap race | Two simultaneous overlapping writes cannot both commit for one employee | Pending database integration |
| Preview/apply race | Apply revalidates current records instead of trusting stale preview | Pending database integration |
| Invitation round-trip | Correct invited email creates or joins only the intended employee account | Pending live |
| Invitation expiry/replay | Expired, consumed or replaced token is rejected; simultaneous acceptance links once | Pending live |
| Invitation mismatch | Wrong email, changed employee email, disabled employee and linked employee fail | Pending live |
| Manager endpoints as employee | Employee cannot list employees, import, invite, view payroll/reporting or manage sites | Pending all endpoint checks |
| Tenant A/B isolation | IDs/header/cookie from another tenant never reveal or mutate its data | Pending two-tenant integration |
| Personal duty plan | Employee A sees only A's shifts and entries, never B's, after a shared file import | Pending live |
| Tenant switching | Membership is checked; stale cached data disappears; employee selection works | Pending browser/live |
| NFC clock-in/out | Assigned employee/site, duplicate taps and invalid tokens behave correctly | Pending existing-module tests |
| Break sequence | Start/end/pause states and server times are consistent, invalid transitions rejected | Pending existing-module tests |
| Patrol/checkpoint | Invalid checkpoint and foreign-tenant scans fail; valid assigned scans persist | Pending existing-module tests |
| Incidents/reporting | Saved data persists, authorization holds, report totals reconcile | Pending existing-module tests |
| Mobile/browser | /import and invitations fit phone screens; loading/errors/copy states work | Pending visual checks |
| Production origin guard | JSON writes succeed from app origin and fail from a foreign origin | Local guard pass; hosting pending |
| Recovery | Backup/restore procedure and ownership are documented and tested | Pending |
| Production smoke | Published app login, import, invite acceptance and personal plan work | Pending publication |

Do not mark an item complete merely because the code or table exists.
