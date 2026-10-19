/* Tenant-scoped management reports for Wachbuch and Wächterkontrollsystem. */
(async function () {
  'use strict';
  const core = globalThis.AoneOperationalReports;
  const $ = id => document.getElementById(id);
  const state = {ctx:null,sites:[],employees:[],routes:[],checkpoints:[],headers:[],rows:[],selection:null,busy:false};
  const options = {watchbook:['Zeitpunkt','Objekt','Mitarbeiter','Kategorie','Priorität','Eintrag','Eintrag-ID'],
    patrol:['Beginn','Ende','Objekt','Route','Mitarbeiter','Kontrollpunkte','Prüfstatus','Laufstatus','Rundgang-ID']};
  const labels = {routine:'Routine',handover:'Schichtübergabe',incident:'Vorkommnis',visitor:'Besucher',delivery:'Lieferung',
    alarm:'Alarm',technical:'Technik',police_fire:'Einsatzkräfte',key:'Schlüssel',patrol:'Rundgang',note:'Notiz'};
  const severity = {info:'Info',low:'Niedrig',medium:'Mittel',high:'Hoch',critical:'Kritisch'};
  const showError = message => { $('error').textContent = message || ''; $('error').hidden = !message; };
  const text = (id,value) => { $(id).textContent = value; };
  function isoDay(date) {
    return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  }
  function dateLabel(value) { return value ? AONE.dt(value) : '—'; }
  function siteName(id) { return state.sites.find(x => x.id === id)?.name || 'Unbekanntes Objekt'; }
  function employeeName(id) { return state.employees.find(x => x.id === id)?.display_name || '—'; }
  function params(data) { return new URLSearchParams(data).toString(); }
  async function all(table, filters) {
    const result = [];
    for (let offset = 0; offset < 20000; offset += 500) {
      const query = params({...filters,org_id:'eq.' + state.ctx.org_id,limit:500,offset});
      const page = await AONE.table(table,query);
      if (!Array.isArray(page)) throw new Error('Der Server hat keine vollständige Ergebnisliste geliefert.');
      result.push(...page);
      if (page.length < 500) return result;
    }
    throw new Error('Mehr als 20.000 Datensätze gefunden. Bitte den Zeitraum verkleinern. Kein Teilbericht wird angezeigt.');
  }
  async function initialize() {
    const session = await AONE.session();
    if (!session) { location.replace('./admin-login.html'); return; }
    state.ctx = await AONE.chooseContext();
    if (!state.ctx || !AONE.isManager(state.ctx.role)) {
      location.replace('./app.html');
      return;
    }
    text('org-name',state.ctx.org?.name || 'Betriebsberichte');
    $('logout').onclick = () => { AONE.signOut(); location.replace('./admin-login.html'); };
    const today = new Date(), from = new Date(today.getFullYear(), today.getMonth(), today.getDate()-6);
    $('through').value = isoDay(today);
    $('from').value = isoDay(from);
    const [sites,employees,routes,checkpoints] = await Promise.all([
      all('guard_sites',{select:'id,name',order:'name.asc'}),
      all('guard_employees',{select:'id,display_name',order:'display_name.asc'}),
      all('guard_patrol_routes',{select:'id,site_id,name,expected_duration_min,active',order:'name.asc'}),
      all('guard_checkpoints',{select:'id,route_id,name,active',order:'route_id.asc,id.asc'})
    ]);
    state.sites = sites; state.employees = employees; state.routes = routes; state.checkpoints = checkpoints;
    // Using DOM nodes and textContent avoids treating customer-maintained names as HTML.
    for (const s of sites) {
      const item = document.createElement('option');
      item.value = s.id;
      item.textContent = s.name;
      $('site').appendChild(item);
    }
    $('report-form').onsubmit = loadReport;
    $('kind').onchange = clearResults;
    $('site').onchange = clearResults;
    $('from').onchange = clearResults;
    $('through').onchange = clearResults;
    $('export').onclick = exportCsv;
    $('print').onclick = () => window.print();
    text('report-state','Bereit. Zeitraum auswählen und Bericht laden.');
  }
  function clearResults() {
    state.headers = []; state.rows = []; state.selection = null;
    $('summary').replaceChildren(); $('results').replaceChildren();
    $('export').disabled = true; $('print').disabled = true;
    text('note','');
    text('report-state','Filter geändert. Bericht bitte erneut laden.');
    showError('');
  }
  async function loadReport(event) {
    event.preventDefault();
    if (state.busy) return;
    state.busy = true;
    clearResults();
    $('load').disabled = true;
    const kind = $('kind').value, site = $('site').value;
    const fromValue = $('from').value, throughValue = $('through').value;
    for (const id of ['kind','from','through','site']) $(id).disabled = true;
    try {
      const p = core.period(fromValue,throughValue);
      // End-exclusive bounds remain correct across DST transitions.
      text('report-state','Lade sämtliche Seiten für ' + p.days + ' Tage …');
      let lines;
      if (kind === 'watchbook') {
        const list = await all('guard_watchbook_entries',{
          select:'id,site_id,employee_id,category,severity,body,occurred_at',
          and:'(occurred_at.gte.' + p.from + ',occurred_at.lt.' + p.until + ')',
          order:'occurred_at.asc,id.asc'
        });
        lines = list.filter(x => !site || x.site_id === site).map(x => [
          dateLabel(x.occurred_at),siteName(x.site_id),employeeName(x.employee_id),
          labels[x.category] || x.category || '—',severity[x.severity] || x.severity || '—',
          x.body || '',x.id
        ]);
      } else if (kind === 'patrol') {
        const runs = await all('guard_patrol_runs',{
          select:'id,route_id,employee_id,started_at,completed_at,status',
          and:'(started_at.gte.' + p.from + ',started_at.lt.' + p.until + ')',
          order:'started_at.asc,id.asc'
        });
        const ids = runs.map(x => x.id);
        const scans = [];
        for (let index = 0; index < ids.length; index += 30) {
          const subset = ids.slice(index,index+30);
          scans.push(...await all('guard_patrol_scans',{
            select:'id,patrol_run_id,checkpoint_id,scanned_at,site_match',
            patrol_run_id:'in.(' + subset.join(',') + ')',
            order:'scanned_at.asc,id.asc'
          }));
        }
        const byRun = new Map();
        for (const scan of scans) {
          if (!byRun.has(scan.patrol_run_id)) byRun.set(scan.patrol_run_id,[]);
          byRun.get(scan.patrol_run_id).push(scan);
        }
        const time = Date.now();
        lines = runs.map(r => {
          const route = state.routes.find(x => x.id === r.route_id);
          const data = core.patrolState(r,route,state.checkpoints,byRun.get(r.id) || [],time);
          return {siteId:route?.site_id || '',row:[
            dateLabel(r.started_at),dateLabel(r.completed_at),siteName(route?.site_id),
            route?.name || 'Unbekannte Route',employeeName(r.employee_id),
            String(data.done) + '/' + String(data.total),data.label,r.status || '—',r.id
          ]};
        }).filter(x => !site || x.siteId === site).map(x => x.row);
      } else throw new Error('Unbekannte Berichtsart.');
      state.headers = options[kind];
      state.rows = lines;
      state.selection = {kind,from:fromValue,through:throughValue,site};
      showResults();
    } catch (error) {
      clearResults();
      showError(error.message || 'Bericht konnte nicht geladen werden.');
      text('report-state','Kein Bericht geladen.');
    } finally {
      $('load').disabled = false; state.busy = false;
      for (const id of ['kind','from','through','site']) $(id).disabled = false;
    }
  }
  function showResults() {
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const tr = document.createElement('tr');
    for (const h of state.headers) {
      const th = document.createElement('th');
      th.textContent = h; tr.appendChild(th);
    }
    head.appendChild(tr); table.appendChild(head);
    const body = document.createElement('tbody');
    for (const values of state.rows) {
      const line = document.createElement('tr');
      for (let i=0; i<values.length; i++) {
        const td = document.createElement('td');
        td.textContent = String(values[i] == null ? '' : values[i]);
        if (state.selection.kind === 'watchbook' && i === 5) td.className = 'notes';
        line.appendChild(td);
      }
      body.appendChild(line);
    }
    table.appendChild(body);
    $('results').replaceChildren(table);
    const count = document.createElement('span');
    count.textContent = state.rows.length + ' Datensätze · ' + state.selection.from + ' bis ' + state.selection.through;
    $('summary').replaceChildren(count);
    const size = state.rows.length;
    text('report-state',size + ' Einträge vollständig geladen (mandantenbezogen, bis 20.000 je Datenabfrage).');
    text('note',state.selection.kind === 'patrol'
      ? 'Hinweis: Der Soll-/Ist-Vergleich nutzt die aktuell aktiven Kontrollpunkte einer Route. Änderungen an Routen nach dem Rundgang können historische Ergebnisse beeinflussen. Das ist noch kein revisionssicherer, eingefrorener Rundgangnachweis.'
      : 'Einträge werden im ausgewählten Zeitraum chronologisch dargestellt. Die Zeitraumgrenzen folgen der lokalen Browser-Zeitzone.');
    $('export').disabled = !size; $('print').disabled = !size;
  }
  async function exportCsv() {
    if (state.busy || !state.selection || !state.rows.length) return;
    state.busy = true; $('export').disabled = true; showError('');
    try {
      const choice = state.selection;
      const name = 'aone-' + (choice.kind === 'watchbook' ? 'wachbuch' : 'wks') +
        '-' + choice.from + '-bis-' + choice.through + '.csv';
      // Fail closed: operational exports require a server-side audit entry.
      await AONE.rpc('guard_log_export',{
        p_org:state.ctx.org_id,p_entity_type:'report',p_entity_id:null,
        p_format:'csv',p_note:name + (choice.site ? ' / Objekt ' + choice.site : '')
      });
      const payload = core.csv(state.headers,state.rows);
      const url = URL.createObjectURL(new Blob([payload],{type:'text/csv;charset=utf-8'}));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = name;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url),1000);
    } catch (error) {
      showError('Export nicht durchgeführt: ' + (error.message || String(error)));
    } finally {
      state.busy = false; $('export').disabled = !state.rows.length;
    }
  }
  initialize().catch(error => {
    showError('Berichtszentrum konnte nicht gestartet werden: ' + (error.message || String(error)));
    text('report-state','Laden fehlgeschlagen.');
  });
})();
