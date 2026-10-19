const {test} = require('node:test');
const assert = require('node:assert/strict');
const report = require('../betriebsberichte-core.js');

test('date ranges include the complete final day', () => {
  const p = report.period('2026-10-01','2026-10-07');
  assert.equal(p.days,7);
  assert.ok(Date.parse(p.until) > Date.parse(p.from));
  assert.equal(new Date(p.until).getTime() - new Date(p.from).getTime(),7*86400000);
});

test('month boundaries and leap years are valid', () => {
  assert.equal(report.period('2024-02-29','2024-03-01').days,2);
  assert.throws(() => report.localDay('2026-02-29'),/existiert nicht/);
  assert.throws(() => report.period('2026-11-01','2026-10-31'),/Enddatum/);
  assert.throws(() => report.period('2026-01-01','2026-10-01'),/92 Tage/);
});

test('CSV export quotes text and prevents spreadsheet formula execution', () => {
  assert.equal(report.csvCell('=HYPERLINK("bad")'),'"\'=HYPERLINK(""bad"")"');
  assert.equal(report.csvCell(' +SUM(1;1)'),'"\' +SUM(1;1)"');
  assert.equal(report.csvCell('\t@SUM(A1)'),'"\'\t@SUM(A1)"');
  assert.equal(report.csvCell('a\nb'),'"a\nb"');
  const csv = report.csv(['Beschreibung'],[['Text; mehr']]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"Text; mehr"'));
});

test('patrol reports distinguish completed, incomplete, overdue and mismatched', () => {
  const run = {id:'run-1',route_id:'route-1',started_at:'2026-10-19T09:00:00.000Z',status:'completed'};
  const route = {expected_duration_min:30};
  const checkpoints = [{id:'c1',route_id:'route-1',active:true},{id:'c2',route_id:'route-1',active:true}];
  const oneScan = [{patrol_run_id:'run-1',checkpoint_id:'c1',site_match:true}];
  assert.equal(report.patrolState(run,route,checkpoints,oneScan).label,'Unvollständig');
  assert.equal(report.patrolState(run,route,checkpoints,oneScan.concat([{patrol_run_id:'run-1',checkpoint_id:'c2'}])).label,'Vollständig');
  assert.equal(report.patrolState({...run,status:'in_progress'},route,checkpoints,oneScan,Date.parse('2026-10-19T09:40:00Z')).label,'Überfällig');
  assert.equal(report.patrolState(run,route,checkpoints,[{...oneScan[0],site_match:false}]).label,'Standortabweichung prüfen');
  assert.equal(report.patrolState({...run,status:'canceled'},route,checkpoints,oneScan).label,'Abgebrochen');
  assert.equal(report.patrolState(run,route,[],oneScan).label,'Keine Kontrollpunkte');
});
