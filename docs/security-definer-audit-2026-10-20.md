# SECURITY DEFINER Audit – 20.10.2026

**Projekt:** A One Guard / Supabase A One, Frankfurt eu-central-1.  
**Scope:** `public`-Funktionen mit `SECURITY DEFINER` und `EXECUTE` für `authenticated`.

## Entscheidungsrelevante Feststellungen

- **59** Supabase-Advisor-Warnungen für authentifiziert ausführbare `SECURITY DEFINER`-Funktionen.
- Für diese **59 Funktionen keine direkte `anon`-Ausführungsberechtigung** festgestellt.
- Ein statisch erkennbares Authentifizierungs-/Berechtigungssignal in jeder der 59 Funktionen **beweist nicht**, dass der Schutz ausreicht; jede Funktion muss fachlich auf aktive Mitgliedschaft, Mandantengrenzen, Objektzuordnung und Seitenwirkungen geprüft werden.
- Drei konkrete Lücken in transaktionalen Tests mit `SET LOCAL ROLE authenticated` nachgewiesen:
  1. `guard_my_month_summary`: Eine deaktivierte Mitgliedschaft bei weiterhin aktivem Mitarbeiterprofil erlaubte den Abruf des synthetischen Stundensatzes.
  2. `guard_create_organization`: Ein nur deaktiviertes Mitgliedskonto konnte eine neue Organisation erstellen, obwohl `guard_ensure_organization` die Sperre explizit durchsetzt.
  3. `guard_finish_attempt`: Ein deaktiviertes Mitglied konnte einen laufenden Lehrgangsversuch abschließen.
- Der **gezielte Fix** in `supabase/migrations/20261020173722_guard_suspended_account_rpc_security.sql` ergänzt prüfbare aktive Mitgliedschaft ohne die bestehenden öffentlichen Funktionssignaturen zu ändern.
- **7/7 transaktionale SQL-Regressionstests** der Änderungen auf aktueller Datenbank erfolgreich, komplette Migration und synthetische Nutzer mit `ROLLBACK` zurückgenommen.
- Die übrigen **56 Funktionen sind nicht als sicher freigegeben**. Die nachfolgende Inventarliste ist ein erster statischer Scan, kein Penetrationstest.

## Inventar

Die Spalte „Auth-Signal“ bezeichnet eine Textmustererkennung, **keine belegte Autorisierung**.

| Funktion | Anon EXECUTE | Auth-Signal | Stand |
| --- | --- | --- | --- |
| `guard_adjust_ammunition` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_admin_checkpoint_payload` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_apply_schedule_import` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_approve_document` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_archive_document` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_cancel_shift_swap` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_clock_in_geo` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_clock_in_nogeo` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_clock_nfc` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_clock_nfc_auto` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_clock_out_geo` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_clock_out_nogeo` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_complete_task` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_convert_candidate` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_create_hr_checklist` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_create_join_code` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_create_monthly_archive` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_create_organization` | Nein | Erkennbar | Bypass bestätigt; Fix in diesem PR |
| `guard_create_site_nfc_tag` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_customer_create_ticket` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_customer_portal_snapshot` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_customer_release` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_decide_shift_swap` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_decide_time_correction` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_end_break` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_ensure_default_document_folders` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_ensure_organization` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_escalation_action` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_finish_attempt` | Nein | Erkennbar | Bypass bestätigt; Fix in diesem PR |
| `guard_issue_equipment` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_issue_weapon` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_join_organization` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_log_document_access` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_log_export` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_lone_worker_checkin` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_lone_worker_close` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_lone_worker_start` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_move_key` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_my_month_summary` | Nein | Erkennbar | Bypass bestätigt; Fix in diesem PR |
| `guard_new_document_version` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_register_document` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_request_shift_swap` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_request_time_correction` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_respond_shift_swap` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_return_equipment` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_return_weapon` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_revert_schedule_import` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_review_form_submission` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_scan_checkpoint` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_send_document` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_set_employee_active` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_set_member_active` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_set_member_role` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_start_break` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_submit_answer` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_submit_form` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_trip_end` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_trip_start` | Nein | Erkennbar | Weitere Prüfung notwendig |
| `guard_verify_monthly_archive` | Nein | Erkennbar | Weitere Prüfung notwendig |

## Priorisierte Fortsetzung

1. Hohe Priorität: `guard_set_member_role`, `guard_set_member_active`, `guard_set_employee_active`, HR-/Dokumentenfunktionen und `guard_customer_portal_snapshot`; Rollenzugriff und Mandantentrennung mit negativen Testfällen prüfen.
2. Zeiterfassung: NFC-/Geolocation-RPCs, Schichtzuordnung, abgemeldete Mitarbeiter sowie Manipulation über alternative Legacy-Endpunkte untersuchen.
3. Bildung/Personal: offene Schulungsversuche, deaktivierte Mitgliedschaften, Konto-/Organisationslebenszyklus und PII-Metadaten testen.
4. Auth-Sicherheit: [Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) bewusst konfigurieren; fehlende RLS-Policies der zwei intern genutzten Tabellen unabhängig prüfen.
5. Security Advisor erneut prüfen. Bestimmte `SECURITY DEFINER`-RPCs werden aus funktionalen Gründen weiterhin mit `EXECUTE` für berechtigte Anwender benötigt und damit weiterhin Warnungen erzeugen. Eine vollständige Beseitigung der 59 Warnungen ist **kein sinnvolles Ziel**, wenn dadurch legitime Abläufe deaktiviert würden.

