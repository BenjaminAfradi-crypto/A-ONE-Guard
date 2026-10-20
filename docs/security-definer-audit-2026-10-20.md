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
- Der **gezielte Fix** in `supabase/migrations/20261020194500_guard_suspended_account_rpc_security.sql` ergänzt prüfbare aktive Mitgliedschaft ohne die bestehenden öffentlichen Funktionssignaturen zu ändern.
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
- Migration: [Härtung](../supabase/migrations/20261020194500_guard_suspended_account_rpc_security.sql)
- [Supabase Advisor Regel 0029](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0029_authenticated_security_definer_function_executable)
- [Issue #18](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/issues/18)

Bis zur formellen Freigabe bleibt die Pilotbewertung eingeschränkt. Dieser Bericht darf nicht als Nachweis vollständiger Sicherheit verstanden werden.
