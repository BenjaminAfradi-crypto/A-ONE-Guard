# A ONE Guard: Floot launch transfer

Target: Floot project `836242b9-0ade-4b74-bf3a-422018334f39`, published at https://a-one-guard.floot.app.
Source inspection: 7 October 2026, version `1791364802566`.
This directory is a transfer package for that app, not a replacement of the separate static GitHub/Vercel application.

## Prepared behavior

- A management page at `/import` accepts employee and shift XLSX/CSV files, previews mappings and errors, then explicitly applies valid rows.
- Employee numbers and email addresses must agree. Ambiguous identities, inactive records and linked-account email changes are rejected.
- Repeated shifts are skipped; overlaps are rejected. Imports and manual shift creation share a tenant-scoped transactional lock.
- Shift imports create assigned database records. The personal employee endpoint filters by authenticated employee and tenant and shows the next 93 days.
- Employee access uses a random 256-bit, single-use invitation expiring after 48 hours. Only its SHA-256 digest is stored.
- Registration requires a valid invitation for that exact email. The former automatic first-registrant owner path is removed.
- Existing authenticated users can accept a matching invitation. Administrative roles are never granted by an invitation.
- A tenant switcher validates membership, stores the selection in a secure HttpOnly cookie, and clears client data on switch.
- The historical `getPilotOrgContext` helper is kept for compatibility but no longer hardcodes EGNAS; it restricts management endpoints to owner/admin/dispatcher.

## What was actually verified

`npm ci && npm test && npm run check`

40 local tests passed on Node 24.19.0. Tests exercise the real import planner, XLSX parser with a file round-trip, Berlin/DST conversion, invitation token generation, request-origin checks and tenant cookie parsing.
The XLSX file round-trip uses the reader’s Node adapter with the same parser logic; the browser adapter must still be tested in Floot.
Strict TypeScript compilation passed against the recovered generated data model and compile-only adapters for unavailable Floot files.

The adapters in `verification/check.mjs` are deliberately excluded from transfer. They are NOT proof of compatibility with every current Floot UI/auth component.
No live database migration, authenticated endpoint integration test, browser rendering test or production deployment was performed: Floot's build cap stopped further project access.
Never describe this package as a verified production launch until the checks below pass.

## Transfer order after Floot access returns

1. Read `list_files`, `static/__dev/history.md`, resources and publish status again. Confirm the same project and check changes since the source version. Read every existing target file before replacing it. Preserve concurrent work rather than overwriting it.
2. Create a checkpoint of the current state. Check existing manager login and tenant membership. Keep a tested owner account; there is intentionally no public administrator signup.
3. Run `migrations/000_preflight.sql` read-only. Confirm UUID organization/employee IDs and bigint user IDs, all required import columns, and empty duplicate reports. Resolve any conflicts with the user; do not automatically delete or merge personnel records.
4. Apply migration 001, then 002 on the Floot-managed database. These contain no employee deletions or owner creation. If they fail, stop and inspect the actual schema. Never apply them to the separate Supabase project.
5. Let Floot regenerate `helpers/schema.tsx`. The recovered fixture is for verification only: do not upload it over the generated schema.
6. Add the exact dependency `read-excel-file@9.3.10` through Floot add_dependency and verify it is supported. If it is rejected, stop and select a supported patched reader; do not revert to the vulnerable xlsx npm package. Search project references before removing the now-unused `xlsx` dependency. Then compare the existing `User`, `useAuth`, registration wrapper, session helpers, Input/Button/Select APIs and pageLayout format with the package. Adapt compatibility differences. Keep the session-validation code and DB helper that already work in Floot.
7. Generate small transfer patches with `npm run patches`. Apply only `floot/` files using Floot's apply_patch, with a fresh expected_version per mutation. Transfer helpers and schemas before their dependents. The patch generator excludes migrations and verification fixtures.
8. Run Floot's own full typecheck and check server/browser logs. Verify that the origin seen by the backend matches browser Origin in both preview and production. Adjust only from observed hosting behavior, never disable the same-origin guard globally.
9. Execute every blocking check in `LAUNCH-CHECKS.md` with isolated synthetic tenants and users. Clean up only identified test data after inspection. Use no real personnel spreadsheet until tenant separation and invite ownership are verified.
10. Visually verify desktop and phone layouts for /import, /einladung and tenant switching. Create a feature checkpoint, then publish the existing Floot app. Read publish/job status to completion and repeat smoke tests on the published domain.

## Existing components not included

Floot already contains the DB connection, server session verification/cookie signing, login/logout/session endpoints, seeded Input/Button/Select/ProtectedRoute, employee home schema and manual shift schema.
The package imports these existing modules. Compile-only adapters are intentionally not deployable implementations of them.

## Access and data notes

- Invitation links must be delivered by the manager to the intended employee through a private channel. The UI does not send messages automatically. A newly generated link invalidates prior invitations.
- Invitation secrets use URL fragments, so they are not sent in normal HTTP request URLs. Do not move tokens into query parameters, analytics, audit metadata or logs.
- Employee number strings should be stored as text in Excel to retain leading zeros.
- CSV and Excel dates use German local time. Nonexistent or ambiguous DST times are rejected for manual handling. The XLSX reader handles workbook date systems; old binary XLS files must first be saved as XLSX.
- Shift imports never overwrite an existing shift. Corrections to an existing schedule require a separate authorized correction flow.
- Backend authorization is enforced per request. The tenant cookie selects a context; it does not grant access.
- Manager-originated changes through these endpoints are serialized; direct database writes must still respect the same invariants.
- No Vercel, Supabase or external Neon configuration was modified. Floot's own Postgres is the target.

## Remaining launch scope

The package closes the identified Excel/invitation/context gaps. Existing NFC, clock-in/pause sequences, patrols, incidents, reporting, compliance, backups, recovery and privacy behavior must be tested in the running app.
Commercial billing, additional tenant provisioning, public launch documents and the full historical feature list are not certified by this package.

## Dependency review

The recovered project used xlsx 0.18.5. npm audit identified SheetJS prototype-pollution and ReDoS advisories without an npm fix. The prepared importer replaces it with read-excel-file 9.3.10. Its install/support must be confirmed by Floot before transfer.

`verification/dependency-audit.json` records the local verification stack audit. The legacy Kysely version is retained solely to compile against Floot’s existing Kysely/db helper contract; its reported JSON-path and MySQL-literal advisories must be assessed against the actual app and an upgrade tested after access returns. Prepared SQL uses bound parameters, no `sql.lit`, no MySQL, and no user-controlled JSON paths. The local Router stack also has reported advisories; it is a compile dependency, not the Floot platform’s installed dependency report. Do not infer the platform’s dependency versions from it. Audit and upgrade the real installed stack before public launch.
