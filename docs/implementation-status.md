# Entwicklungsstand 21.09.2026

## Umgesetzt in diesem Änderungspaket

- Aufgaben mit Objekt, Verantwortlichem, Frist und Mitarbeiterabschluss; Qualitätsaudits mit Bewertung, Abweichungen und Maßnahmen.
- Formular-Builder, typisierte Pflichtfelder, Einreichung, historische Vorlagenkopie und Managementprüfung.
- Oberfläche für bestehende zeitgesteuerte Regeln, Einzelarbeitsplatz-Check-ins, operative Übersicht, chronologische Nachweise und API-Schlüsselverwaltung.
- Gemeinsamer Modulkatalog, mobile Oberflächen, sichtbare Ladefehler, paginierte Datenabfragen und lesbare JavaScript-Quelldateien für die bisherigen komprimierten Einstiegsmodule.
- Atomare Datenbank-Sperre gegen überlappende Mitarbeiterdienste; Mandantenprüfung neuer Verknüpfungen; geschlossene NULL-Autorisierungslücken bei Aufgaben und Check-ins.
- Wiederholbare NFC-Buchungen: dieselbe Request-ID bestätigt denselben Vorgang auch bei verlorenem HTTP-Ergebnis. Korrektur der zuvor fehlerhaften Token-Erzeugung.

## Verifikation

16 Chromium-Tests bestanden: 7 Dienstplan-, 8 Modul- und 1 NFC-Szenario. Echte HTML-/JS-Dateien, simulierte Supabase-Antworten. Kein Ersatz für eine vollständige Rollenprüfung auf einer veröffentlichten Instanz.

`tests/backend-integrity.sql` wurde gegen das bestehende Supabase-Projekt ausgeführt. Synthetische Daten und Audit-Einträge vollständig zurückgerollt. Geprüft: überlappende/angrenzende Schichten, vorhandene atomare Constraint, fremde Objektzuordnung, unberechtigter Aufgabenabschluss/Check-in, Pflichtfelder, Vorlagenkopie, anonyme RPC-Rechte und wiederholte NFC-Buchung. Kein paralleler Lasttest und keine vollständige RLS-Matrix.

Die vier Migrationen unter `supabase/migrations` sind im bestehenden Projekt angewandt. Sie sind inkrementell und setzen das vorhandene Guard-Schema voraus; sie sind **kein vollständiges Schema für ein leeres Projekt**. Supabase vergibt beim Anwenden über seine Verwaltungs-API eigene Versionszeitstempel. Migrationen in dieser Instanz nicht erneut anwenden; für CLI-Einsatz zuerst die Migrationshistorie abgleichen.

## Offene Freigabepunkte

Frontend-Code wird als Entwicklungsbranch bereitgestellt; noch kein Nachweis eines neuen Frontend-Deployments. Echte Endgeräte/NFC-Tags, Push-Zustellung, reale Cron-Läufe und kundenseitige Integrationen sind nicht vollständig geprüft.

Die Intelligence-Seite ist ausdrücklich regelbasiert. Echte KI, Offline-Erfassung mit Synchronisierung, SSO/Entra, SAP/DATEV-Integration, OAuth, Webhooks, mehrstufige Automationen und vollständige Live-Karte sind nicht durch diese Änderungen erfüllt. Pricing, Rechtsdokumente und vertragliche SLA brauchen freigegebene Geschäftsangaben.

`masterplan-380.json` und `masterplan-380.md` enthalten alle Originalanforderungen mit konservativem Einzelstatus. Ein vorhandenes Modul ist kein Nachweis der vollständigen Umsetzung.

## Sicherheitsprüfung

Nach den Änderungen meldet der Supabase Advisor keine anonym ausführbaren Guard-SECURITY-DEFINER-Funktionen mehr. Weiterhin 56 Warnungen zu authentifiziert ausführbaren privilegierten Funktionen: deren gezielte Freigabe ersetzt keine vollständige Prüfung der internen Autorisierung. Zwei Tabellen haben absichtlich RLS ohne direkte Policies (private NFC-Quittungen und Dokumentzähler; Zugriff erfolgt über geprüfte Funktionen). Schutz gegen kompromittierte Passwörter ist nicht aktiviert und bleibt ein Konfigurationspunkt.

