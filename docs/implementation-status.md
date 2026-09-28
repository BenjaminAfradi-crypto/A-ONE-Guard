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
