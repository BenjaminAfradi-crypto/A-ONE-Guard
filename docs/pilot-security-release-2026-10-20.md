# Produktions-Sicherheitsprüfung: gesperrte Konten und privilegierte RPCs

**Datum:** 20.10.2026  
**Projekt:** A One Guard, Supabase `rwojydgekobbckpcvlnu`.  
**Änderung:** [PR #26](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/pull/26), Commit `ab6bea67627a16d119337598021474d11dd4cced`.

## Bestätigte und behobene Lücken

| RPC | Vorher (gesperrte Mitgliedschaft) | Nachher |
| --- | --- | --- |
| `guard_my_month_summary` | Synthetischer Gehaltsstundensatz abrufbar | Zugriff verweigert |
| `guard_create_organization` | Alternative Unternehmensanlage trotz vollständig gesperrtem Konto möglich | Zugriff verweigert, erlaubt für aktive und frische Konten |
| `guard_finish_attempt` | Abschluss eines bestehenden Trainingsversuchs möglich | Zugriff verweigert, erlaubt für aktiven Mitarbeiter |

Die Schutzprüfungen verwenden `guard_memberships.active`, den authentifizierten Benutzer und beim Training die Organisationszuordnung.

## Produktionsnachweise

1. GitHub [Pilot CI #108](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/actions/runs/39467516366) vollständig erfolgreich.
2. Die Migration ist **erfolgreich über Supabase** unter `20261020173722_guard_suspended_account_rpc_security` angewendet und in der produktiven Migrationshistorie sichtbar.
3. `tests/suspended-account-rpc-security.sql` nach dem Rollout ausgeführt: **7/7 PASS**.
4. `tests/rls-matrix.sql` nach dem Rollout ausgeführt: **43/43 PASS**.
5. `tests/backend-integrity.sql` nach dem Rollout ausgeführt: **PASS**.
6. `anon` besitzt weiterhin keine direkten `EXECUTE`-Rechte auf die drei Funktionen. Alle drei haben den aktiven Mitgliedschaftscheck.
7. Jeder Test verwendete ausschließlich synthetische Datensätze und `BEGIN ... ROLLBACK`.

## Restliches Risiko

Der Supabase Security Advisor zeigt weiterhin **59 Warnungen** für authentifiziert ausführbare `SECURITY DEFINER`-RPCs, obwohl drei nun gehärtet wurden: Die Regel warnt vor *dem Berechtigungsmuster*, nicht ausschließlich vor tatsächlich ausnutzbaren Fehlern. Außerdem bestehen **1 WARN** zum fehlenden Schutz vor kompromittierten Passwörtern und **2 INFO** zu RLS-Tabellen ohne eigene Policy.

**56 RPCs wurden über Signaturen, Berechtigungen und Textmuster inventarisiert, aber noch nicht einzeln mit negativen Cross-Tenant- und deaktivierten-Mitarbeiter-Tests abgenommen.** Besonders Personal- und Dokumentendaten, Mitgliedschaftsänderungen, NFC/Zeiterfassung und Kundendaten müssen weiter geprüft werden.

Diese Härtung ist ein erfolgreich verifizierter Teil-Fix, **keine vollständige Sicherheits- oder Pilotfreigabe**.

## Referenzen

- [RPC-Audit und 59-Funktionen-Inventar](security-definer-audit-2026-10-20.md)
- [Migration](../supabase/migrations/20261020173722_guard_suspended_account_rpc_security.sql)
- [SQL-Regression](../tests/suspended-account-rpc-security.sql)
- [GitHub Issue #18](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/issues/18)
- [Advisor-Dokumentation](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0029_authenticated_security_definer_function_executable)
