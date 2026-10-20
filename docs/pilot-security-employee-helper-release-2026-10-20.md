# Produktions-Sicherheitsnachweis: Mitarbeiterzuordnung und Mitgliedschaft

**Datum:** 20.10.2026  
**Supabase:** A One, `rwojydgekobbckpcvlnu`  
**GitHub:** [PR #28](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/pull/28) (`e9143eb647497724e80b788ed9c773b082933163`).

## Defekt und Behebung

Der private, privilegierte Helfer `guard_private.employee_id_for(p_org,p_user)` hatte bisher nur nach `org_id` und `user_id` in der Mitarbeiterliste gefiltert. Er überprüfte weder `guard_memberships.active` noch `guard_employees.status`.

Eine synthetische Konto-Sperrung bei bestehender Schicht erlaubte es deshalb dem Benutzer in der PostgreSQL-Rolle `authenticated`, trotz gesperrter Firmenmitgliedschaft über den öffentlichen `guard_request_shift_swap` einen Schichttausch zu erzeugen.

**Fix:** Der Helfer liefert die Mitarbeiter-ID nur für **aktive Mitgliedschaft in derselben Firma** und **aktiven Mitarbeiterstatus**. Die Signatur bleibt unverändert.

## Produktionsnachweise

- [CI #112](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/actions/runs/39468864820): Syntax/Unit und Browser erfolgreich.
- Migration über Supabase erfolgreich produktiv angewendet:
  - Version `20261020174655`
  - Name `guard_employee_id_for_membership_hardening`
  - GitHub-Datei `supabase/migrations/20261020174655_guard_employee_id_for_membership_hardening.sql`.
- Direkt nach der Installation wurden folgende PostgreSQL-Suiten **mit `BEGIN/ROLLBACK`** erneut ausgeführt:
  - **9/9** neue Helper- und Schichttauschtests
  - **7/7** vorherige Konto-Sperrungs-RPC-Tests
  - **43/43** RLS-Rollenchecks
  - Vollständiger bestehender Backend-Integritätstest: **PASS**.
- Post-Deploy-Inspektion bestätigt, dass der private Helfer die beiden Bedingungsprüfungen enthält. Alle synthetischen Testobjekte wurden zurückgerollt.

## Auswirkungen auf die Oberfläche

13 privilegierte Funktionen nutzen `employee_id_for` direkt, unter anderem NFC-Altendpunkte, Schichttausch, Zeiterfassung, Vorfälle/Formulare, Einsätze und Fahrtenbuch. Der zentrale Fix verschärft ihre gemeinsame Mitarbeiterzuordnung. **Die einzelnen 13 Funktionspfade wurden nicht alle separat als End-to-End-Ablauf getestet.** Erfolgreiche RLS-, Backend- und Rollentests sind Teilnachweise.

## Wichtige Berechtigungsabhängigkeit

Eine weitere Inspektion stellte fest: **14 RLS-/Storage-Policies** und 14 weitere `SECURITY DEFINER`-Funktionskörper (einschließlich des zentralen Dokumenten-Lesehelfers) referenzieren diesen Mitarbeiter-Helfer. Eine pauschale Entziehung von `EXECUTE` an `authenticated` wurde deshalb **nicht durchgeführt**, da sie legitime RLS-Prüfungen beeinträchtigen könnte. Das private Schema ist kein regulär exponierter öffentlicher RPC-Pfad. Die direkten Hilfsfunktionsrechte bleiben dennoch Teil des Least-Privilege-Reviews.

## Restliche Freigaben

- Supabase Security Advisor: unverändert 59 strukturelle Warnungen zu authentifiziert ausführbaren `SECURITY DEFINER`-RPCs; eine Auth-Warnung zur Leaked-Password-Protection; zwei INFO-Hinweise zu RLS-Tabellen ohne direkte Policies.
- Die zwei Tabellen `guard_private.nfc_requests` und `public.guard_document_counters` haben **keine direkten SELECT-/INSERT-/UPDATE-Rechte** für `anon` oder `authenticated`, obwohl RLS aktiv ist.
- Andere RPCs und konkrete Feldgeräte-/Benachrichtigungsabläufe sind nicht vollständig abgenommen. Weitere Rollentrennung, Schema-Rechte und dynamische Negativtests bleiben in Issue #18.

## Quellen

- [GitHub-Migration](../supabase/migrations/20261020174655_guard_employee_id_for_membership_hardening.sql)
- [9-Szenarien-Regression](../tests/employee-id-active-membership.sql)
- [Inventar 59 RPCs](security-definer-audit-2026-10-20.md)
- [Issue #18](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/issues/18)

**Fazit:** Der konkret reproduzierte gesperrte Schichttausch ist mit dem zentralen Mitgliedschaftscheck produktiv behoben und mittels echten Rollentestdaten verifiziert. Gesamt-Pilotfreigabe weiterhin ausstehend.
