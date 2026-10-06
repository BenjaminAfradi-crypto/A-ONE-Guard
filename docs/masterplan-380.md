# Masterplan – 380 Anforderungen
Stand: 21.09.2026. Originaltitel und Anforderungen aus dem bereitgestellten Masterplan.
**Keine Aussage, dass alle 380 Punkte fertig sind.** „implementiert_getestet“ bedeutet gezielte Code-/Datenbanktests bestanden; keine vollständige Abnahme des veröffentlichten Systems. „vorhanden_ungeprueft“ nennt nur den Prüfbereich, nicht die Erfüllung der Anforderung.

| Status | Anzahl |
|---|---:|
| implementiert_getestet | 13 |
| offen | 64 |
| teilweise | 17 |
| vorhanden_ungeprueft | 286 |

## 1. Multi-Tenant-System
Jedes Unternehmen erhält einen logisch getrennten Mandanten mit eigenen Benutzern, Rollen, Objekten, Dokumenten und Einstellungen.

Status: **teilweise**. Prüfbereich/Nachweis: `core.js, sw.js`.
Mandantenbezüge für Aufgaben, Qualitätsaudits und Formulare serverseitig geprüft; vollständige RLS-Rollenmatrix noch offen.

## 2. Rollen- und Berechtigungssystem
Rollen wie Owner, Admin, Geschäftsführung, Regionalleitung, Objektleitung, Dispatcher, HR, Finance, Auditor, Kunde und Mitarbeiter; Rechte granular steuerbar.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `core.js, sw.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 3. Login und Account-System
Registrierung, Login, Passwortänderung, Passwort vergessen, temporäre Passwörter, Pflicht-Passwortwechsel und Session-Verwaltung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `core.js, sw.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 4. Supabase Backend
Authentifizierung, Datenbank, Storage, RLS, Echtzeitdaten, API und Auditinformationen als zentrale technische Basis.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `core.js, sw.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 5. Row Level Security
Jeder Datensatz wird gegen Mandant, Rolle und Nutzer geprüft; keine unberechtigte Einsicht in fremde Daten.

Status: **teilweise**. Prüfbereich/Nachweis: `core.js, sw.js`.
RLS vorhanden; gezielte Negativtests bestehen. Nicht alle Tabellen und Rollen wurden end-to-end geprüft.

## 6. Audit Log
Wer, wann, was geändert hat, inklusive vorherigem und neuem Wert sowie optionalem Änderungsgrund.

Status: **teilweise**. Prüfbereich/Nachweis: `core.js, sw.js`.
Audit-Trigger für neue Module ergänzt; Vollständigkeit über alle Änderungen noch zu prüfen.

## 7. PWA
Installierbare Progressive Web App für schnellen Rollout ohne klassische App-Store-Abhängigkeit.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `core.js, sw.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 8. Mobile- und Desktop-Nutzung
Management mit Desktop-Fokus; Mitarbeiter mit stark vereinfachter Mobile-First-Oberfläche.

Status: **teilweise**. Prüfbereich/Nachweis: `core.js, sw.js`.
Neue Module und Dienstplan bei 390 px geprüft; weitere Geräte und vorhandene Module offen.

## 9. Vercel Deployment
Skalierbares Deployment für Anwendung und Website mit schneller Release-Pipeline.

Status: **offen**. Prüfbereich/Nachweis: `core.js, sw.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 10. Stripe Billing
Abos, Zahlungsmethoden, Tarifwechsel, Status, Kündigungen und SaaS-Abrechnung.

Status: **offen**. Prüfbereich/Nachweis: `core.js, sw.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 11. Testphase
Standardkunden erhalten z. B. 14 Tage Testphase; Pilot- und Enterprise-Kunden individuelle Modelle.

