# A ONE Guard – Backend-Pilotprüfung vom 20.10.2026

## Ergebnis

Die echte A-One-Supabase-PostgreSQL-Datenbank wurde am 20.10.2026 mit **synthetischen Testkonten, Objekten und Diensten in Transaktionen mit abschließendem `ROLLBACK`** geprüft. Dies ist keine vollständige Produktionsfreigabe.

| Prüfbereich | Ergebnis |
| --- | --- |
| RLS-Rollenmatrix (`tests/rls-matrix.sql`) | **43 / 43 PASS** |
| Direkte Dienstplan-Schreibzugriffe | Employee INSERT/UPDATE abgewiesen, Dispatcher INSERT zugelassen, Outsider INSERT abgewiesen |
| Backend-Integrität (`tests/backend-integrity.sql`) | **PASS**, einschließlich sechs zusätzlicher Schichtvalidierungsfälle |
| Urlaub genehmigt / Krankheit offen | Bei neuem Dienst serverseitig blockiert |
| Qualifikation fehlt / abgelaufen | Bei neuem Dienst blockiert |
| Qualifikation gültig | Dienst zugelassen |
| Objekt anderer Mandant | Dienst abgewiesen |
| Datenänderungen durch Prüfungen | Testfixtures durch `ROLLBACK` nicht dauerhaft gespeichert |

**Prüfkontext:** Aktives Projekt `A One` in Region eu-central-1. Als Nachweise gelten die beiden versionierten SQL-Testdateien und die in der Prüfung zurückgegebenen `PASS`-Ergebnisse. Die Prüfungen verwenden echtes PostgreSQL, nicht die simulierten Browser-Antworten.

## Bestätigte Sicherheitsmechanismen

- `guard_shifts_no_employee_overlap`: Exclusion Constraint gegen gleichzeitige Beschäftigung desselben Mitarbeiters in überschneidenden Diensten.
- `guard_shifts_validate` und `guard_private.validate_shift_row()`: Prüfen Status von Mitarbeiter/Objekt, Abwesenheiten, Qualifikationen, Ruhezeit, Organisationsgrenzen; Schreibzugriffe je Mitarbeiter werden per Advisory Lock serialisiert.
- `guard_shifts_manage`: RLS-Berechtigung an `guard_private.can_manage(org_id,auth.uid())` gebunden.
- Rollenmatrix schützt Inhaberrolle, private Personalakte und Mandantenisolation in den definierten Tests.

## Noch nicht ausreichend nachgewiesen

1. Ein **echter Parallel-Lasttest** mit zwei gleichzeitig schreibenden Transaktionen; synthetische sequenzielle SQL-Szenarien beweisen dies nicht.
2. End-to-End auf echten iOS-/Android-Geräten mit NFC-Tags, offline, erneuter Anmeldung und unterbrochener Netzwerkverbindung.
3. Jede privilegierte RPC-Funktion: Der Security Advisor meldete **59 WARN** zu authentifiziert ausführbaren `SECURITY DEFINER`-Funktionen. Das ist eine Prüfpriorität, nicht der Beweis, dass alle 59 gefährlich sind.
4. **1 WARN** zur fehlenden Passwortprüfung gegen kompromittierte Passwörter. **2 INFO** zu Tabellen mit aktivem RLS ohne direkte Policies (`guard_private.nfc_requests`, `public.guard_document_counters`), die gezielt über Funktionen angesprochen werden.
5. Änderungen **nach** Dienstfreigabe, etwa neu genehmigte Abwesenheit: Der aktuelle `guard_leave_shift_escalation`-Trigger erzeugt für genehmigte Abwesenheiten Eskalationen. Sein Verhalten bei neu erfassten **offenen Krankmeldungen** ist gesondert zu prüfen.
6. Noch keine externe Sicherheitsprüfung, vollständige Datenschutzabnahme oder tatsächliche Pilotfreigabe.

## Hinweise

Die produktive Anwendung und Datenbankschema wurden durch diese Testentwicklung **nicht geändert**. GitHub-CI testet weiterhin Code und Browser ohne Verbindung zur Live-Datenbank. RLS-/Backend-SQL-Tests sollen nur mit freigegebenem Datenbankzugang und überprüfter `ROLLBACK`-Klammer gezielt ausgeführt werden.

Quellen:
- [GitHub Backend-Integritätstest](../tests/backend-integrity.sql)
- [GitHub RLS-Rollenmatrix](../tests/rls-matrix.sql)
- [Supabase: Privilegierte Funktionen](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Supabase: Passwortschutz](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
