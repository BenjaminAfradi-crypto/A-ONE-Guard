# A ONE Guard – Funktionsvergleich mit LogPro (öffentliche Produktinformationen)

Stand: 19.10.2026. **Dies ist keine Kopie von LogPro.** Funktionen werden aus öffentlich beschriebenen Anwendungsfällen eigenständig entworfen. Keine Übernahme fremder Quelltexte, privaten APIs, Marken, Bilder oder Layouts.

Quellen zur Funktionsorientierung:
- https://www.logpro.de/arbeitszeiterfassung
- https://www.logpro.de/dienstplan
- https://www.logpro.de/waechterkontrollsystem
- https://www.logpro.de/integrationen
- https://www.logpro.de/preise

## Bestand vs. offene Arbeit

| Bereich | A ONE Guard heute (Codebestand) | Fehlende Abnahme oder Erweiterung |
| --- | --- | --- |
| Mitarbeiter / Rollen / Objekte | Oberflächen, Supabase-Zuordnung, RLS-Migrationen vorhanden | Vollständige produktive Rollen- und Schreibprüfung |
| Dienstplan / Tausch / Abwesenheiten | Vorhandene Planungs- und Tauschmodule | Konkurrierende Updates, echte Push-Benachrichtigung, serverseitige Verfügbarkeit |
| Zeiterfassung / Pausen | Vorhanden, inkl. NFC-Buchung und Zeitintegritätstests | NFC-Feldtest iOS/Android, vollständige Lohnschnittstelle |
| Wachbuch | Operative Erfassung durch Mitarbeiter und Leitung | Fotoanhänge, revisionssichere Korrekturkette, mobile Offlineerfassung |
| WKS / Rundgänge | Routen, QR-Link, Token-Scan-RPC, laufende Rundgänge | Reale NFC-/GPS-/Foto-Nachweise, Wiederholungsplanung, historisierte Kontrollpunkt-Sollwerte |
| Vorfälle / SOS | Grundfunktion vorhanden | Echtzeit-Zustellung und dokumentierte Eskalations-SLAs |
| Fahrzeuge / Schlüssel / Ausrüstung | Separate Module vorhanden | Digitale Führerscheinkontrolle und Fahrzeugabfahrkontrolle vollständig prüfen |
| Unterweisung / Compliance / Audit | Eigene Module vorhanden | Formale Abnahme und Nachweis-Export |
| Kundenportal / Berichte | Kundenportal, Reporting und Monatsarchiv vorhanden | Rollenbasierte Freigabe fertiger Kundenberichte |
| Anbindungen | Excel-Import und einige Exportpfade vorhanden | DATEV/Lexware/SAP nicht nachgewiesen; keine Integrationszusage |
| Mobile Nutzung | PWA vorhanden | Offline-Sync, Hintergrundbenachrichtigungen und vollständige Geräteprüfung |

## Dieses Änderungspaket: operative Berichte

Neue Seite: **Betriebsberichte** (Management, erreichbar über Command Center / Security Operations).
- Wachbuch- und WKS-Historie in jeweils einem begrenzten Zeitraum bis zu 92 Tagen.
- Objektfilter und vollständige, paginierte, mandantenbezogene Abfragen (kein irreführendes Abschneiden nach den letzten 200 Buchungen).
- Berichte mit Anfang, Ende, Mitarbeiter und Status; Soll-/Ist-Anzahl der aktuellen Kontrollpunkte.
- Hinweis auf überfällige, abgebrochene, unvollständige und hinsichtlich Standort abweichende Rundgänge.
- CSV-Export mit Tabellenformel-Schutz und einem vorgeschalteten serverseitigen Export-Auditeintrag.
- Kein Teilbericht bei Abfragefehler oder Überschreiten der Datensatzgrenze. Berechtigungen über bestehende Manager-Anmeldung und Datenbank-RLS.

**Einschränkungen:** Kontrollpunkt-Bestand wird aktuell gelesen; die Rückrechnung früherer Rundgänge aus später geänderten Routen ist nicht beweiskräftig. GPS-Abweichungen werden nur aus vorhandenen Daten angezeigt. Es werden weder neue GPS-Messungen noch Foto-/NFC-Prüfungen durchgeführt. Ausdrucke sind nicht elektronisch signiert. Ein Bericht ist nur vollständig innerhalb des gewählten Suchzeitraums und der technisch gesetzten Abfragegrenzen. Die lokale Browser-Zeitzone bestimmt das Datum. Keine direkte Änderung der Live-Datenbank und kein automatisches Deployment.

## Nächste, priorisierte Ausbaustufen

1. **Historische Integrität:** Snapshot der Kontrollpunkte beim Start, serverseitige Abschlussvalidierung, idempotente Scan-Ereignisse, verbindliche Berichtszeitzone und revisionsfähige Exporte. Migration erst nach RLS-Abnahme.
2. **Echte mobile Nachweise:** Geräte-NFC unter iOS/Android unterscheiden (PWA-Limitierungen beachten), Foto-Upload in private Storage-Buckets mit Mandantenpolicy, GPS nur zweckgebunden nach klarer Datenschutzeinstellung und informierten Mitarbeitern, Offline-Warteschlange mit Konfliktbehandlung.
3. **Pilotabnahme:** Mit fiktiven Daten zunächst End-to-End von Schichtfreigabe bis Wachbuch/WKS/Monatsbericht testen. Rollenmatrix (Owner, Admin, Disponent, Mitarbeiter, externer Kunde), Geräte, Audit, Datenlöschung, Export, Dienstplanimport und Störfallbetrieb abnehmen.

Eine vergleichbare Funktionsidee ist kein Nachweis gleicher Produktreife oder Zertifizierungen. Insbesondere beansprucht A ONE Guard weder ISO-27001-Zertifizierung noch vollständige DSGVO-Konformität ohne unabhängige und organisatorische Prüfung.