Status: **offen**. Prüfbereich/Nachweis: `core.js, sw.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 12. Mitarbeiter anlegen
Name, Personalnummer, E-Mail, Telefon, Eintritt, Austritt und Status.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 13. Bewacher-ID
Bewacher-ID direkt in der digitalen Personalakte verwalten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 14. Qualifikationslevel
Unterrichtung, Sachkunde und weitere Qualifikationen strukturiert abbilden.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 15. Stundenlohn
Interne Lohndaten als Grundlage für Kalkulation und Payroll Preparation.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 16. Urlaubstage
Urlaubsanspruch, Verbrauch und Resturlaub verwalten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 17. Mitarbeiterimport
Bestehende Personalbestände schnell übernehmen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 18. Excel-, XLSX- und CSV-Import
Importassistent mit Vorschau, Spalten-Mapping, Fehlerprüfung und Validierung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 19. Temporäre Passwörter
Automatisch erzeugbare Erstzugänge für neue Nutzer.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 20. Pflicht-Passwortwechsel
Erstpasswort muss bei der ersten Anmeldung geändert werden.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 21. Digitale Personalakte
Arbeitsvertrag, Ausweis, Aufenthaltstitel, Bewacherregister, §34a, Sachkunde, Führerschein, Erste Hilfe, Brandschutz, Waffensachkunde und Zertifikate.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 22. Ablaufdaten
Dokumente und Qualifikationen können mit Ablaufdatum geführt werden.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 23. Automatische Erinnerungen
Warnungen vor Dokumentablauf, Qualifikationsablauf, Unterweisungsfrist und Vertragsende.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 24. Qualifikationsmatrix
Unternehmensweite Übersicht über vorhandene, fehlende und bald auslaufende Qualifikationen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `mitarbeiter.js, personalakte.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 25. Wochenansicht
Dienstplanung nach Kalenderwoche.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 26. Objekt auswählen
Jede Schicht wird einem Objekt zugeordnet.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 27. Mitarbeiter auswählen
Schicht direkt einem Mitarbeiter zuweisen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 28. Datum und Uhrzeit
Start, Ende und Datum frei definierbar.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 29. Schnellzeiten
Vordefinierte Zeiten wie 06-14, 08-16, 12-20, 14-22 und 22-06.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 30. Mehrtagserstellung
Schichten für 1, 5 oder 7 Tage in einem Schritt erzeugen.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/dienstplan.browser.cjs`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 31. Unbesetzte Schichten
Dienste zunächst ohne Mitarbeiter erstellen und später besetzen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 32. Qualifikationsanforderung
Erforderliche Qualifikation direkt an der Schicht hinterlegen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 33. Schicht bearbeiten
Bestehende Schichten nachträglich anpassen.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/dienstplan.browser.cjs`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 34. Schicht stornieren
Storno mit Grund und Audit Trail.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 35. Schicht kopieren
Bestehenden Dienst duplizieren.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/dienstplan.browser.cjs`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 36. Schicht verschieben
Schicht auf anderes Datum verschieben, z. B. +1 Tag.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 37. Woche kopieren
Gesamte Wochenplanung auf Folgewochen übertragen.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/dienstplan.browser.cjs`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 38. Wochenfreigabe
Plan nach Prüfung veröffentlichen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 39. Filter nach Objekt
Nur relevante Objekte anzeigen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 40. Filter nach Mitarbeiter
Dienstplan eines einzelnen Mitarbeiters anzeigen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 41. Gesamtstunden
Geplante Stunden automatisch summieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 42. Unbesetzte Dienste
Zentrale Übersicht aller offenen Schichten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 43. Überschneidungsprüfung
Doppelplanung desselben Mitarbeiters verhindern.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/dienstplan.browser.cjs, tests/backend-integrity.sql`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 44. Drag & Drop
Schichten schnell zwischen Tagen, Objekten und Mitarbeitern verschieben.

Status: **offen**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 45. Monatsansicht
Planung auf Monatsbasis.

Status: **offen**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 46. Tagesansicht
Detailansicht eines einzelnen Tages.

Status: **offen**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 47. Mitarbeiterverfügbarkeit
Verfügbarkeiten berücksichtigen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 48. Wunschfrei
Wünsche und Sperrtage von Mitarbeitern einbeziehen.

Status: **offen**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 49. Urlaub und Krankheit
Abwesenheiten blockieren die Planung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 50. Überstunden
Erwartete Mehrarbeit sichtbar machen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 51. Ruhezeiten
Gesetzliche und interne Ruhezeiten automatisch prüfen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 52. Automatische Qualifikationsprüfung
Nur einsatzfähige Mitarbeiter vorschlagen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 53. Objektanforderungen
Objektspezifische Voraussetzungen berücksichtigen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 54. Mindestbesetzung
Sollbesetzung pro Objekt überwachen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 55. Sollstunden und Iststunden
Planung gegen tatsächliche Arbeitszeit vergleichen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 56. Schichttausch
Mitarbeiter können Tauschvorgänge beantragen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 57. Offene Schichten
Freie Dienste intern ausschreiben.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 58. Schichtannahme
Geeignete Mitarbeiter können offene Schichten annehmen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 59. Automatische Benachrichtigung
Push-Mitteilungen bei neuen oder geänderten Schichten.

Status: **offen**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 60. AI-Dienstplanung
Passende Mitarbeiter anhand von Qualifikation, Verfügbarkeit, Entfernung, Arbeitszeit, Überstunden und Objektkenntnis vorschlagen.

Status: **offen**. Prüfbereich/Nachweis: `dienstplan.js, dienstausch-admin.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 61. Einstempeln
Arbeitsbeginn digital erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 62. Ausstempeln
Arbeitsende erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 63. Pausen
Pausenbeginn und -ende dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 64. Offene Zeiteinträge
Fehlende Abschlussbuchungen zentral anzeigen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 65. Korrekturanträge
Mitarbeiter kann fehlerhafte Buchung melden.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 66. Management-Freigabe
Korrekturen erst nach Prüfung übernehmen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 67. Schichtbezug
Zeitdaten mit geplanter Schicht verknüpfen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 68. Objektbezug
Zeitbuchung gehört zu einem konkreten Objekt.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 69. App-Zeiterfassung
Clock-in/out direkt in der Mitarbeiter-App.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 70. NFC-Zeiterfassung
NFC-Tag am Objekt löst Zeitbuchung aus.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/nfc.browser.cjs, tests/backend-integrity.sql`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 71. QR-Zeiterfassung
QR-Code als alternative Buchungsmethode.

Status: **offen**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 72. Kiosk-Modus
Gemeinsames Tablet am Objekt.

Status: **offen**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 73. Manuelle Zeiterfassung
Manuelle Änderungen nur mit entsprechender Berechtigung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 74. Automatische Stundenabrechnung
Arbeitszeiten automatisch zusammenfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 75. Soll-Ist-Vergleich
Geplante und tatsächliche Zeit vergleichen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 76. Verspätungserkennung
Zu späten Dienstbeginn automatisch erkennen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 77. Frühes Ausstempeln
Vorzeitiges Dienstende markieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 78. Fehlender Check-out
Automatische Warnung bei fehlendem Ausstempeln.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 79. Nachtstunden
Nachtanteile automatisch kennzeichnen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 80. Sonntagsstunden
Sonntagsarbeit separat berechnen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 81. Feiertagsstunden
Feiertage nach Standort/Bundesland berücksichtigen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 82. Zuschläge
Grundlage für Zuschlags- und Lohnlogik.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 83. Lohnexport
Zeitdaten für Lohnabrechnung ausgeben.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 84. DATEV Export
Vorbereitete Zeit- und Lohndaten in DATEV-kompatible Form überführen.

Status: **offen**. Prüfbereich/Nachweis: `employee.js, arbeitszeiten.js, payroll.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 85. Objekt-NFC-Tags
Tags eindeutig einem Objekt zuordnen.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/nfc.browser.cjs, tests/backend-integrity.sql`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 86. Tokenbasierte NFC-Tags
Sichere Token statt offen manipulierbarer Objektinformationen.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/nfc.browser.cjs, tests/backend-integrity.sql`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 87. Aktiv/Inaktiv
Tags administrativ sperren oder reaktivieren.