## Nachweise & Grenzen

- Tests: [Suspended account RPC regression](../tests/suspended-account-rpc-security.sql)
- Migration: [Härtung](../supabase/migrations/20261020173722_guard_suspended_account_rpc_security.sql)
- [Supabase Advisor Regel 0029](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0029_authenticated_security_definer_function_executable)
- [Issue #18](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/issues/18)

Bis zur formellen Freigabe bleibt die Pilotbewertung eingeschränkt. Dieser Bericht darf nicht als Nachweis vollständiger Sicherheit verstanden werden.

## Nachtrag: gemeinsamer Mitarbeiter-Identitätshelfer

Beim Prüfen der übrigen 56 RPCs wurde eine weitere Berechtigungslücke bestätigt: `guard_private.employee_id_for(org,user)` gab eine Mitarbeiter-ID zurück, auch wenn deren Firmenmitgliedschaft deaktiviert war. Der produktive `guard_request_shift_swap` ließ so ein gesperrtes Konto im echten `authenticated`-Kontext einen Schichttausch für seine Firma erstellen (synthetische Daten, `ROLLBACK`).

**13 öffentlich aufrufbare, privilegierte Funktionen** verweisen direkt auf diesen Helfer: `guard_cancel_shift_swap`, `guard_clock_nfc`, `guard_clock_nfc_auto`, `guard_complete_task`, `guard_lone_worker_checkin`, `guard_lone_worker_close`, `guard_lone_worker_start`, `guard_request_shift_swap`, `guard_request_time_correction`, `guard_respond_shift_swap`, `guard_submit_form`, `guard_trip_end`, `guard_trip_start`. **Das ist ein gemeinsames Risikomuster, nicht der Nachweis 13 einzelner ausnutzbarer Fehler.**

Die Migration `supabase/migrations/20261020174655_guard_employee_id_for_membership_hardening.sql` erzwingt nun eine aktive Mitgliedschaft **in genau derselben Organisation** und einen aktiven Mitarbeiterstatus. Sie erhält die Signatur und bestehenden Datenbankrechte. `tests/employee-id-active-membership.sql` validiert neun Szenarien inkl. Multi-Organisation, Mitarbeiterdeaktivierung, Schichttausch-Sperre und Wiederfreigabe.

Die Migration wurde zusammen mit **9 neuen + 7 vorherigen RPC- + 43 RLS- und vollständigen Backend-Regressionen** transaktional auf PostgreSQL getestet und wieder zurückgerollt. Dies bestätigt die getesteten Pfade, nicht automatisch alle Aufrufer des Helfers.

## Nachtrag 21.10.2026 – Inhaber-Integrität

Bei der Rollenprüfung wurde ein kritischer Fall mit synthetischen Konten bestätigt: Ein alleiniger **aktiver** Owner konnte über `guard_set_member_role` seine Rolle zu `admin` ändern, wenn ein zweiter **inaktiver** Owner in der Mitgliedschaftsliste stand. Die alte Routine zählte alle Owner, unabhängig vom `active`-Wert. Dadurch konnte eine Organisation ohne aktiven Owner zurückbleiben.

Die neue Migration `supabase/migrations/20261021104642_guard_last_active_owner_integrity.sql` zählt aktive Owner und serialisiert `guard_set_member_role` sowie `guard_set_member_active` anhand einer gemeinsamen per-Organisation Advisory-Lock. **11/11** SQL-Regressionen mit echten `authenticated`-Rechten, synthetischen Nutzern und vollständigem `ROLLBACK` bestanden. Dies ist kein echter Test gleichzeitiger Verbindungen.

Separat geprüft: Ein Disponent darf ein Personalprofil ohne Login deaktivieren. Ein Personalprofil mit Login konnte er nicht deaktivieren, weil ein Berechtigungswechsel dafür über Owner/Admin erfolgen muss. Dieses Verhalten entspricht der bestehenden Rollenabgrenzung; es wird daher **nicht** durch eine unkontrollierte Rechtserweiterung geändert.


## Nachtrag 22.10.2026 – Kundenportal und Ticket-Konsistenz

Die Kontrolle der Kunden- und Dokumentenfunktionen ergab zwei reproduzierbare Abweichungen mit synthetischen `authenticated`-Konten: (1) Ein aktives Kundenportal-Konto konnte trotz inzwischen **inaktivem Kunden** neue Support-Tickets erstellen. (2) Ein berechtigter Manager von Firma B konnte unter `guard_customer_portal_access` seinen Firmennamen an einen Kunden aus Firma A knüpfen; die Ticket-RPC akzeptierte anschließend eine kunden- und firmenübergreifende Zuordnung. Keine der beiden anomalien wurde in bereits vorhandenen realen Zeilen gefunden (0 Portal-Zuordnungen, 0 Tickets beim Preflight).

Der gezielte Fix `supabase/migrations/20261022125922_guard_customer_portal_tenant_integrity.sql` stärkt konsistente IDs mittels **zusammengesetzter Foreign Keys**, prüft im `guard_customer_create_ticket` eine aktive Firmen-/Kundenportalbindung und wendet dieselbe Regel über einen privaten, callergebundenen Helper in SELECT/INSERT-RLS an. Der interne Helper ist für `anon` nicht ausführbar. **18/18** PostgreSQL-Regressionen und alle bestehenden kombinierten Rollen-/Backendtests bestanden innerhalb einer **zurückgerollten** Testtransaktion. Produktivinstallation erst nach GitHub-Prüfung.
