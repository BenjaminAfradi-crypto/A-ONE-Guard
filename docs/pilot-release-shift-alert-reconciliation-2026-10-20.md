# Release-Nachweis – Dienststornierungen und Besetzungswarnungen

**Datum:** 20.10.2026  
**Supabase-Projekt:** A One, `rwojydgekobbckpcvlnu` (eu-central-1)  
**GitHub-Fix:** [PR #24](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/pull/24), Merge-Commit `dd27d2be3f3163614344fa9dbdaadad0be794b94`.

## Produktivänderung

- Migration **`20261020170125_guard_shift_absence_alert_reconciliation`** per Supabase-Migrationsverwaltung **erfolgreich angewendet**.
- Die Repository-Datei wurde auf die tatsächliche Historienversion ausgerichtet: `supabase/migrations/20261020170125_guard_shift_absence_alert_reconciliation.sql`.
- Die interne Funktion `guard_private.reconcile_shift_absence_alert()` und genau der neue Trigger `guard_shift_absence_alert_reconcile` auf `guard_shifts` sind installiert; der Trigger ist aktiviert.
- Für `anon` und `authenticated` ist die interne Funktion **nicht direkt ausführbar**.
- Kein neuer öffentlicher RPC, keine RLS-Policy-Änderung, kein Zugriff auf reale Mitarbeiterdaten in Tests.

## Nach Installation geprüfte Funktion

| Nachweis | Ergebnis |
| --- | --- |
| Stornierung einer von mehreren betroffenen Schichten | Verbleibender Alarm bleibt erhalten; Anzahl, nächstes Objekt und Termin werden aktualisiert |
| Stornierung des letzten betroffenen Dienstes | Alarm wird automatisch erledigt |
| Erhalt bereits bestätigter Warnung, wenn ein Risiko verbleibt | PASS |
| Verschiebung des Dienstes außerhalb des Abwesenheitszeitraums | Alarm erledigt |
| Umbesetzung auf einen anderen Mitarbeiter | Frühere Besetzungswarnung erledigt |
| Serverseitige Dienstplan-Validierung bei genehmigter Abwesenheit | Bleibt durchgesetzt; abgewiesene Umbuchung verändert Alarm nicht |
| DELETE eines betroffenen Dienstes | Alarm erledigt |
| Eindeutiger Alarm je Abwesenheit / keine Dubletten | PASS |
| **Neue SQL-Regressionen** | **7-Szenarien-Suite bestanden** |
| **Alte Krankmeldungs-Lifecycle-Regressionen** | **12-Szenarien-Suite bestanden** |

Beide SQL-Testdateien wurden **nach produktiver Migration direkt auf der echten PostgreSQL-Datenbank** ausgeführt, jeweils innerhalb eigener `BEGIN ... ROLLBACK`-Transaktionen. Alle synthetischen Benutzer, Organisationen, Schichten, Abwesenheiten und Eskalationen wurden zurückgerollt.

**GitHub CI:** [Run #104](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/actions/runs/39462287376) bestand Syntax-/Unit- und Browser-Regressionsprüfungen.

## Unveränderte Risiken

- Der Supabase Security Advisor meldet weiterhin **59 Warnungen** wegen für `authenticated` ausführbarer `SECURITY DEFINER`-Funktionen, **eine Warnung** zu kompromittierten Passwörtern und **zwei INFO**-Hinweise zu Tabellen mit RLS ohne direkte Policies. Die 59 Warnungen sind **nicht** gleichbedeutend mit 59 bestätigten ausnutzbaren Fehlern.
- **Parallele DB-Lasttests** mit zwei eigenständigen gleichzeitigen Verbindungen, die vollständige Disponenten-Bedienung, Alarmzustellung und reale NFC-Geräteprüfung sind noch offen.
- Die Rollenmatrix-/Mandanten-Regressionen wurden in der vorangegangenen Arbeit mit 43/43 Punkten bestanden; die neue Triggerintegration wurde nicht als kompletter externer Penetrationstest bewertet.

## Ergebnis

**Issue #23 ist für den reproduzierten Stornierungsfehler serverseitig behoben und produktiv verifiziert.** Die Gesamtsoftware wird dadurch noch nicht als vollständig pilotbereit freigegeben.

Referenzen: [Regressionstest](../tests/shift-absence-alert-reconciliation.sql), [Migration](../supabase/migrations/20261020170125_guard_shift_absence_alert_reconciliation.sql), [Pending-Sickness-Tests](../tests/pending-sickness-escalation.sql).