Hinweise: [Privilegierte Funktionen](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [RLS ohne Policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [Passwortschutz](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Weiterentwicklung 28.09.2026 – Pilot-Zeitintegrität

Aufbauend auf PR #2; keine Live-Datenbankänderung und kein Deployment.

- Gemeinsame Nettozeitberechnung für Mitarbeiter, Arbeitszeitenverwaltung,
  Command-Center-Zeitlisten und Payroll; Pausen werden auf Buchung/Zeitraum
  begrenzt und überlappende Pausen nur einmal abgezogen.
- Monatssummen teilen Nachtschichten an der Monatsgrenze. Mitarbeiterzeiten
  werden explizit auf die eigene Mitarbeiter-ID gefiltert.
- Vollständige paginierte Zeitabfragen in Mitarbeiteransicht, Arbeitszeiten und
  Payroll; Pausen werden für die betroffenen Buchungen in kleinen Paketen geladen.
  Ab 20.000 Datensätzen bricht eine Gesamtabfrage sichtbar ab.
- Fehlende Pausendaten führen zu einer Fehlermeldung. Payroll sperrt Export
  und Snapshot während des Ladens und nach Ladefehlern.
- Deaktivierung bestätigt zuerst den serverseitigen Mitgliedschaftsstatus;
  Aktivierung erteilt den Zugang zuletzt. Teilerfolge werden ausdrücklich
  angezeigt. Der Stammdaten-Status ist nur über diesen Ablauf änderbar.
- 15 neue Node-Regressionstests bestanden; Syntaxprüfung aller JS-Dateien und
  git diff --check erfolgreich. Die vorhandenen 16 Chromium-Tests konnten in
  dieser Umgebung nicht erneut ausgeführt werden: Browser fehlt, Download
  liefert kein gültiges Archiv. Keine Aussage über deren aktuellen Erfolg.

Weiter offen: atomare Statusänderung im Backend, vollständige RLS-Abnahme,
reale Geräteprüfung, feste organisationsweite Berichtszeitzone (aktuell lokale
Browser-Zeitzone), konsistente Snapshots bei parallel geänderten paginierten
Daten. Das Command Center zeigt weiterhin begrenzte historische Listen;
Monatsabrechnungen müssen die vollständige Payroll-Abfrage nutzen.

## Weiterentwicklung 28.09.2026 – Dienstplan-Prüfungen

Aufbauend auf PR #3. Keine Änderungen an der Live-Datenbank.

- Anlegen, Bearbeiten, Serien und Kopien prüfen unmittelbar vor der Speicherung
  den aktuellen Objekt-/Mitarbeiterstatus, die Qualifikationsstufe und Abwesenheiten.
- Genehmigte Abwesenheiten und noch offene Krankmeldungen blockieren die
  Zuweisung. Offene Urlaubsanträge und abgelehnte Meldungen blockieren nicht.
- Aktive verpflichtende Qualifikationsanforderungen aus der Compliance-Verwaltung
  gelten firmenweit oder für das passende Objekt. Ein geprüfter Nachweis muss den
  gesamten Dienst abdecken; erneuerte Nachweise werden berücksichtigt. Weitere
  Dokumentanforderungen sind noch nicht Bestandteil dieser Prüfung.
- Nachtschichten prüfen alle berührten Kalendertage. Ein Ende exakt um Mitternacht
  berührt den folgenden Tag nicht. Zeitzone bleibt die lokale Browser-Zeitzone.
- Einzel- und Wochenfreigabe laden die Dienste erneut und prüfen sie vollständig.
  Unbesetzte Dienste bleiben geplant. Wochenfreigaben melden einzelne Konflikte
  und erhalten bereits erfolgreiche Freigaben. Ein bedingtes Update verhindert
  die Freigabe einer inzwischen veränderten Zuweisung.
- Mitarbeiterreferenzen und Wochenlisten werden vollständig paginiert geladen.
- 15 neue Node-Tests bestanden; zusammen mit PR #3 sind es 30. Die vorhandenen
  Browser-Fixtures wurden um die neuen Leseabfragen erweitert. Browserausführung
  bleibt wegen fehlendem Chromium unbestätigt.

Grenzen: Dies sind Vorabprüfungen im dedizierten Dienstplan. Sie ersetzen keine
atomaren Backend-Regeln und gelten nicht automatisch für andere Schreibwege,
insbesondere den älteren Command-Center-Editor oder direkte API-Aufrufe.
Parallel nach der Prüfung genehmigte Abwesenheiten oder geänderte Nachweise
können weiterhin eine erneute Prüfung erfordern. Serverseitige Absicherung,
Ruhezeiten und Mindestbesetzung bleiben offene Pilotpunkte.


## Weiterentwicklung 06.10.2026 – RLS-Rollenmatrix und Audit-Fix

Aufbauend auf dem konsolidierten Pilot-PR. Keine dauerhafte Änderung an der Live-Datenbank.

- Neue transaktionale RLS-Rollenmatrix für Owner, Admin, Dispatcher, Mitarbeiter und firmenfremde Nutzer.
- Geprüft werden Organisations-, Membership-, Mitarbeiter-, Objekt-, Dienst-, Dokument- und private HR-Sichtbarkeit sowie der fehlende direkte Client-Zugriff auf die Lösungsschlüssel der Lernwelt.
- Die Matrix wurde mit dem echten PostgreSQL-Rollenkontext `authenticated` und wechselnden JWT-Subjects gegen das bestehende Supabase-Projekt ausgeführt. Alle definierten Sichtbarkeitsprüfungen bestanden.
- Der Test deckte einen echten Fehler im generischen Audit-Trigger auf: `guard_employee_private` besitzt keinen `id`-Schlüssel, der Trigger griff aber pauschal auf `NEW.id` zu. Dadurch konnten Schreibvorgänge bereits vor der RLS-Prüfung scheitern.
- Migration `20261006141000_guard_audit_generic_row_id.sql` löst die Zeilen-ID nun generisch aus JSON und verwendet bei der privaten Mitarbeiterakte `employee_id` als Fallback.
- Migration und RLS-Matrix wurden gemeinsam in einer echten Datenbanktransaktion ausgeführt und vollständig zurückgerollt.

Weiter offen: vollständige Schreibmatrix für sämtliche RPC-/Tabellenaktionen, reale Rollen-Abnahme mit Pilotkonten und dauerhafte Anwendung der neuen Migrationen vor Live-Nutzung.


### Ergänzung – Membership-Schreibschutz

Die Schreibprüfung der Rollenmatrix hat einen weiteren sicherheitsrelevanten Bypass nachgewiesen: Die bisherige `guard_members_manage`-Policy erlaubte Owner/Admin direkten Tabellenzugriff auf `guard_memberships`. Dadurch konnte ein Admin die Rolle eines Owners direkt per PostgREST ändern und die Schutzlogik von `guard_set_member_role` umgehen.

Migration `20261006142000_guard_membership_mutation_rpc_only.sql` entfernt direkte INSERT/UPDATE/DELETE-Rechte für `authenticated` auf `guard_memberships` und lässt Rollen-/Aktivitätsänderungen ausschließlich über die vorhandenen geschützten SECURITY-DEFINER-RPCs laufen.

Die erweiterte Rollenmatrix umfasst jetzt 29 Lese-/Schreibprüfungen. In einer realen, vollständig zurückgerollten Supabase-Transaktion bestanden alle Prüfungen; insbesondere blieb die Owner-Rolle geschützt, während eine zulässige Admin-Änderung von Dispatcher zu Mitarbeiter über den RPC weiterhin funktionierte.