Status: **teilweise**. Prüfbereich/Nachweis: `nfc.js, nfc-admin.js`.
Datenbank unterstützt Aktiv/Inaktiv; Verwaltung vorhandener Tags noch zu ergänzen.

## 88. Automatisches Einstempeln
Tag öffnen, Nutzer und Objekt erkennen, Zeit starten.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/nfc.browser.cjs, tests/backend-integrity.sql`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 89. Automatisches Ausstempeln
Offenen Zeiteintrag erkennen und beenden.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/nfc.browser.cjs, tests/backend-integrity.sql`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 90. Schichterkennung
Passende geplante Schicht automatisch suchen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `nfc.js, nfc-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 91. Falsches Objekt verhindern
Objektzuordnung validieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `nfc.js, nfc-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 92. NFC Audit
Jede Tag-Nutzung protokollieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `nfc.js, nfc-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 93. NFC Management
Zentrale Verwaltung aller Tags.

Status: **teilweise**. Prüfbereich/Nachweis: `nfc.js, nfc-admin.js`.
Tags können erstellt und beschrieben werden; Liste und Sperrfunktion fehlen noch.

## 94. iPhone-kompatible NFC-URLs
URL-basierter NFC-Flow für iOS-Kompatibilität.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `nfc.js, nfc-admin.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 95. Objektstammdaten
Name, Kunde, Adresse und Status.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 96. Standortdaten
Latitude, Longitude und Geofence.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 97. Location Policy
Objekt definiert, ob Standortprüfung erforderlich ist.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 98. Digitale Objektakte
Zentrale Akte für alle Informationen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 99. Ansprechpartner
Kundenkontakte und interne Verantwortliche.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 100. Dienstanweisung
Objektspezifische Dienstvorgaben.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 101. Objektanweisung
Spezielle Abläufe und Regeln.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 102. Notfallkontakte
Polizei, Feuerwehr, Kunde, Objektleitung und weitere Stellen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 103. Alarmplan
Definierte Alarm- und Eskalationsprozesse.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 104. Schlüssel
Objektbezogene Schlüsselverwaltung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 105. Zugangsdaten
Zugangscodes, Karten und Berechtigungen geschützt verwalten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 106. Schichtmodelle
Standardbesetzungen und Dienstmuster.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 107. Benötigte Qualifikation
Mindestanforderungen je Objekt.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 108. Mindestbesetzung
Erforderliche Mitarbeiterzahl.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 109. WKS-Routen
Kontrollrouten direkt zuordnen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 110. Objektdokumente
Pläne, Anweisungen, Formulare und Nachweise.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 111. Objekt-Wachbuch
Chronologie aller Wachbucheinträge.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 112. Objektvorfälle
Alle Incidents des Standortes.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 113. Objektfotos
Fotodokumentation von Bereichen und Zustand.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 114. Objektgeräte
Geräte und Technik verwalten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 115. Objektfahrzeuge
Fahrzeuge zuordnen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `objekte.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 116. Patrol Routes
Digitale Rundgangsrouten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 117. Kontrollpunkte
QR- oder NFC-basierte Kontrollstellen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 118. Kontrolllauf
Mitarbeiter startet einen vollständigen Rundgang.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 119. Zeitstempel
Jeder Kontrollpunkt erhält Datum und Uhrzeit.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 120. Mitarbeiterzuordnung
Rundgang eindeutig einer Person zuweisen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 121. Fehlende Kontrollpunkte
Ausgelassene Punkte automatisch erkennen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 122. Zeitfenster
Rundgänge müssen innerhalb definierter Fenster erfolgen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 123. Verspäteter Rundgang
Warnung bei verspätetem Kontrolllauf.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 124. Live-Status
Laufende Rundgänge im Command Center sichtbar.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 125. Notfalltaste
SOS-Funktion während des Rundgangs.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 126. Foto am Kontrollpunkt
Optionaler Bildnachweis.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 127. Kommentar
Besonderheiten dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 128. Offline-Modus
Rundgänge ohne Netz durchführen und später synchronisieren.

Status: **offen**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 129. Automatische Eskalation
Nicht erfolgte Rundgänge eskalieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 130. Rundgangbericht
Automatischer Abschlussbericht.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, einsatz.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 131. Digitale Wachbucheinträge
Papierwachbuch digital ersetzen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 132. Mitarbeiterzuordnung
Autor jedes Eintrags eindeutig festhalten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 133. Objektzuordnung
Eintrag dem richtigen Objekt zuordnen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 134. Datum und Uhrzeit
Automatisch dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 135. Schichtübergabe
Informationen strukturiert an Folgeschicht übergeben.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 136. Besondere Vorkommnisse
Freitext und strukturierte Ereignisse.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 137. Besucher
Optional Besucherbezug erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 138. Schlüsselübergabe
Ein- und Ausgabe dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 139. Technikstörung
Defekte und Maßnahmen erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 140. Alarmereignisse
Alarme im Wachbuch dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 141. Polizei
Polizeikontakt erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 142. Feuerwehr
Feuerwehreinsatz dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 143. Rettungsdienst
Medizinische Einsätze dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 144. Anhänge
Fotos und Dokumente beifügen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 145. Digitale Bestätigung
Übergaben oder besondere Einträge bestätigen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 146. PDF Export
Wachbuch nach Zeitraum oder Objekt exportieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 147. Manipulationssichere Archivierung
Nachträgliche Änderungen transparent und nachvollziehbar halten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js, reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 148. Zentrale Incident-Struktur
Einheitlicher Workflow für alle Vorfallsarten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 149. Diebstahl
Retail-Diebstahl strukturiert erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 150. Hausverbot
Hausverbote dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 151. Körperverletzung
Personenbezogene Vorfälle strukturiert dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 152. Sachbeschädigung
Schäden und Maßnahmen erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 153. Brand
Brandereignisse dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 154. Medizinischer Notfall
Maßnahmen und Rettungsdienst protokollieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 155. Polizei
Vorgangsnummer und Kontakt erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 156. Alarm
Alarmtyp und Reaktion.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 157. Technische Störung
Technische Ereignisse dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 158. Unfall
Arbeits- oder sonstige Unfälle erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 159. Fotos
Bildbeweise anhängen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 160. Zeugen
Zeugeninformationen erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 161. Beteiligte
Beteiligte Personen strukturiert erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 162. Maßnahmen
Reaktion und Folgeaktivitäten dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 163. Automatische Incident-Nummer
Jeder Vorgang erhält eine eindeutige Nummer.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 164. PDF Bericht
Professionellen Vorfallsbericht erzeugen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 165. Freigabe
Kritische Vorfälle durch Objektleitung oder Management freigeben.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `security-ops.js, employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 166. Private Storage
Dokumente sind nicht öffentlich abrufbar.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 167. Dateitypen
PDF, Bilder, DOCX, XLSX, CSV und weitere Formate.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 168. Dokumentregistrierung
Metadaten, Zugehörigkeit und Kategorie speichern.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 169. Versionierung
Ältere Dokumentversionen erhalten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 170. Freigabestatus
Entwurf, freigegeben, archiviert.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 171. Archivierung
Regelkonforme Ablage.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 172. Zugriff protokollieren
Öffnen, Herunterladen und Änderungen auditieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 173. Dokumentversand
Dokumente gezielt an berechtigte Personen verteilen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 174. Mitarbeiterdokumente
Personalakte.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 175. Objektdokumente
Objektakte.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 176. Verträge
Kunden- und sonstige Verträge.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 177. Dienstanweisungen
Aktuelle und historische Versionen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 178. Zertifikate
Qualifikationsnachweise.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 179. Unterweisungen
Pflichtunterweisungen und Nachweise.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 180. Formulare
Digitale Formulare und Vorlagen.

