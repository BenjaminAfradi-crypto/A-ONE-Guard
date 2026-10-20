# REA-Integration für A One Guard (read-only)

Status: Vorbereitung zur Prüfung, **keine bestätigte Ausführung** und **keine Änderung der Live-Anwendung**.

## Ziel und Architektur

[REA](https://github.com/morluto/rea) wird als separates Werkzeug zur statischen Untersuchung der bestehenden JavaScript-Codebasis verwendet. Die A-One-Guard-Anwendung besteht aus HTML/CSS/JavaScript mit Supabase-Anbindung; REA ist kein Laufzeitmodul dieser Anwendung und wird **nicht** in die PWA eingebunden.

Die Integration erfolgt über den manuell aufrufbaren GitHub-Workflow `.github/workflows/rea-analysis.yml`. Er ist bewusst weder an `push` noch an `pull_request` gekoppelt, führt keine Datenbankmigration, keinen App-Build und kein Deployment aus und benötigt keine Anwendungs-Secrets.

## Verwendung in GitHub Actions

Nach dem Review und Merge des Workflows auf `main`:

1. Repository -> **Actions** -> **REA JavaScript Analysis** öffnen.
2. **Run workflow** manuell starten.
3. Nach Abschluss unter **Artifacts** `rea-javascript-analysis` herunterladen.
4. JSON-Evidenz prüfen. Fehler/Ungewissheiten im Bericht nicht als nachgewiesenes Laufzeitverhalten interpretieren.

Der Workflow nutzt REA `6.7.0` und Node.js `24.11.0`; die Analyse liest den ausgecheckten Quellcode statisch. Drittanbieter-Pakete werden ausschließlich im temporären GitHub-Runner verwendet. Vor der Freigabe einer neuen REA-Version sind Versionshinweise, Herkunft und gegebenenfalls die Paketinhalte zu prüfen.

### Lokaler Entwickler-Agent

Mit kompatiblem Node.js (22.19+, 24.11+ oder 26+) und npm:

```bash
npx rea-agents@6.7.0 setup
```

Beim Setup nur den gewünschten lokalen Agenten auswählen, Konfigurationsänderungen prüfen und ausdrücklich bestätigen. Dies registriert REA in **diesem lokalen Agenten**, nicht automatisch in einem bestehenden ChatGPT-Chat oder in GitHub. Für Codex kann eine separate, begrenzte Client-Konfiguration genutzt werden. Die Installation kann nicht durch das Hinzufügen dieser Repository-Dateien ersetzt werden.

## Fachliche Prüfaufträge (Priorität)

1. **NFC-Zeiterfassung:** Von `nfc.html` / `nfc.js` aus Login-Weiterleitung, Token-Lebensdauer, Request-ID, RPC-Aufruf `guard_clock_nfc_once` und Fehlerzustände nachzeichnen. Danach realen NFC-Test mit iOS/Android getrennt durchführen; statische Analyse ersetzt diesen nicht.
2. **Dienstplanung:** Von `dienstplan.html` / `dienstplan.js` aus Konfliktprüfung, Freigabe und Änderungen über mehrere Einstiegspunkte verfolgen. Serverseitige Constraints und Berechtigungen separat durch Backend-/RLS-Tests prüfen.
3. **Authentifizierung und Mandantenkontext:** In `core.js` / `auth.js` Session-Erneuerung, Rollenwechsel und Datengrenzen nachvollziehen. Autorisierung muss serverseitig über Supabase geprüft werden.
4. **Wachbuch/Betriebsberichte:** Ermittlung und Exportketten in `operations.js`, `betriebsberichte.js` und dem Backend verfolgen; Lücken in Audit, Zeitgrenzen und Reporting gesondert testen.

REA-Ergebnisse sollen immer mit Dateipfad, überprüfbarer Evidenz, Unsicherheiten, priorisiertem Fix und Reproduktionstest dokumentiert werden. Vor Pilotfreigabe weiterhin `npm test`, `npm run test:browser`, vollständige Rollen-/RLS-Prüfung und echte Gerätetests vorsehen.

## Grenzen und Sicherheit

- Bei Websites Dritter nur rechtmäßig zugängliche öffentliche Ressourcen oder explizit freigegebene Testumgebungen untersuchen; keine fremden Zugangsdaten, geschützten APIs oder Quelltexte übernehmen.
- Analyseartefakte können Codeausschnitte und technische Informationen enthalten. Vor Weitergabe personenbezogene Daten, Tokens und Umgebungswerte prüfen; keine Secrets in das Repo oder GitHub Actions eintragen.
- REA liefert Analyse-Evidenz, **keinen automatischen Beweis für funktionierende Features oder Produktionsreife**.
- Das Repo und dessen Workflow können REA vorbereiten; die tatsächliche Ausführung muss anhand eines erfolgreichen Action-Runs belegt werden.

Offizielle Referenzen: [REA README](https://github.com/morluto/rea/blob/main/README.md), [Installation](https://github.com/morluto/rea/blob/main/docs/installation.md), [JavaScript-Workflows](https://github.com/morluto/rea/blob/main/docs/javascript-application-workflows.md).
