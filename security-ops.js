(()=>{
  const S={session:null,ctx:null,sites:[],employees:[],watchbook:[],incidents:[],routes:[],checkpoints:[],runs:[],scans:[],tab:'overview',routeId:null};
  const $=s=>document.querySelector(s);
  const esc=AONE.esc;
  const nowLocal=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)};
  const siteName=id=>S.sites.find(x=>x.id===id)?.name||'—';
  const employeeName=id=>S.employees.find(x=>x.id===id)?.display_name||'—';
  const routeName=id=>S.routes.find(x=>x.id===id)?.name||'—';
  const severityLabel=v=>({info:'Info',low:'Niedrig',medium:'Mittel',high:'Hoch',critical:'Kritisch'})[v]||v;
  const severityClass=v=>v==='critical'?'red':v==='high'?'yellow':v==='low'?'blue':'green';
  const incidentLabel=v=>({general:'Allgemein',weapon:'Waffe',accident:'Unfall',alarm:'Alarm',aggression:'Aggression',police:'Polizei',fire:'Brand',damage:'Sachschaden',other:'Sonstiges',theft:'Diebstahl',ban:'Hausverbot',assault:'Körperverletzung',medical:'Medizinischer Notfall',technical:'Technische Störung',sos:'SOS'})[v]||v;
  const watchLabel=v=>({routine:'Routine',handover:'Schichtübergabe',incident:'Besonderes Vorkommnis',visitor:'Besucher',delivery:'Lieferung',alarm:'Alarm',technical:'Technikstörung',police_fire:'Polizei / Feuerwehr / Rettungsdienst',key:'Schlüssel',patrol:'Rundgang',note:'Notiz',correction:'Korrektur'})[v]||v;

  async function init(){
    S.session=await AONE.session();
    if(!S.session){location.href='./admin-login.html';return}
    S.ctx=await AONE.chooseContext();
    if(!S.ctx||!AONE.isManager(S.ctx.role)){location.href='./app.html';return}
    $('#org-name').textContent=S.ctx.org?.name||'Security Operations';
    $('#who').textContent=`${S.session.user.email||''} · ${AONE.roleLabel(S.ctx.role)}`;
    $('#logout').onclick=()=>{AONE.signOut();location.href='./admin-login.html'};
    document.querySelectorAll('.ops-tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
    await refresh();
  }

  function setTab(tab){
    S.tab=tab;
    document.querySelectorAll('.ops-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    render();
  }

  async function refresh(){
    AONE.loading(true,'Security Operations laden…');
    try{
      const org=encodeURIComponent(S.ctx.org_id);
      const [sites,employees,watchbook,incidents,routes,checkpoints,runs,scans]=await Promise.all([
        AONE.table('guard_sites',`select=id,name,customer_name,address,active&org_id=eq.${org}&order=name.asc`),
        AONE.table('guard_employees',`select=id,display_name,employee_no,status,qualification_level,user_id&org_id=eq.${org}&order=display_name.asc`),
        AONE.table('guard_watchbook_entries',`select=id,site_id,employee_id,category,severity,body,occurred_at,supersedes_id,created_by,created_at&org_id=eq.${org}&order=occurred_at.desc&limit=200`),
        AONE.table('guard_incident_reports',`select=id,incident_no,employee_id,site_id,shift_id,occurred_at,category,severity,title,description,immediate_actions,persons_involved,witnesses,police_reference,injury_reported,status,reviewed_by,reviewed_at,created_at&org_id=eq.${org}&order=occurred_at.desc&limit=200`),
        AONE.table('guard_patrol_routes',`select=id,site_id,name,expected_duration_min,active,created_at&org_id=eq.${org}&order=name.asc`),
        AONE.table('guard_checkpoints',`select=id,route_id,name,sequence_no,token,preferred_method,active&org_id=eq.${org}&order=sequence_no.asc`),
        AONE.table('guard_patrol_runs',`select=id,route_id,employee_id,shift_id,started_at,completed_at,status,created_at&org_id=eq.${org}&order=started_at.desc&limit=150`),
        AONE.table('guard_patrol_scans',`select=id,patrol_run_id,checkpoint_id,scanned_at,method,site_match,accuracy_m&org_id=eq.${org}&order=scanned_at.desc&limit=1000`)
      ]);
      Object.assign(S,{sites,employees,watchbook,incidents,routes,checkpoints,runs,scans});
      if(!S.routeId&&routes[0])S.routeId=routes[0].id;
      if(S.routeId&&!routes.some(r=>r.id===S.routeId))S.routeId=routes[0]?.id||null;
      render();
    }catch(e){AONE.toast(e.message,'err');$('#ops-view').innerHTML=`<div class="card"><div class="error">${esc(e.message)}</div></div>`}
    finally{AONE.loading(false)}
  }

  function render(){
    if(S.tab==='watchbook')return renderWatchbook();
    if(S.tab==='incidents')return renderIncidents();
    if(S.tab==='wks')return renderWks();
    return renderOverview();
  }

  function renderOverview(){
    const openInc=S.incidents.filter(x=>x.status!=='closed');
    const critical=openInc.filter(x=>x.severity==='critical'||x.severity==='high');
    const activeRuns=S.runs.filter(x=>x.status==='in_progress');
    const today=new Date(); today.setHours(0,0,0,0);
    const todayWatch=S.watchbook.filter(x=>new Date(x.occurred_at)>=today);
    $('#ops-view').innerHTML=`
      <div class="grid cols-4">
        <div class="card metric"><span class="kicker">Heute</span><div class="stat">${todayWatch.length}</div><small>Wachbucheinträge</small></div>
        <div class="card metric"><span class="kicker">Offen</span><div class="stat">${openInc.length}</div><small>Vorfälle in Bearbeitung</small></div>
        <div class="card metric"><span class="kicker">Priorität</span><div class="stat">${critical.length}</div><small>hohe / kritische Vorfälle</small></div>
        <div class="card metric"><span class="kicker">Live</span><div class="stat">${activeRuns.length}</div><small>laufende Rundgänge</small></div>
      </div>
      <div class="grid cols-2" style="margin-top:14px">
        <section class="card"><div class="row between wrap"><div><span class="kicker">Schnellzugriff</span><h2>Operative Aktionen</h2></div></div><div class="quick"><button class="btn" data-go="watchbook">Wachbuch erfassen</button><button class="btn" data-go="incidents">Vorfall bearbeiten</button><button class="btn" data-go="wks">Rundgänge prüfen</button></div></section>
        <section class="card"><span class="kicker">Lagebild</span><h2>Letzte kritische Ereignisse</h2>${critical.slice(0,4).map(incidentMini).join('')||'<div class="empty-mini">Keine hohen oder kritischen offenen Vorfälle.</div>'}</section>
      </div>
      <section class="card" style="margin-top:14px"><div class="row between wrap"><div><span class="kicker">Live WKS</span><h2>Laufende Rundgänge</h2></div><button class="btn small" id="refresh-ops">Aktualisieren</button></div>${activeRuns.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Start</th><th>Route</th><th>Mitarbeiter</th><th>Fortschritt</th></tr></thead><tbody>${activeRuns.map(runRow).join('')}</tbody></table></div>`:'<div class="empty-mini">Aktuell kein laufender Rundgang.</div>'}</section>`;
    document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>setTab(b.dataset.go));
    $('#refresh-ops').onclick=refresh;
  }

  function incidentMini(x){return `<div class="ops-item ${x.severity}"><div class="row between wrap"><b>${esc(x.incident_no||'Vorfall')} · ${esc(x.title)}</b><span class="pill ${severityClass(x.severity)}">${severityLabel(x.severity)}</span></div><div class="muted" style="margin-top:5px">${AONE.dt(x.occurred_at)} · ${esc(siteName(x.site_id))}</div></div>`}

  function runProgress(run){
    const cps=S.checkpoints.filter(c=>c.route_id===run.route_id&&c.active);
    const scanned=new Set(S.scans.filter(s=>s.patrol_run_id===run.id).map(s=>s.checkpoint_id));
    return {done:cps.filter(c=>scanned.has(c.id)).length,total:cps.length};
  }
  function runRow(r){const p=runProgress(r);const pct=p.total?Math.round(p.done/p.total*100):0;return `<tr><td>${AONE.dt(r.started_at)}</td><td>${esc(routeName(r.route_id))}</td><td>${esc(employeeName(r.employee_id))}</td><td><b>${p.done}/${p.total}</b><div class="progressline" style="margin-top:6px"><i style="width:${pct}%"></i></div></td></tr>`}

  function renderWatchbook(){
    $('#ops-view').innerHTML=`
      <div class="page-head"><div><h1>Digitales Wachbuch</h1><p>Chronologische, nachvollziehbare Dokumentation je Objekt.</p></div><button class="btn" id="refresh-wb">Aktualisieren</button></div>
      <div class="grid cols-2">
        <section class="card"><span class="kicker">Neuer Eintrag</span><h2>Wachbuch erfassen</h2>
          <form id="watch-form" class="form-grid">
            <div class="field"><label>Objekt</label><select class="select" name="site_id" required>${siteOptions()}</select></div>
            <div class="field"><label>Zeitpunkt</label><input class="input" type="datetime-local" name="occurred_at" value="${nowLocal()}" required></div>
            <div class="field"><label>Kategorie</label><select class="select" name="category">${watchOptions()}</select></div>
            <div class="field"><label>Priorität</label><select class="select" name="severity"><option value="info">Info</option><option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option><option value="critical">Kritisch</option></select></div>
            <div class="field wide"><label>Eintrag</label><textarea class="textarea" name="body" minlength="2" maxlength="5000" placeholder="Was ist passiert? Welche Maßnahme wurde getroffen?" required></textarea></div>
            <div class="wide"><button class="btn primary block" type="submit">Eintrag speichern</button></div>
          </form>
        </section>
        <section class="card"><span class="kicker">Filter</span><h2>Wachbuch durchsuchen</h2><div class="form-grid"><div class="field"><label>Objekt</label><select class="select" id="wb-site"><option value="">Alle Objekte</option>${siteOptions(false)}</select></div><div class="field"><label>Kategorie</label><select class="select" id="wb-category"><option value="">Alle Kategorien</option>${watchOptions(false)}</select></div></div><p class="muted">Schichtübergaben, Alarmereignisse, Schlüssel, Technik und besondere Vorkommnisse werden im selben Zeitstrahl geführt.</p></section>
      </div>
      <section class="card" style="margin-top:14px"><div class="row between wrap"><div><span class="kicker">Chronologie</span><h2>Letzte Einträge</h2></div><span class="pill">${S.watchbook.length} geladen</span></div><div class="ops-list" id="wb-list"></div></section>`;
    $('#watch-form').onsubmit=saveWatchbook;
    $('#refresh-wb').onclick=refresh;
    $('#wb-site').onchange=drawWatchbookList;$('#wb-category').onchange=drawWatchbookList;
    drawWatchbookList();
  }

  function drawWatchbookList(){
    const site=$('#wb-site')?.value||'',cat=$('#wb-category')?.value||'';
    const rows=S.watchbook.filter(x=>(!site||x.site_id===site)&&(!cat||x.category===cat));
    $('#wb-list').innerHTML=rows.map(x=>`<article class="ops-item ${x.severity==='critical'?'critical':x.severity==='high'?'high':''}"><div class="row between wrap"><div><b>${esc(watchLabel(x.category))}</b> <span class="pill ${severityClass(x.severity)}">${severityLabel(x.severity)}</span></div><span class="muted">${AONE.dt(x.occurred_at)}</span></div><div class="muted" style="margin:5px 0">${esc(siteName(x.site_id))}${x.employee_id?' · '+esc(employeeName(x.employee_id)):''}</div><div style="white-space:pre-wrap">${esc(x.body)}</div></article>`).join('')||'<div class="empty-mini">Keine passenden Einträge.</div>';
  }

  async function saveWatchbook(ev){
    ev.preventDefault();const f=new FormData(ev.currentTarget);
    try{AONE.loading(true,'Wachbuch speichern…');await AONE.insert('guard_watchbook_entries',{org_id:S.ctx.org_id,site_id:f.get('site_id'),employee_id:null,category:f.get('category'),severity:f.get('severity'),body:String(f.get('body')||'').trim(),occurred_at:new Date(f.get('occurred_at')).toISOString(),created_by:S.session.user.id});AONE.toast('Wachbucheintrag gespeichert.');await refresh();setTab('watchbook')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }

  function renderIncidents(){
    const activeEmployees=S.employees.filter(e=>e.status==='active');
    $('#ops-view').innerHTML=`
      <div class="page-head"><div><h1>Incident Management</h1><p>Vorfälle strukturiert erfassen, priorisieren, prüfen und schließen.</p></div><button class="btn" id="refresh-inc">Aktualisieren</button></div>
      <section class="card"><span class="kicker">Neuer Vorgang</span><h2>Vorfall erfassen</h2>
        <form id="incident-form" class="form-grid">
          <div class="field"><label>Meldender Mitarbeiter</label><select class="select" name="employee_id" required>${activeEmployees.map(e=>`<option value="${e.id}">${esc(e.display_name)}</option>`).join('')}</select></div>
          <div class="field"><label>Objekt</label><select class="select" name="site_id"><option value="">Kein Objekt</option>${siteOptions(false)}</select></div>
          <div class="field"><label>Zeitpunkt</label><input class="input" type="datetime-local" name="occurred_at" value="${nowLocal()}" required></div>
          <div class="field"><label>Vorfallart</label><select class="select" name="category">${incidentOptions()}</select></div>
          <div class="field"><label>Priorität</label><select class="select" name="severity"><option value="low">Niedrig</option><option value="medium" selected>Mittel</option><option value="high">Hoch</option><option value="critical">Kritisch</option></select></div>
          <div class="field"><label>Titel</label><input class="input" name="title" maxlength="160" placeholder="Kurze Bezeichnung" required></div>
          <div class="field wide"><label>Sachverhalt</label><textarea class="textarea" name="description" placeholder="Nur beobachtete Tatsachen dokumentieren." required></textarea></div>
          <div class="field wide"><label>Sofortmaßnahmen</label><textarea class="textarea" name="immediate_actions" placeholder="Was wurde unmittelbar getan?"></textarea></div>
          <div class="field"><label>Beteiligte</label><textarea class="textarea" name="persons_involved" placeholder="Namen / Beschreibung, soweit erforderlich"></textarea></div>
          <div class="field"><label>Zeugen</label><textarea class="textarea" name="witnesses" placeholder="Zeugenangaben"></textarea></div>
          <div class="field"><label>Polizei / Vorgangsnummer</label><input class="input" name="police_reference"></div>
          <div class="field"><label style="margin-top:28px"><input type="checkbox" name="injury_reported"> Verletzung gemeldet</label></div>
          <div class="wide"><button class="btn primary block" type="submit" ${activeEmployees.length?'':'disabled'}>Vorfall speichern</button></div>
        </form>
      </section>
      <section class="card" style="margin-top:14px"><div class="row between wrap"><div><span class="kicker">Vorgänge</span><h2>Incident-Liste</h2></div><div class="row wrap"><select class="select" id="inc-status" style="width:auto"><option value="">Alle Status</option><option value="submitted">Neu</option><option value="reviewed">Geprüft</option><option value="closed">Geschlossen</option></select><select class="select" id="inc-sev" style="width:auto"><option value="">Alle Prioritäten</option><option value="critical">Kritisch</option><option value="high">Hoch</option><option value="medium">Mittel</option><option value="low">Niedrig</option></select></div></div><div class="ops-list" id="inc-list"></div></section>`;
    $('#incident-form').onsubmit=saveIncident;$('#refresh-inc').onclick=refresh;$('#inc-status').onchange=drawIncidents;$('#inc-sev').onchange=drawIncidents;drawIncidents();
  }

  function drawIncidents(){
    const st=$('#inc-status')?.value||'',sv=$('#inc-sev')?.value||'';
    const rows=S.incidents.filter(x=>(!st||x.status===st)&&(!sv||x.severity===sv));
    $('#inc-list').innerHTML=rows.map(x=>`<article class="ops-item ${x.severity==='critical'?'critical':x.severity==='high'?'high':''}"><div class="row between wrap"><div><b>${esc(x.incident_no||'Vorfall')} · ${esc(x.title)}</b></div><div class="row wrap"><span class="pill ${severityClass(x.severity)}">${severityLabel(x.severity)}</span><span class="pill">${x.status==='submitted'?'Neu':x.status==='reviewed'?'Geprüft':'Geschlossen'}</span></div></div><div class="muted" style="margin:6px 0">${AONE.dt(x.occurred_at)} · ${esc(incidentLabel(x.category))} · ${esc(siteName(x.site_id))} · ${esc(employeeName(x.employee_id))}</div><div style="white-space:pre-wrap">${esc(x.description)}</div>${x.immediate_actions?`<div class="notice" style="margin-top:9px"><b>Maßnahmen:</b> ${esc(x.immediate_actions)}</div>`:''}${x.witnesses?`<div class="muted" style="margin-top:8px"><b>Zeugen:</b> ${esc(x.witnesses)}</div>`:''}<div class="row wrap" style="margin-top:10px">${x.status==='submitted'?`<button class="btn small" data-review="${x.id}">Als geprüft markieren</button>`:''}${x.status!=='closed'?`<button class="btn small" data-close="${x.id}">Vorgang schließen</button>`:''}</div></article>`).join('')||'<div class="empty-mini">Keine passenden Vorfälle.</div>';
    document.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>reviewIncident(b.dataset.review,'reviewed'));
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>reviewIncident(b.dataset.close,'closed'));
  }

  async function saveIncident(ev){
    ev.preventDefault();const f=new FormData(ev.currentTarget);
    const site=f.get('site_id')||null;
    try{AONE.loading(true,'Vorfall speichern…');const rows=await AONE.insert('guard_incident_reports',{org_id:S.ctx.org_id,employee_id:f.get('employee_id'),site_id:site,shift_id:null,occurred_at:new Date(f.get('occurred_at')).toISOString(),category:f.get('category'),severity:f.get('severity'),title:String(f.get('title')||'').trim(),description:String(f.get('description')||'').trim(),immediate_actions:String(f.get('immediate_actions')||'').trim()||null,persons_involved:String(f.get('persons_involved')||'').trim()||null,witnesses:String(f.get('witnesses')||'').trim()||null,police_reference:String(f.get('police_reference')||'').trim()||null,injury_reported:f.get('injury_reported')==='on',weapon_involved:false,status:'submitted'});AONE.toast(`Vorfall ${rows?.[0]?.incident_no||''} gespeichert.`);await refresh();setTab('incidents')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }

  async function reviewIncident(id,status){
    try{AONE.loading(true,status==='closed'?'Vorgang schließen…':'Vorgang prüfen…');await AONE.update('guard_incident_reports',`id=eq.${encodeURIComponent(id)}`,{status,reviewed_by:S.session.user.id,reviewed_at:new Date().toISOString()});AONE.toast(status==='closed'?'Vorgang geschlossen.':'Vorgang geprüft.');await refresh();setTab('incidents')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }

  function renderWks(){
    const route=S.routes.find(r=>r.id===S.routeId)||null;
    const cps=route?S.checkpoints.filter(c=>c.route_id===route.id).sort((a,b)=>a.sequence_no-b.sequence_no):[];
    const activeRuns=S.runs.filter(r=>r.status==='in_progress');
    $('#ops-view').innerHTML=`
      <div class="page-head"><div><h1>Wächterkontrollsystem</h1><p>Routen, Kontrollpunkte und laufende Rundgänge zentral steuern.</p></div><button class="btn" id="refresh-wks">Aktualisieren</button></div>
      <section class="card"><span class="kicker">Neue Route</span><form id="route-form" class="form-grid"><div class="field"><label>Objekt</label><select class="select" name="site_id" required>${siteOptions()}</select></div><div class="field"><label>Routenname</label><input class="input" name="name" placeholder="z. B. Nachtrundgang EG" required></div><div class="field"><label>Soll-Dauer in Minuten</label><input class="input" type="number" min="1" max="720" name="duration" value="30"></div><div class="field" style="align-self:end"><button class="btn primary block" type="submit">Route anlegen</button></div></form></section>
      <div class="route-layout" style="margin-top:14px"><section class="card"><span class="kicker">Routen</span><h2>${S.routes.length} Kontrollrouten</h2><div class="ops-list">${S.routes.map(r=>`<div class="ops-item route-card ${r.id===S.routeId?'active':''}" data-route="${r.id}"><div class="row between"><b>${esc(r.name)}</b><span class="pill ${r.active?'green':''}">${r.active?'Aktiv':'Inaktiv'}</span></div><div class="muted">${esc(siteName(r.site_id))} · ${S.checkpoints.filter(c=>c.route_id===r.id&&c.active).length} Punkte</div></div>`).join('')||'<div class="empty-mini">Noch keine Route.</div>'}</div></section>
      <section class="card"><span class="kicker">Route bearbeiten</span>${route?`<div class="row between wrap"><div><h2>${esc(route.name)}</h2><div class="muted">${esc(siteName(route.site_id))} · Soll ${route.expected_duration_min||'—'} Min.</div></div><button class="btn small" id="toggle-route">${route.active?'Route deaktivieren':'Route aktivieren'}</button></div><div class="divider"></div><form id="checkpoint-form" class="form-grid"><div class="field"><label>Kontrollpunkt</label><input class="input" name="name" placeholder="z. B. Hintereingang" required></div><div class="field"><label>Methode</label><select class="select" name="method"><option value="either">QR oder NFC</option><option value="qr">QR</option><option value="nfc">NFC</option></select></div><div class="wide"><button class="btn block" type="submit">Kontrollpunkt hinzufügen</button></div></form><div class="ops-list" style="margin-top:12px">${cps.map(cp=>checkpointCard(cp)).join('')||'<div class="empty-mini">Noch keine Kontrollpunkte.</div>'}</div>`:'<div class="empty-mini">Route auswählen oder neu anlegen.</div>'}</section></div>
      <section class="card" style="margin-top:14px"><div class="row between wrap"><div><span class="kicker">Live</span><h2>Laufende Rundgänge</h2></div><span class="pill">${activeRuns.length} aktiv</span></div>${activeRuns.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Start</th><th>Route / Objekt</th><th>Mitarbeiter</th><th>Kontrollpunkte</th></tr></thead><tbody>${activeRuns.map(runRow).join('')}</tbody></table></div>`:'<div class="empty-mini">Kein laufender Rundgang.</div>'}</section>`;
    $('#refresh-wks').onclick=refresh;$('#route-form').onsubmit=saveRoute;
    document.querySelectorAll('[data-route]').forEach(el=>el.onclick=()=>{S.routeId=el.dataset.route;renderWks()});
    if(route){$('#checkpoint-form').onsubmit=saveCheckpoint;$('#toggle-route').onclick=()=>toggleRoute(route)}
    document.querySelectorAll('[data-copy-token]').forEach(b=>b.onclick=()=>copyCheckpoint(b.dataset.copyToken));
  }

  function checkpointCard(cp){
    const url=`https://a-one-guard.vercel.app/einsatz.html?checkpoint=${encodeURIComponent(cp.token)}`;
    return `<div class="ops-item"><div class="row between wrap"><div><b>${cp.sequence_no}. ${esc(cp.name)}</b><div class="muted">${cp.preferred_method==='either'?'QR / NFC':cp.preferred_method.toUpperCase()}</div></div><span class="pill ${cp.active?'green':''}">${cp.active?'Aktiv':'Inaktiv'}</span></div><div class="linkbox" style="margin-top:9px">${esc(url)}</div><button class="btn small" style="margin-top:8px" data-copy-token="${esc(cp.token)}">Scan-Link kopieren</button></div>`
  }
  async function copyCheckpoint(token){const url=`https://a-one-guard.vercel.app/einsatz.html?checkpoint=${encodeURIComponent(token)}`;try{await navigator.clipboard.writeText(url);AONE.toast('Kontrollpunkt-Link kopiert.')}catch{prompt('Link kopieren:',url)}}

  async function saveRoute(ev){ev.preventDefault();const f=new FormData(ev.currentTarget);try{AONE.loading(true,'Route anlegen…');const rows=await AONE.insert('guard_patrol_routes',{org_id:S.ctx.org_id,site_id:f.get('site_id'),name:String(f.get('name')||'').trim(),expected_duration_min:Number(f.get('duration'))||null,active:true});S.routeId=rows?.[0]?.id||S.routeId;AONE.toast('Route angelegt.');await refresh();setTab('wks')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}}
  async function saveCheckpoint(ev){ev.preventDefault();const f=new FormData(ev.currentTarget);const cps=S.checkpoints.filter(c=>c.route_id===S.routeId);const seq=Math.max(0,...cps.map(c=>Number(c.sequence_no)||0))+1;try{AONE.loading(true,'Kontrollpunkt anlegen…');await AONE.insert('guard_checkpoints',{org_id:S.ctx.org_id,route_id:S.routeId,name:String(f.get('name')||'').trim(),sequence_no:seq,preferred_method:f.get('method'),active:true});AONE.toast('Kontrollpunkt angelegt.');await refresh();setTab('wks')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}}
  async function toggleRoute(route){try{await AONE.update('guard_patrol_routes',`id=eq.${encodeURIComponent(route.id)}`,{active:!route.active});AONE.toast(!route.active?'Route aktiviert.':'Route deaktiviert.');await refresh();setTab('wks')}catch(e){AONE.toast(e.message,'err')}}

  function siteOptions(required=true){const rows=S.sites.filter(s=>s.active!==false);return `${required&&rows.length===0?'<option value="">Kein aktives Objekt</option>':''}${rows.map(s=>`<option value="${s.id}">${esc(s.name)}${s.customer_name?' · '+esc(s.customer_name):''}</option>`).join('')}`}
  function watchOptions(){return [['routine','Routine'],['handover','Schichtübergabe'],['incident','Besonderes Vorkommnis'],['visitor','Besucher'],['delivery','Lieferung'],['alarm','Alarm'],['technical','Technikstörung'],['police_fire','Polizei / Feuerwehr / Rettungsdienst'],['key','Schlüsselübergabe'],['patrol','Rundgang'],['note','Notiz']].map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
  function incidentOptions(){return [['general','Allgemein'],['theft','Diebstahl'],['ban','Hausverbot'],['assault','Körperverletzung'],['damage','Sachbeschädigung'],['fire','Brand'],['medical','Medizinischer Notfall'],['police','Polizei'],['alarm','Alarm'],['technical','Technische Störung'],['accident','Unfall'],['aggression','Aggression'],['weapon','Waffenbezug'],['other','Sonstiges']].map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}

  init().catch(e=>{console.error(e);AONE.toast(e.message,'err')});
})();