Status: **teilweise**. Prüfbereich/Nachweis: `documents.js, meine-dokumente.js`.
Formular-Builder und Einreichung mit historischer Vorlage ergänzt; vollständiger Dokumentenprozess separat zu prüfen.

## 181. Fahrzeuge
Fahrzeugstammdaten verwalten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 182. Fahrt starten
Fahrer und Kilometerstand erfassen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 183. Fahrt beenden
Endkilometer und Status dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 184. Kennzeichen
Eindeutige Fahrzeugidentifikation.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 185. Fahrer
Fahrerzuordnung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 186. Kilometer
Start- und Endkilometer.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 187. Tankvorgänge
Verbrauch und Kosten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 188. Fahrzeugschäden
Schäden inkl. Fotos dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 189. Unfall
Unfallverwaltung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 190. Führerscheinkontrolle
Gültigkeit dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 191. Wartung
Serviceintervalle.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 192. TÜV
Fristen überwachen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 193. UVV
Prüfung und Nachweise.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 194. Reparatur
Werkstattstatus und Kosten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 195. Automatische Erinnerungen
TÜV, Wartung, Führerschein etc.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `fuhrpark.js, fahrtenbuch.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 196. Kurssystem
Zentrale interne Academy.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 197. Lernmodule
Kurse in kleine Lerneinheiten strukturieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 198. Quizfragen
Wissenschecks.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 199. Lernfortschritt
Fortschritt speichern.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 200. XP und Lernmotivation
Optionales Gamification-Element.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 201. Bestanden / Nicht bestanden
Prüfergebnisse.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 202. Ergebnis-Historie
Vergangene Prüfungen und Versuche.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 203. Lernmodus
Erklärungen während des Lernens.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 204. Prüfungsmodus
Bewertete Tests.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 205. Erklärungen
Warum ist eine Antwort richtig oder falsch?

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 206. Unterweisungen
Pflichtinhalte.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 207. Kenntnisnahme
Dokumentierte Bestätigung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 208. Suche
Kurse schnell finden.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 209. Kategorien
Recht, Brandschutz, Retail, Datenschutz etc.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 210. Mitarbeiter-Dashboard
Eigene Kurse und Fristen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 211. Management-Dashboard
Schulungsstatus aller Mitarbeiter.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 212. Eigene Firmenkurse
Unternehmen erstellen eigene Lerninhalte.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 213. Objektunterweisungen
Objektspezifische Schulungen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 214. Multimedia
PDF, Video, Bilder.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 215. Fälligkeiten
Kurse erhalten Deadlines.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 216. Automatische Erinnerungen
Überfällige Schulungen eskalieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 217. Schulungsnachweise
Nach erfolgreichem Abschluss.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 218. Interne Zertifikate
Interne Nachweise, klar getrennt von staatlichen Qualifikationen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 219. Kurszuweisung
Nach Mitarbeiter, Objekt oder Rolle.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `lernwelt.js, lernwelt-admin.js, pflichtschulungen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 220. Monatsarchive
Monatliche Abschlussstände und Archive.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 221. Historische Daten
Frühere Monate jederzeit abrufbar.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 222. Integritätsprüfung
Hash- oder ähnliche Mechanismen zur Erkennung nachträglicher Veränderungen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 223. Arbeitszeitreports
Monatsauswertung der Stunden.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 224. Wachbuchreports
Export von Wachbuchdaten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 225. WKS Reports
Rundgangquote und Kontrollnachweise.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 226. Incident Reports
Vorfallübersichten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 227. Mitarbeiterreports
Stunden, Qualifikationen und Fehlzeiten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 228. Schulungsreports
Compliance- und Lernstatus.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 229. Fuhrparkreports
Fahrten, Kosten und Wartung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `reporting.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 230. MFA
Mehrfaktor-Authentifizierung.

Status: **offen**. Prüfbereich/Nachweis: `core.js, compliance.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 231. SSO
Enterprise Single Sign-On.

