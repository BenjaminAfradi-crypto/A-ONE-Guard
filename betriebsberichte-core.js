/* Pure helpers for historical operational reporting.
   No external LogPro source or UI components are used. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AoneOperationalReports = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  function localDay(text) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || ''));
    if (!match) throw new Error('Bitte ein gültiges Datum wählen.');
    const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
    const value = new Date(y, m - 1, d);
    if (value.getFullYear() !== y || value.getMonth() !== m - 1 || value.getDate() !== d)
      throw new Error('Das angegebene Datum existiert nicht.');
    return value;
  }
  function period(from, through) {
    const first = localDay(from), last = localDay(through);
    if (last < first) throw new Error('Das Enddatum darf nicht vor dem Anfang liegen.');
    const numberOfDays = Math.round((Date.UTC(last.getFullYear(), last.getMonth(), last.getDate()) -
      Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) / 86400000) + 1;
    if (numberOfDays > 92) throw new Error('Ein Bericht darf maximal 92 Tage umfassen.');
    const until = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    return {from: first.toISOString(), until: until.toISOString(), days: numberOfDays};
  }
  function csvCell(value) {
    let result = String(value == null ? '' : value);
    // Prevent spreadsheet formula injection, including after whitespace.
    if (/^\s*[=+\-@]/.test(result)) result = "'" + result;
    return '"' + result.replace(/"/g, '""') + '"';
  }
  function csv(headers, rows) {
    return '\uFEFF' + [headers].concat(rows).map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n';
  }
  function patrolState(run, route, checkpoints, scans, now) {
    const required = checkpoints.filter(p => p.route_id === run.route_id && p.active !== false);
    const matched = scans.filter(s => s.patrol_run_id === run.id);
    const ids = new Set(matched.map(s => s.checkpoint_id));
    const done = required.filter(p => ids.has(p.id)).length;
    const total = required.length;
    const mismatch = matched.some(s => s.site_match === false);
    const elapsed = (Number(now == null ? Date.now() : now) - Date.parse(run.started_at)) / 60000;
    const limit = Number(route && route.expected_duration_min);
    let label;
    if (run.status === 'canceled') label = 'Abgebrochen';
    else if (!total) label = 'Keine Kontrollpunkte';
    else if (mismatch) label = 'Standortabweichung prüfen';
    else if (run.status === 'completed') label = done === total ? 'Vollständig' : 'Unvollständig';
    else if (run.status === 'in_progress') {
      label = limit > 0 && Number.isFinite(elapsed) && elapsed > limit ? 'Überfällig' : 'Läuft';
    } else label = 'Status prüfen';
    return {label, done, total, mismatch};
  }
  return {localDay, period, csvCell, csv, patrolState};
});
