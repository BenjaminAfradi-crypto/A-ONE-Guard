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


### Membership mutation boundary

The write portion of the RLS matrix also verifies that authenticated clients have no direct INSERT, UPDATE or DELETE privilege on `guard_memberships`. Membership mutations must go through the guarded SECURITY DEFINER RPCs.

This closes a concrete bypass found during the pilot review: with the previous broad `guard_members_manage` policy, an admin could directly PATCH an owner's membership row through PostgREST and bypass the protections in `guard_set_member_role`. Migration `20261006142000_guard_membership_mutation_rpc_only.sql` removes direct membership DML while preserving guarded RPC flows.

The combined audit-fix migration, membership-hardening migration and RLS matrix were executed in one real Supabase transaction. The role matrix has since been expanded to 43 checks; the current live backend passed all 43 on 20.10.2026 and the test transaction was rolled back.


## Pilot server-side regression extension (20.10.2026)

`tests/backend-integrity.sql` now also tests the database's real shift trigger for approved vacation, pending sickness, missing/expired mandatory qualification, a renewed proof, and foreign-tenant object rejection. All six additional checks passed against the existing A One project on 20.10.2026. The SQL starts with `BEGIN` and ends with `ROLLBACK` and is intended for an approved management/test connection only; **do not run it automatically in public PR CI**.

`tests/rls-matrix.sql` now includes four additional checks for direct shift INSERT/UPDATE as `employee`, an authorized `dispatcher` INSERT, and a cross-tenant `outsider` INSERT. All **43 checks** passed using actual `authenticated` role and simulated JWT subjects in one rolled-back transaction on 20.10.2026.

A successful integration test is not a concurrent stress test or an external API penetration test. See `docs/pilot-backend-verification-2026-10-20.md` for the evidence and open risks.


## Offene Krankmeldung: Besetzungswarnung (20.10.2026)

Migration: `supabase/migrations/20261020164612_guard_pending_sick_staffing_escalations.sql`.

`tests/pending-sickness-escalation.sql` führt nach Anwendung der Migration 12 Regressionen mit synthetischen Benutzern und einer `BEGIN`/`ROLLBACK`-Transaktion aus: offene Krankmeldung, anschließende Genehmigung, Bestätigungserhalt, Verschiebung, Wiederaktivierung, Ablehnung, Urlaub, Wiederholung, Stornierung, mehrere betroffene Objekte, Aktualisierung der betroffenen Objekte und Statuswechsel.

Die Migration und die 12 Tests wurden am 20.10.2026 zusammen innerhalb **einer einzigen echten PostgreSQL-Transaktion** ausgeführt, bevor sie zurückgerollt wurden. Auch die einmalige Nachmeldung bereits existierender offener Krankmeldungen wurde mit einer vor dem Triggerwechsel erzeugten synthetischen Abwesenheit geprüft.

**Achtung:** Die GitHub-CI führt diese SQL-Suite absichtlich nicht mit Produktionsdatenbankzugang aus. SQL-Tests nur im freigegebenen Entwicklungs-/Stagingkontext durchführen. Der Nachweis der Transaktion beweist nicht, dass die Migration in Produktion bereits ausgerollt wurde; anschließend Migrationshistorie und Alarmzustellung getrennt prüfen.


## Dienststornierung und Abwesenheitseskalation – Issue #23

Migration: `supabase/migrations/20261020170125_guard_shift_absence_alert_reconciliation.sql`.

Die private Funktion `guard_private.reconcile_shift_absence_alert()` wird durch einen Trigger auf `guard_shifts` nach relevanten Updates oder DELETE aufgerufen. Die Routine aktualisiert **bereits aktive** Besetzungswarnungen für den ursprünglich eingeteilten Mitarbeiter. Sie reduziert die Anzahl betroffener Dienste, aktualisiert erstes Objekt/Fälligkeit und löst einen Alarm automatisch auf, wenn kein betroffener Dienst mehr existiert. Status `acknowledged` und `acknowledged_by` bleiben bestehen, solange weitere Dienste betroffen sind. Manuell erledigte Alarme werden durch Dienstplanänderungen nicht wieder geöffnet.

