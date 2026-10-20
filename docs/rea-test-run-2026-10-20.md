# REA – Erster erfolgreicher Analysetest (20.10.2026)

**Ergebnis:** REA 6.7.0 hat die A-One-Guard-Quellen unter Node.js 24.11.0 in GitHub Actions erfolgreich statisch analysiert. Der korrigierte REA-Testlauf sowie die parallele Pilot-CI (Browser, Syntax, Unit, Deno) waren erfolgreich.

## Reproduzierbare Nachweise

- [Korrigierter REA-Workflow-Run](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/actions/runs/39445969383)
- [REA-JSON-Artefakt](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/actions/runs/39445969383/artifacts/12275567194) (nur 7 Tage aufbewahrt)
- [Paralleler Pilot-CI-Lauf](https://github.com/BenjaminAfradi-crypto/A-ONE-Guard/actions/runs/39445969329)
- Analysierter Commit: `8b2cca3b33531ac0fe8e11aa59e00db4cc23c36c`
- REA Evidence ID: `ev_8df568fc27daa8e8bd125118f9d92513a4ddfe5cdd3fac8706e4e979a7409c65`
- SHA-256 der Quellstruktur: `8e5657b7d1b00b1ecfa785be81b89862f93fd2551cbd96b4729e7bca3fdf0941`

## Statische REA-Metriken

| Kennzahl | Gemessener Wert |
| --- | ---: |
| Relevante Quelldateien | 132 |
| Analysierte JavaScript-Dateien | 66 |
| Übersprungene JavaScript-Dateien | 0 |
| Parse-Fehler | 0 |
| Besuchte AST-Knoten | 112.742 |
| REA-Findings (Analysebeobachtungen, nicht automatisch Bugs) | 636 |
| Knoten / Kanten im Application Graph | 600 / 949 |
| Knoten / Relationen im Semantic Graph | 79.332 / 73.826 |
| Statische Ungewissheitsdatensätze im Semantic Graph | 26.936 |
| Integritätswidersprüche in der Evidenz | 0 |

**Wichtig:** Die Zahl der REA-Findings ist **keine Fehleranzahl**. Die semantischen Ungewissheiten sind **keine nachgewiesenen Produktmängel**. Die vollständige Laufzeitfunktion sowie RLS, echte iOS-/Android-NFC-Scans und Geschäftslogik sind damit nicht abgenommen.

## Bekannte Abdeckungsgrenzen

REA hat JavaScript in folgenden HTML-Dateien nicht als Inline-Code analysiert:
- `admin-login.html`: zwei Inline-Skripte
- `login.html`: zwei Inline-Skripte
- `developer-password-setup.html`: ein Inline-Skript

Der Application Graph meldet insgesamt **partielle Abdeckung**. Unbekannte oder dynamische Verbindungen dürfen nicht als sicher fehlend interpretiert werden.

## Behobener Workflow-Fehler

Im ersten Test wurde die noch leere Ausgabedatei unter `rea-output/javascript-analysis.json` im Quellverzeichnis angelegt und von REA selbst miterfasst; deshalb erschien eine künstliche JSON-Parse-Warnung. Der Ausgabepfad liegt jetzt außerhalb des ausgecheckten Repositorys unter `$RUNNER_TEMP/rea-output`. Der zweite Lauf weist **0 Parse-Fehler** aus.

## Nächste belastbare Abnahmen

1. NFC-End-to-End auf echten Geräten inkl. Anmeldung, Ablaufzeit, Doppeleingaben, Offline-Situationen und serverseitiger RPC-Idempotenz.
2. Dienstplan inklusive Rollenberechtigungen, parallelen Bearbeitungen und verbindlichen Backend-Constraints prüfen.
3. Inline-JavaScript der genannten Login-Dateien untersuchen und bei Bedarf in überprüfbare externe Module auslagern.
4. Supabase-RLS-Schreibmatrix und echte Benutzer-/Objektgrenzen vor Pilotfreigabe separat testen.

**Einordnung:** Dieser Bericht bestätigt die erfolgreiche REA-Integration als statisches Analysetool. Er bestätigt **keine Produktionsreife von A One Guard**.
