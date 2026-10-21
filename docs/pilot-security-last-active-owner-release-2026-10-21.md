# Release-Nachweis: mindestens ein aktiver Firmeninhaber

**Geprüft am:** 21.10.2026  
**Projekt:** A One Guard – Supabase `rwojydgekobbckpcvlnu`.  
**GitHub-Fix:** [PR #30](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/pull/30) (`134112d83d2a93c71dd1de8999c25247ad2eee31`).

## Nachgewiesene Lücke

Die alte Routine `public.guard_set_member_role` prüfte beim Zurückstufen eines Inhabers, ob mindestens zwei Einträge mit `role='owner'` existieren. Dabei wurden auch **deaktivierte** Owner mitgezählt. Ein aktiver Firmeninhaber konnte daher bei nur einem weiteren, inaktiven Owner sein Konto selbst zu Admin zurückstufen. Im Ergebnis hatte die Organisation **keinen aktiven Owner**.

Das Verhalten wurde mit synthetischen Usern unter der normalen Datenbankrolle `authenticated` auf dem tatsächlichen Backend reproduziert. Alle Datensätze wurden zurückgerollt.

## Produktivfix

- Bei der Herabstufung zählen nur `role='owner' AND active=true`-Mitgliedschaften.
- `guard_set_member_role` und `guard_set_member_active` nutzen dieselbe transaktionsgebundene Advisory Lock pro Organisation (`aone:membership-owner-state:<org_id>`), sodass sich die beiden Owner-Veränderungswege bei zeitgleichen Transaktionen gegenseitig serialisieren sollen.
- Funktionssignaturen und bestehende Rollen- und Tabellenberechtigungen unverändert. Administratoren dürfen weiterhin keine Owner-Rollen vergeben oder verändern.
- Freigegebener Code: [Migration](../supabase/migrations/20261021104642_guard_last_active_owner_integrity.sql).
- Produktionsinstallation über Supabase-Migrationsverwaltung: **erfolgreich**, registriert unter **`20261021104642_guard_last_active_owner_integrity`**.

## Nach Installation erfolgreich geprüfte Regressionen

| Prüfung | Ergebnis |
| --- | --- |
| Inhaber-Rollenintegrität (inaktiver zweiter Owner, zulässige Owner-Übergabe, unerlaubte Demotierung, Admin-/Outsider-Abwehr, Zugangssperre) | **11/11 PASS** |
| RLS-Rollenmatrix | **43/43 PASS** |
| Aktive Mitarbeiterzuordnung / Schichttausch | **9/9 PASS** |
| Sperrung dreier bisher problematischer RPCs | **7/7 PASS** |
| Bestehende Backend-Integrität | **PASS** |

**Alle fünf Test-Suites** wurden nach dem Rollout zusammen in einer PostgreSQL-Transaktion ausgeführt und mit `ROLLBACK` abgeschlossen. Die DB-Funktionen wurden außerdem aus `pg_proc` verifiziert: beide enthalten die neue Advisory Lock; die Rollenänderungsroutine zählt nur aktive Owner. Der entsprechende [Pilot-CI-Run #116](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/actions/runs/39586881535) war erfolgreich (Unit/Syntax und Browser).

Der Disponenten-Sonderfall wurde separat geprüft: Ein Disponent kann einen Mitarbeiter **ohne** verbundenes Login deaktivieren. Ein bestehendes Login darf er nicht über `guard_set_employee_active` deaktivieren, weil dies die Owner-/Admin-geschützte Kontoberechtigung verändern würde. Diese bestehende Rollenabgrenzung wurde nicht aufgeweicht.

## Grenzen

- Die gemeinsame Advisory Lock wurde aus SQL-Code und sequentiellen Funktionsprüfungen nachgewiesen; ein **echter Paralleltest mit unabhängigen gleichzeitigen Verbindungen** wurde nicht durchgeführt.
- Direkte Service-Role-/Datenbankadministrationsmutationen sind kein Bestandteil der normalen Benutzer-RPC-Garantie und werden nicht durch das neue Rollen-API-Locking kontrolliert.
- Die 59 privilegierten `SECURITY DEFINER`-RPCs aus [Issue #18](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/issues/18) sind nicht durch diese einzelne Änderung insgesamt freigegeben. Mobile NFC-Feldtests und End-to-End-Disponenten-Alarmzustellung stehen weiter aus.

**Bewertung:** Der reproduzierte Letztinhaber-Lockout wird jetzt durch die produktive Rollen-RPC unterbunden. Die gesamte SaaS-Plattform ist damit noch nicht vollständig sicherheits- oder pilotfreigegeben.