Der SQL-Regressionslauf `tests/shift-absence-alert-reconciliation.sql` umfasst Stornierung bei mehreren Diensten, Stornierung des letzten Dienstes, Datumsverschiebung, Personalaustausch, den vorhandenen serverseitigen Schutz vor Umbuchung während genehmigter Abwesenheit, DELETE und die Eindeutigkeit des Alerts. Er wurde am 20.10.2026 gemeinsam mit der Migration innerhalb **einer** Transaktion auf der echten A-One-Datenbank ausgeführt: **PASS, 7 Szenarien**; `ROLLBACK` hat Funktionsänderungen und Testdaten rückgängig gemacht.

Die Datenbankmutation erfolgt nicht in GitHub-CI. Diese verifiziert weiterhin Syntax, Unit-/Browser-Regressionen. Eine dauerhafte Installation ist erst mit explizitem Migrationsaufruf und erfolgreichem Post-Deploy-SQL-Test nachgewiesen.

## Privileged RPC membership checks (20.10.2026)

`tests/suspended-account-rpc-security.sql` enthält sieben transaktionale Sicherheitsprüfungen mit künstlichen `authenticated`-Benutzern: Zugriff auf Gehaltsübersicht trotz Kontosperre, Umgehen einer Sperre über die zweite Unternehmensanlage-Funktion, Schulungsabschluss trotz Sperre sowie erlaubte Nutzungen durch aktive Mitarbeiter und einen neuen Nutzer. Alle Fixtures werden zurückgerollt.

Die auf `guard_create_organization`, `guard_my_month_summary` und `guard_finish_attempt` beschränkte Migration wurde gemeinsam mit den Tests **nur testweise** auf das bestehende Schema angewendet (eine `BEGIN/ROLLBACK`-Transaktion): **7/7 PASS**. Eine solche Prüfung schreibt keine dauerhaften Funktionen oder Benutzer. Für den späteren Produktivrollout ist eine eigene Migrationsanwendung mit anschließender Live-Rückroll-Regression erforderlich.

Die 59 statisch gesichteten und privilegierten RPCs sind im [Sicherheits-Audit](../docs/security-definer-audit-2026-10-20.md) inventarisiert. Das Erkennen von Auth-Signalen ist kein Sicherheitsnachweis für die übrigen Funktionen.


**Produktivprüfung 20.10.2026:** Die Migration `20261020173722_guard_suspended_account_rpc_security` wurde über Supabase erfolgreich installiert. Die 7 neuen RPC-Regressionen, 43/43 RLS-Rollenchecks und der Backend-Integritätstest wurden anschließend mit vollständigem `ROLLBACK` erneut ausgeführt und bestanden.


## Mitarbeiter-Zuordnung nur mit aktiver Mitgliedschaft

`tests/employee-id-active-membership.sql` prüft neun Fälle: aktive Mitarbeiteridentität, gesperrten Mandanten bei gleichzeitig aktivem anderem Mandanten, Mitarbeiterdeaktivierung, fremde Benutzer, gesperrten und erlaubten Schichttausch sowie erfolgreiche Wiederfreigabe. Der Fix für `guard_private.employee_id_for()` wird vorher über die zugehörige Migration temporär in einer einzelnen zurückgerollten Datenbanktransaktion getestet. Der kombinierte Test mit den bisherigen RPC-/RLS-/Backend-Tests war erfolgreich; keine permanente Änderung durch diesen Vorabtest.


**Produktivabgleich:** Der geteilte Mitarbeiter-Helfer wurde in Supabase als `20261020174655_guard_employee_id_for_membership_hardening` angewendet und mit dem Test `tests/employee-id-active-membership.sql` nachgeprüft (9/9 PASS).