Status: **offen**. Prüfbereich/Nachweis: `core.js, compliance.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 232. Microsoft Entra ID
Unternehmensintegration.

Status: **offen**. Prüfbereich/Nachweis: `core.js, compliance.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 233. Feingranulare Rechte
Feld- und Funktionsrechte.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `core.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 234. Exportprotokollierung
Datenexporte nachvollziehbar protokollieren.

Status: **teilweise**. Prüfbereich/Nachweis: `core.js, compliance.js`.
Neue CSV-/Drucknachweise protokollieren Export; sämtliche vorhandenen Exportpfade noch zu prüfen.

## 235. Session Security
Sitzungen überwachen und absichern.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `core.js, compliance.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 236. DSGVO-Prozesse
Auskunft, Löschung und Datenexport unterstützen.

Status: **offen**. Prüfbereich/Nachweis: `core.js, compliance.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 237. AVV
Grundlage zur Auftragsverarbeitung.

Status: **offen**. Prüfbereich/Nachweis: `core.js, compliance.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 238. Aufbewahrungs- und Löschkonzept
Daten abhängig vom Typ automatisiert archivieren oder löschen.

Status: **offen**. Prüfbereich/Nachweis: `core.js, compliance.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 239. Heute
Aktuellen Dienst und wichtigste Aufgaben zeigen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 240. Mein Dienstplan
Persönlicher Kalender.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 241. Ein-/Ausstempeln
Große einfache Buttons.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 242. Pause
Direkte Pausenfunktion.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 243. Wachbuch
Schnelle Einträge.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 244. WKS
Rundgänge starten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 245. Vorfall melden
Schnelle Incident-Erfassung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 246. Dokumente
Eigene und objektbezogene Dokumente.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 247. Fahrtenbuch
Dienstfahrten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 248. Lernwelt
Schulungen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 249. Urlaub und Krankheit
Abwesenheiten melden.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 250. Schichttausch
Dienste tauschen oder abgeben.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 251. Profil
Eigene Daten einsehen und zulässige Daten pflegen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `employee.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 252. Zentraldashboard
Zentrale Managementübersicht.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `admin.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 253. Personalstatus
Wer arbeitet heute, wer fehlt?

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `admin.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 254. Objektstatus
Welche Objekte sind vollständig besetzt?

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `admin.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 255. Verspätungen
Live sichtbar.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `admin.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 256. Rundgangstatus
Fehlende WKS-Läufe erkennen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `admin.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 257. Dokumentwarnungen
Ablaufende Qualifikationen und Nachweise.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `admin.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 258. Incidentübersicht
Offene kritische Ereignisse.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `admin.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 259. AI-Dienstplanung
Mitarbeitervorschläge anhand von Qualifikation, Arbeitszeit, Verfügbarkeit, Entfernung, Überstunden und Objektkenntnis.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 260. AI Operations
Wachbucheinträge zusammenfassen und Auffälligkeiten erkennen.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 261. AI Incident Assistant
Berichte sprachlich verbessern, ohne neue Tatsachen zu erfinden.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 262. AI Management Query
Management kann operative Fragen in natürlicher Sprache stellen.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 263. REST API
Offene Programmierschnittstelle.

Status: **teilweise**. Prüfbereich/Nachweis: `operations.js`.
Vorhandene Edge API unterstützt lesenden Zugriff; produktive Integration und Pagination offen.

## 264. SAP Integration
ERP-Anbindung.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 265. DATEV Integration
Finance- und Payroll-Anbindung.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 266. HR-Systeme
Schnittstellen zu HR-Plattformen.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 267. Lohnabrechnungssysteme
Zeit- und Zuschlagsdaten exportieren.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 268. Webhooks
Events an Drittsysteme übertragen.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 269. White Label
Kundenbranding.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 270. Kundenspezifische Entwicklung
Enterprise-Sonderfunktionen.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 271. AI-Dienstplanung Add-on
Optionales Premium-Modul.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 272. API Add-on
Erweiterte API-Funktionen.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 273. SAP Add-on
Individuelle Integration.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 274. DATEV Add-on
Erweiterte Finanzschnittstelle.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 275. SSO Add-on
Enterprise Identity.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 276. SLA Add-on
Vertraglich definierte Servicelevels.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 277. Premium Support
Priorisierter Support.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 278. White Label Add-on
Eigene Domain und Branding.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 279. Individuelle Entwicklung
Separat kalkulierbare Sonderentwicklung.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 280. GPS/Fahrtenbuch Add-on
Erweiterte Flottenfunktionen.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 281. Waffenverwaltung Add-on
Für bewaffnete Dienste.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 282. Advanced Reporting
Enterprise BI und individuelle Berichte.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 283. Waffenregister
Waffe, Typ und Seriennummer.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `waffen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 284. Ausgabe und Rückgabe
Wer erhielt wann welche Waffe?

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `waffen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 285. Mitarbeiterberechtigung
Nur berechtigte Personen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `waffen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 286. Munition
Ausgabe und Bestand dokumentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `waffen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 287. Waffensachkunde
Nachweise und Ablaufdaten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `waffen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 288. Vollständiger Audit Trail
Jeder Vorgang nachvollziehbar.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `waffen.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 289. Enterprise Design
Professioneller B2B-SaaS-Auftritt.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 290. Hero-Bereich
Klares Produktversprechen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 291. Produktdemo
Interaktive oder videobasierte Demonstration.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 292. Screenshots
Echte Produktansichten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 293. Module
Produktbereiche verständlich präsentieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 294. Vorteile
Messbarer Nutzen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 295. Security und Datenschutz
Vertrauen aufbauen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 296. Kunden und Referenzen
Nur mit Einwilligung verwenden.

Status: **offen**. Prüfbereich/Nachweis: `index.html, demo.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 297. Pricing
Tarife verständlich darstellen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 298. Enterprise CTA
Demo oder Beratung buchen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 299. Pilot anfragen
Pilotprogramm bewerben.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 300. Kontakt
Sales-Anfrage.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 301. Impressum
Rechtspflicht.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 302. Datenschutzseite
DSGVO-Informationen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 303. AGB
SaaS-Vertragsgrundlage.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `index.html, demo.html`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 304. EGNAS Pilot
Premium-Pilot für 6-12 Monate kostenlos gegen reale Nutzung, Bug Reports, Feedback, Feature Requests und Performance-Tests.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 305. EGNAS nach Pilot
Möglicher langfristiger Sonderpreis nach Pilotphase.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 306. Standard Plan
Für kleine Sicherheitsunternehmen.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 307. Business Plan
Grundgebühr plus Mitarbeiterkomponente.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 308. Enterprise Plan
Staffelpreis nach Größe und Anforderungen.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 309. Setup Fee
Einrichtung separat berechnen.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 310. Migration Fee
Datenübernahme separat kalkulieren.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 311. Integrationskosten
SAP, API, SSO und andere Integrationen separat.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 312. Support- und SLA-Gebühren
Enterprise-Servicepakete.

