# Release-Nachweis: Besetzungswarnung bei offener Krankmeldung

Datum: 20.10.2026 – Supabase-Projekt: A One (`rwojydgekobbckpcvlnu`).

## Produktionsstatus

- GitHub [PR #21](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/pull/21) erfolgreich zusammengeführt (`5eb4d009ef4ada4d068ed9ee02c8a89528ddb2ce`).
- [GitHub CI #99](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/actions/runs/39460110278) erfolgreich (Unit/Syntax und Browser-Regression).
- Migration **erfolgreich** über die Supabase-Migrationsverwaltung angewendet, anschließend in der Datenbankhistorie nachgewiesen:
  - Version: `20261020164612`
  - Name: `guard_pending_sick_staffing_escalations`
  - Repository-Datei: `supabase/migrations/20261020164612_guard_pending_sick_staffing_escalations.sql`
- Datenbankfunktion `guard_private.leave_shift_escalation()` enthält die neue Regel für `kind='sick', status='pending'`.
- Genau **ein aktiver Trigger** `guard_leave_shift_escalation` auf `guard_leave_requests` vorhanden, auch für Änderungen von Status, Art, Anfang und Ende.
- **12/12 transaktionale Lifecycle-Tests** wurden nach der produktiven Migration erneut ausgeführt; alle synthetischen Fixtures wurden per `ROLLBACK` entfernt.
- Eine zusätzlich vor der Migration erzeugte synthetische offene Krankmeldung wurde beim transaktionalen Migrationstest erfolgreich per Backfill berücksichtigt.
- Vor dem produktiven Rollout: **0 aktuell/offen betroffene Krankmeldungen mit passenden zukünftigen Diensten**. Deshalb wurde kein realer Testnutzer oder Krankheitsfall zur Wirksamkeitsprüfung angelegt.

## Verhalten

- Eine offene Krankmeldung bei bereits geplanten Diensten legt sofort eine Besetzungseskalation an.
- Der bestehende partielle Unique-Index `guard_escalations_unique_source` erlaubt genau einen Alarm je Abwesenheit. Die Warnung fasst mehrere betroffene Dienste zusammen und nennt das erste betroffene Objekt.
- Genehmigung erzeugt keinen zweiten Alarm und behält eine bereits erfolgte Bestätigung bei.
- Ablehnung, Stornierung oder Verschiebung ohne betroffenen Dienst erledigt die Warnung; erneute relevante Änderung aktiviert denselben Alarm wieder.
- Der Backfill erfasst nur aktuell/recent betroffene offene Krankmeldungen ohne vorhandenen Alarmeintrag. Bereits manuell erledigte Alarme werden dadurch nicht wieder geöffnet.

## Bekannte Grenzen / weitere Aufgaben

1. Bei **nachträglicher Änderung oder Stornierung einer bereits alarmierten Schicht** läuft aktuell nicht automatisch eine Neuberechnung ausgehend vom Dienstplan. Ein eigener Trigger oder zentraler Reconciliation-Dienst wäre erforderlich.
2. Eine erfolgreiche SQL-Regression bestätigt weder tatsächliche Push-Zustellung noch Benutzerführung und Bedienung mit realen Disponenten.
3. Bestehende Security-Advisor-Hinweise bleiben nach der Migration: 59 Warnungen zu von authentifizierten Nutzern ausführbaren `SECURITY DEFINER`-Funktionen, 1 Hinweis/Warnung für kompromittierte Passwörter und 2 `INFO`-Hinweise zu RLS-Tabellen ohne direkte Policy. Keine dieser Meldungen wurde durch diese Migration neu eingeführt.
4. Die früheren Supabase-API-Migrationen haben zum Teil andere Versionen als die bereits vorhandenen Repository-Dateien. Vor einem späteren `supabase db push` muss **die gesamte Migrationshistorie** abgeglichen werden; die Version dieses neuen Fixes wurde bereits auf den DB-Historienwert ausgerichtet.
5. Echte Geräte- und Paralleltests sowie vollständige Pilotfreigabe stehen weiterhin aus.

Quelle der SQL-Regression: [tests/pending-sickness-escalation.sql](../tests/pending-sickness-escalation.sql).

**Freigabe:** Die konkrete Funktion wurde ausgerollt und die Backend-Regression ist grün. Dies ist keine Gesamtfreigabe der SaaS-Anwendung oder des EGNAS-Piloten.
