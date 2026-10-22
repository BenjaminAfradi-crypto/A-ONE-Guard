# Produktionsnachweis – Kundenportal, Mandantentrennung und Tickets

**Datum:** 22.10.2026  
**System:** A One Guard, Supabase-Projekt `rwojydgekobbckpcvlnu`  
**Code:** [Fix PR #32](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/pull/32), Merge `bbad7e15a07bc0bf93c78a28fba4e05e13a9527c`.

## Vor der Korrektur bestätigt

1. Ein Kunde mit Status `inactive` und weiterhin aktivem Portalzugang konnte über `guard_customer_create_ticket` neue Tickets erstellen, obwohl `guard_customer_portal_snapshot` den gesperrten Kunden korrekt ablehnte.
2. Ein berechtigter Firmenmanager konnte `guard_customer_portal_access` mit seiner eigenen Firma, aber der Kunden-ID einer *anderen* Firma anlegen. Mit dieser widersprüchlichen Berechtigung konnte ein Portalnutzer ein Ticket schreiben, dessen `org_id` und `customer_id` nicht zur selben Firma gehörten.

Beides wurde mit synthetischen Firmen, Benutzerkonten und `SET LOCAL ROLE authenticated` direkt in der aktuellen PostgreSQL-Datenbank reproduziert und vollständig zurückgerollt. Vor dem Produktivrollout lagen **keine bereits existierenden fehlerhaften Portal-/Ticket-/Objektverknüpfungen** vor; zu diesem Zeitpunkt enthielt das Projekt noch keine Kundenportalberechtigungen oder Supporttickets.

## Produktiver Fix

- Zusammengesetzte Foreign Keys verknüpfen `(org_id,customer_id)` in Portalberechtigungen und Tickets mit genau einem Kunden derselben Firma.
- Bei Ticketstandorten wird zusätzlich `(org_id,customer_id,site_id)` an das zum Kunden gehörende Objekt gebunden. Ein optionaler NULL-Standort bleibt erlaubt.
- Die Ticketfunktion `guard_customer_create_ticket` akzeptiert nur aktive Kunden und aktive Kundenportal-Zuordnungen im gleichen Mandanten.
- Ticket-INSERT- und -SELECT-RLS nutzt `guard_private.can_use_customer_portal(org_id,customer_id)`. Dieser neue private SECURITY-DEFINER-Helfer wertet ausschließlich `auth.uid()` aus, prüft Portalberechtigung und Kundenstatus und lässt sich von `anon` nicht ausführen.
- Der legitime Portalzugriff benötigt weiterhin **kein SELECT-Recht auf die zentrale Kundentabelle**. Manager dürfen bisherige Kundenhistorie im eigenen Mandanten weiter einsehen.

**Migration in Produktion erfolgreich angewendet:** `20261022125922_guard_customer_portal_tenant_integrity`. Die identische GitHub-Migrationsdatei liegt unter [supabase/migrations/20261022125922_guard_customer_portal_tenant_integrity.sql](../supabase/migrations/20261022125922_guard_customer_portal_tenant_integrity.sql).

## Prüfungen nach Produktivinstallation

| Prüfung | Ergebnis |
|---|---|
| Kundenportal: gültige Tickets, gesperrte Kunden, fremde Firma/Objekte, direktes RLS, private Berechtigungsfunktion | **18/18 PASS** |
| RLS-Rollenmatrix | **43/43 PASS** |
| Schutz des letzten aktiven Inhabers | **11/11 PASS** |
| Aktive Mitarbeiteridentität | **9/9 PASS** |
| Sperrung der privilegierten Konto-RPCs | **7/7 PASS** |
| Backend-Integrität | **PASS** |
| [GitHub Pilot CI #120](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/actions/runs/39782711143) | **SUCCESS** |

Alle SQL-Prüfungen liefen mit ausschließlich synthetischen Daten in `BEGIN ... ROLLBACK`-Transaktionen. Die Migration ist in Supabases produktiver Versionshistorie nachgewiesen.

## Offene Prüfungen

- Noch kein echter End-to-End-Test mit einem separat angemeldeten Kundenkonto und kundenseitigen Browser-/App-Abläufen.
- Die Kunden-/Dokumentenfunktionen sind **nicht vollständig** geprüft. Für Dokumente verbleiben insbesondere Storage-Pfad-/Scope-Sicherheit, Versionierung und Negativtests mit fremden Mitarbeitern oder Organisationen.
- Der Security Advisor meldet weiterhin **59 WARN** zu authentifiziert ausführbaren PUBLIC-`SECURITY DEFINER`-Funktionen, **1 WARN** zur deaktivierten Leaked-Password-Protection und **2 INFO** zu Tabellen ohne direkte RLS-Policies. Diese Kennzahlen waren nach dem Fix unverändert; sie entsprechen nicht 59 nachgewiesenen Schwachstellen.
- Echte NFC-Feldtests, Disponenten-Alarmzustellung, parallele Transaktionslast und eine DSGVO-Produktionsabnahme stehen ebenfalls aus.

**Fazit:** Die zwei konkret reproduzierten Kundenportal-Zugriffs-/Integritätsfehler sind mit dem geprüften Datenbankfix produktiv behoben. Das ist **keine vollständige Pilotfreigabe**.

Referenzen: [18-Szenarien-Regression](../tests/customer-portal-tenant-security.sql), [Sicherheitsinventar](security-definer-audit-2026-10-20.md), [Issue #18](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/issues/18).