Status: **offen**. Prüfbereich/Nachweis: `index.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 313. Pilotkunden
EGNAS als Entwicklungs- und Referenzpartner nutzen.

Status: **offen**. Prüfbereich/Nachweis: `egnas.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 314. Kleine Firmen
Self-Service SaaS.

Status: **offen**. Prüfbereich/Nachweis: `egnas.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 315. Mittelstand
Unternehmen mit ca. 100-1.000 Mitarbeitern als zentrale Business-Zielgruppe.

Status: **offen**. Prüfbereich/Nachweis: `egnas.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 316. Großunternehmen
Securitas, Pond, FraSec und vergleichbare Firmen als Enterprise-Zielgruppe.

Status: **offen**. Prüfbereich/Nachweis: `egnas.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 317. Enterprise ARR Strategie
Wenige große Kunden mit substanziellen Jahresverträgen und skalierbaren Add-ons.

Status: **offen**. Prüfbereich/Nachweis: `egnas.html`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 318. Eigenes Kundenportal
Kunde sieht nur freigegebene eigene Daten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 319. Dienstplanansicht
Besetzung der Kundenobjekte.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 320. Geleistete Stunden
Transparente Leistungsübersicht.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 321. Wachbuch
Freigegebene Einträge.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 322. Rundgänge
WKS-Nachweise.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 323. Vorfälle
Freigegebene Incident Reports.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 324. SLA/KPI
Servicequalität transparent darstellen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 325. Rechnungen
Übersicht und Download.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 326. Ansprechpartner
Klare Kommunikationsstruktur.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 327. Reklamationen
Tickets und Bearbeitungsstatus.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `kundenportal.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 328. Auftrag als eigene Entity
Auftrag unabhängig vom Objekt als eigener Datensatz.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 329. Vertragsbeginn und Ende
Laufzeiten verwalten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 330. Kündigungsfrist
Automatische Erinnerungen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 331. Stundenkontingent
Geplante Leistungsmenge.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 332. Verkaufspreis
Stundenverrechnungssatz und Historie.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 333. Leistungsbeschreibung
Vertraglicher Leistungsumfang.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 334. Vertrags-SLA
Servicelevel je Vertrag.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 335. Preisänderungen
Historie und Anpassungen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 336. Deckungsbeitragsrechnung
Verkaufspreis minus echte Kosten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 337. Umsatz pro Objekt
Finanzübersicht je Objekt.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 338. Personalkosten
Direkte Kosten berücksichtigen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 339. Sonstige Kosten
Fahrzeug, Ausrüstung, Verwaltung etc.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 340. Objektmarge
Rentabilität sichtbar machen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 341. Automatische Faktura
Freigegebene Stunden erzeugen Rechnungsentwurf.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 342. Leistungsnachweis
Nachweis zusammen mit Rechnung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 343. Rechnungsstatus
Offen, bezahlt, teilweise bezahlt, überfällig.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 344. Payroll Preparation
Zeitdaten und Zuschläge für Lohnabrechnung vorbereiten.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `commercial.js, payroll.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 345. Bewerbermanagement
Bewerberprofile und Status.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `recruiting.js, hr-workflows.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 346. Bewerberpipeline
Bewerbung -> Prüfung -> Interview -> Einstellung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `recruiting.js, hr-workflows.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 347. Bewerberdokumente
Lebenslauf, Qualifikationen, Nachweise.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `recruiting.js, hr-workflows.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 348. Bewerber zu Mitarbeiter
Mit einem Klick in Mitarbeiterstamm übernehmen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `recruiting.js, hr-workflows.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 349. Mitarbeiter-Onboarding
Checklisten, Dokumente und Freigaben.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `recruiting.js, hr-workflows.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 350. Qualifikationsprüfung vor Einsatz
Schicht nur mit passenden Mitarbeitern besetzen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `compliance.js, dienstplan.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 351. Objektunterweisung als Einsatzvoraussetzung
Ohne gültige Unterweisung keine Freigabe.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `compliance.js, dienstplan.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 352. Compliance Center
Rot/Gelb/Grün-Übersicht über kritische Nachweise.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `compliance.js, dienstplan.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 353. Subunternehmer Management
Nachunternehmer inklusive Personal, Dokumente, Compliance und Abrechnung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `compliance.js, dienstplan.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 354. Live Operations Map
Status der Objekte und Einsätze auf Karte.

Status: **teilweise**. Prüfbereich/Nachweis: `operations.js, escalations.js`.
Statusübersicht mit Kartenlinks, noch keine interaktive Live-Karte.

## 355. Alarm- und Eskalationsengine
Automatische Eskalationsketten bei Ausfällen und kritischen Ereignissen.

Status: **teilweise**. Prüfbereich/Nachweis: `operations.js, escalations.js`.
Vorhandene Cron-Engine und Eskalationen; Alarmketten und Zustellnachweise noch end-to-end zu prüfen.

## 356. Lone Worker
Totmannfunktion und Sicherheitschecks für Einzelarbeitsplätze.

Status: **teilweise**. Prüfbereich/Nachweis: `operations.js, escalations.js`.
Check-in-Start, Rückmeldung und Abschluss getestet. Kein Nachweis eines ausfallsicheren Totmannsystems oder einer Notrufzustellung.

## 357. SOS Button
Schnelle Notfallmeldung mit Einsatzbezug.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `operations.js, escalations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 358. Schichtübergabe
Strukturierter Übergabeprozess.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `operations.js, escalations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 359. Schlüsselmanagement
Ausgabe, Rückgabe und Bestand.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `equipment.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 360. Equipmentverwaltung
Funkgeräte, Bodycams, Handys, Taschenlampen und sonstige Betriebsmittel.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `equipment.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 361. Aufgabenmanagement
Aufgaben pro Objekt mit Frist und Verantwortlichem.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/operations.browser.cjs`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 362. Qualitätsmanagement
Audits, Abweichungen und Maßnahmen.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/operations.browser.cjs`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 363. Kundenreklamationen
Ticket-System für Beschwerden und Nachverfolgung.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `equipment.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 364. KPI Dashboard
Operative Kennzahlen für Management und Kunden.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `equipment.js, operations.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 365. Ask A ONE
Natürliche Sprache als zentrale Abfrage- und Steueroberfläche.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 366. AI Incident Copilot
Unstrukturierte Notizen in saubere Vorfallsberichte überführen.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 367. AI Operations Monitor
Personal-, SLA- und Einsatzrisiken erkennen.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 368. Offline First
Wachbuch, WKS, Incidents und Checklisten ohne Internet nutzbar machen.

Status: **offen**. Prüfbereich/Nachweis: `operations.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 369. Proof of Service
Chronologischer Leistungsnachweis vom Dienstbeginn bis Dienstende.

Status: **teilweise**. Prüfbereich/Nachweis: `operations.js`.
Chronologie für Zeiten, Wachbuch und Vorfälle mit CSV/Druck; WKS-Integration und vollständige Schichtkette fehlen.

## 370. Enterprise Audit Trail
Jede relevante Änderung vollständig nachvollziehbar.

Status: **teilweise**. Prüfbereich/Nachweis: `operations.js`.
Zusätzliche Audit-Trigger; vollständige manipulationsgeschützte Enterprise-Protokollierung nicht nachgewiesen.

## 371. Developer Platform
API Keys, OAuth, Webhooks, Sandbox und Integration Logs.

Status: **teilweise**. Prüfbereich/Nachweis: `operations.js, commercial.js`.
Schlüsselgenerierung mit Hash, einmalige Anzeige, Sperrung und Logs; OAuth, Webhooks und Sandbox fehlen.

## 372. CRM und Ausschreibungen
Leadmanagement, Tender-Pipeline und Angebotsprozess.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `operations.js, commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 373. Angebotsgenerator
Angebote aus Leistungsparametern erstellen.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `operations.js, commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 374. Einsatzkalkulator
Personalbedarf, Kosten, Marge und Mindestpreis kalkulieren.

Status: **vorhanden_ungeprueft**. Prüfbereich/Nachweis: `operations.js, commercial.js`.
Originalanforderung im passenden Modul mit echten Rollen und Daten abnehmen; Dateivorhandensein ist kein Funktionsnachweis.

## 375. Forecasting
Personal, Umsatz, Kosten und Kapazität prognostizieren.

Status: **offen**. Prüfbereich/Nachweis: `operations.js, commercial.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 376. Regel-Engine
Wenn-Dann-Regeln ohne Programmierung.

Status: **teilweise**. Prüfbereich/Nachweis: `operations.js, commercial.js`.
Konfigurierbare vorhandene Trigger und Aktionen; reale zeitgesteuerte Ausführung noch end-to-end zu prüfen.

## 377. Automation Builder
Mehrstufige Workflows definieren.

Status: **teilweise**. Prüfbereich/Nachweis: `operations.js, commercial.js`.
Einzelne Trigger-Aktion-Regeln; keine mehrstufigen Workflows.

## 378. Form- und Checklist Builder
Eigene Formulare und Prüfprozesse ohne Code.

Status: **implementiert_getestet**. Prüfbereich/Nachweis: `tests/operations.browser.cjs, tests/backend-integrity.sql`.
Code-/Datenbanktests bestanden; Abnahme im veröffentlichten Frontend steht aus. Browsertests verwenden simulierte Backendantworten.

## 379. No-Code Workflow Studio
Komplette Prozesse visuell konfigurieren.

Status: **offen**. Prüfbereich/Nachweis: `operations.js, commercial.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.

## 380. A ONE Intelligence Layer
Zentrale intelligente Schicht über Daten, Nutzer, Prozesse, Verträge, Personal, Objekte, Kosten, Compliance, Vorfälle und Reports.

Status: **offen**. Prüfbereich/Nachweis: `operations.js, commercial.js`.
Vollständige Umsetzung bzw. externe Konfiguration und Abnahme fehlen oder sind nicht nachgewiesen.
