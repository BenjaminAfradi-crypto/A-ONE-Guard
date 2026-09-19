(()=>{
  const S={session:null,ctx:null,employee:null,sites:[],shifts:[],watchbook:[],incidents:[],routes:[],checkpoints:[],runs:[],scans:[],tab:'today',activeRunId:null,pendingCheckpoint:new URLSearchParams(location.search).get('checkpoint')||''};
  const $=s=>document.querySelector(s);const esc=AONE.esc;
  const nowLocal=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)};
  const siteName=id=>S.sites.find(x=>x.id===id)?.name||'—';
  const routeName=id=>S.routes.find(x=>x.id===id)?.name||'—';
  const currentShift=()=>{const n=Date.now();return S.shifts.find(x=>new Date(x.starts_at).getTime()<=n&&new Date(x.ends_at).getTime()>=n&&x.status!=='canceled')||S.shifts.find(x=>x.status!=='canceled')||null};
  const defaultSite=()=>currentShift()?.site_id||S.sites.find(x=>x.active!==false)?.id||'';
  const severityLabel=v=>({info:'Info',low:'Niedrig',medium:'Mittel',high:'Hoch',critical:'Kritisch'})[v]||v;
  const watchLabel=v=>({routine:'Routine',handover:'Schichtübergabe',incident:'Besonderes Vorkommnis',visitor:'Besucher',delivery:'Lieferung',alarm:'Alarm',technical:'Technikstörung',police_fire:'Polizei / Feuerwehr / Rettungsdienst',key:'Schlüssel',patrol:'Rundgang',note:'Notiz'})[v]||v;
  const incidentLabel=v=>({general:'Allgemein',theft:'Diebstahl',ban:'Hausverbot',assault:'Körperverletzung',damage:'Sachbeschädigung',fire:'Brand',medical:'Medizinischer Notfall',police:'Polizei',alarm:'Alarm',technical:'Technische Störung',accident:'Unfall',aggression:'Aggression',weapon:'Waffenbezug',other:'Sonstiges',sos:'SOS'})[v]||v;

  async function init(){
    S.session=await AONE.session();if(!S.session){location.href='./login.html';return}
    S.ctx=await AONE.chooseContext();if(!S.ctx){location.href='./login.html';return}
    $('#org-name').textContent=S.ctx.org?.name||'Einsatz';$('#logout').onclick=()=>{AONE.signOut();location.href='./login.html'};
    document.querySelectorAll('.employee-tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
    await refresh();
    if(S.pendingCheckpoint) await handlePendingCheckpoint();
  }
  function setTab(tab){S.tab=tab;document.querySelectorAll('.employee-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));render()}

  async function refresh(){
    AONE.loading(true,'Einsatzdaten laden…');
    try{
      const org=encodeURIComponent(S.ctx.org_id),uid=encodeURIComponent(S.session.user.id);
      const emps=await AONE.table('guard_employees',`select=id,display_name,employee_no,status,qualification_level,user_id&org_id=eq.${org}&user_id=eq.${uid}&limit=1`);
      S.employee=emps[0]||null;
      if(!S.employee)throw new Error('Deinem Benutzer ist kein Mitarbeiterprofil zugeordnet.');
      const start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-1);
      const end=new Date();end.setHours(23,59,59,999);end.setDate(end.getDate()+2);
      const [sites,shifts,watchbook,incidents,routes,checkpoints,runs,scans]=await Promise.all([
        AONE.table('guard_sites',`select=id,name,customer_name,address,active,location_policy&org_id=eq.${org}&order=name.asc`),
        AONE.table('guard_shifts',`select=id,site_id,title,starts_at,ends_at,status,notes&org_id=eq.${org}&employee_id=eq.${encodeURIComponent(S.employee.id)}&starts_at=lt.${encodeURIComponent(end.toISOString())}&ends_at=gt.${encodeURIComponent(start.toISOString())}&order=starts_at.asc`),
        AONE.table('guard_watchbook_entries',`select=id,site_id,employee_id,category,severity,body,occurred_at,created_at&org_id=eq.${org}&order=occurred_at.desc&limit=80`),
        AONE.table('guard_incident_reports',`select=id,incident_no,site_id,shift_id,occurred_at,category,severity,title,description,immediate_actions,status,created_at&org_id=eq.${org}&employee_id=eq.${encodeURIComponent(S.employee.id)}&order=occurred_at.desc&limit=80`),
        AONE.table('guard_patrol_routes',`select=id,site_id,name,expected_duration_min,active&org_id=eq.${org}&active=eq.true&order=name.asc`),
        AONE.table('guard_checkpoints',`select=id,route_id,name,sequence_no,token,preferred_method,active&org_id=eq.${org}&active=eq.true&order=sequence_no.asc`),
        AONE.table('guard_patrol_runs',`select=id,route_id,employee_id,shift_id,started_at,completed_at,status&org_id=eq.${org}&employee_id=eq.${encodeURIComponent(S.employee.id)}&order=started_at.desc&limit=60`),
        AONE.table('guard_patrol_scans',`select=id,patrol_run_id,checkpoint_id,scanned_at,method,site_match,accuracy_m&org_id=eq.${org}&order=scanned_at.desc&limit=500`)
      ]);
      Object.assign(S,{sites,shifts,watchbook,incidents,routes,checkpoints,runs,scans});
      const inProgress=runs.find(r=>r.status==='in_progress');S.activeRunId=inProgress?.id||null;
      render();
    }catch(e){AONE.toast(e.message,'err');$('#employee-view').innerHTML=`<div class="employee-card"><div class="error">${esc(e.message)}</div></div>`}
    finally{AONE.loading(false)}
  }

  function render(){if(S.tab==='watchbook')return renderWatchbook();if(S.tab==='wks')return renderWks();if(S.tab==='incident')return renderIncident();return renderToday()}

  function renderToday(){
    const sh=currentShift();const run=S.runs.find(r=>r.id===S.activeRunId);
    $('#employee-view').innerHTML=`
      <section class="employee-card"><span class="kicker">Heute</span><h2>${esc(S.employee.display_name||'Mitarbeiter')}</h2>${sh?`<div class="today-shift">${AONE.t(sh.starts_at)}–${AONE.t(sh.ends_at)}</div><div class="muted">${esc(siteName(sh.site_id))}${sh.title?' · '+esc(sh.title):''}</div>`:'<div class="notice">Aktuell wurde keine passende Schicht gefunden.</div>'}</section>
      ${run?`<section class="employee-card"><span class="kicker">Aktiver Rundgang</span><h2>${esc(routeName(run.route_id))}</h2>${progressForRun(run)}<button class="big-action primary" data-go="wks" style="margin-top:12px">Rundgang fortsetzen</button></section>`:''}
      <div class="quickgrid"><button class="big-action primary" data-go="watchbook">Wachbuch</button><button class="big-action primary" data-go="incident">Vorfall melden</button></div>
      <section class="employee-card" style="margin-top:12px"><span class="kicker">Notfall</span><h2>SOS</h2><p class="muted">Erstellt sofort einen kritischen SOS-Vorgang mit deinem aktuellen Einsatzbezug. Bei akuter Gefahr zusätzlich 112 bzw. 110 verständigen.</p><button class="big-action sos" id="sos">SOS AUSLÖSEN</button></section>`;
    document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>setTab(b.dataset.go));$('#sos').onclick=sendSos;
  }

  function siteOptions(selected=''){return S.sites.filter(x=>x.active!==false).map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${esc(s.name)}${s.customer_name?' · '+esc(s.customer_name):''}</option>`).join('')}
  function watchOptions(){return [['routine','Routine'],['handover','Schichtübergabe'],['incident','Besonderes Vorkommnis'],['visitor','Besucher'],['delivery','Lieferung'],['alarm','Alarm'],['technical','Technikstörung'],['police_fire','Polizei / Feuerwehr / Rettungsdienst'],['key','Schlüsselübergabe'],['patrol','Rundgang'],['note','Notiz']].map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
  function incidentOptions(){return [['general','Allgemein'],['theft','Diebstahl'],['ban','Hausverbot'],['assault','Körperverletzung'],['damage','Sachbeschädigung'],['fire','Brand'],['medical','Medizinischer Notfall'],['police','Polizei'],['alarm','Alarm'],['technical','Technische Störung'],['accident','Unfall'],['aggression','Aggression'],['weapon','Waffenbezug'],['other','Sonstiges']].map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}

  function renderWatchbook(){
    const ds=defaultSite();
    $('#employee-view').innerHTML=`<section class="employee-card"><span class="kicker">Digitales Wachbuch</span><h2>Eintrag erfassen</h2><form id="wb-form"><div class="field"><label>Objekt</label><select class="select" name="site_id" required>${siteOptions(ds)}</select></div><div class="field"><label>Kategorie</label><select class="select" name="category">${watchOptions()}</select></div><div class="field"><label>Priorität</label><select class="select" name="severity"><option value="info">Info</option><option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option><option value="critical">Kritisch</option></select></div><div class="field"><label>Zeitpunkt</label><input class="input" type="datetime-local" name="occurred_at" value="${nowLocal()}" required></div><div class="field"><label>Eintrag</label><textarea class="textarea" name="body" minlength="2" maxlength="5000" placeholder="Kurz und sachlich dokumentieren." required></textarea></div><button class="big-action primary" type="submit">Wachbuch speichern</button></form></section><section class="employee-card"><span class="kicker">Letzte Einträge</span><h2>Meine Dokumentation</h2>${S.watchbook.filter(x=>x.employee_id===S.employee.id).slice(0,20).map(x=>`<div class="history-item"><div class="statusline"><b>${esc(watchLabel(x.category))}</b><span class="pill">${severityLabel(x.severity)}</span></div><div class="muted">${AONE.dt(x.occurred_at)} · ${esc(siteName(x.site_id))}</div><div style="margin-top:4px;white-space:pre-wrap">${esc(x.body)}</div></div>`).join('')||'<div class="empty-mini">Noch keine eigenen Einträge.</div>'}</section>`;
    $('#wb-form').onsubmit=saveWatchbook;
  }
  async function saveWatchbook(ev){ev.preventDefault();const f=new FormData(ev.currentTarget);try{AONE.loading(true,'Wachbuch speichern…');await AONE.insert('guard_watchbook_entries',{org_id:S.ctx.org_id,site_id:f.get('site_id'),employee_id:S.employee.id,category:f.get('category'),severity:f.get('severity'),body:String(f.get('body')||'').trim(),occurred_at:new Date(f.get('occurred_at')).toISOString(),created_by:S.session.user.id});AONE.toast('Wachbuch gespeichert.');await refresh();setTab('watchbook')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}}

  function renderIncident(){
    const ds=defaultSite();
    $('#employee-view').innerHTML=`<section class="employee-card"><span class="kicker">Incident Management</span><h2>Vorfall melden</h2><form id="inc-form"><div class="field"><label>Objekt</label><select class="select" name="site_id"><option value="">Kein Objekt</option>${siteOptions(ds)}</select></div><div class="field"><label>Vorfallart</label><select class="select" name="category">${incidentOptions()}</select></div><div class="field"><label>Priorität</label><select class="select" name="severity"><option value="low">Niedrig</option><option value="medium" selected>Mittel</option><option value="high">Hoch</option><option value="critical">Kritisch</option></select></div><div class="field"><label>Zeitpunkt</label><input class="input" type="datetime-local" name="occurred_at" value="${nowLocal()}" required></div><div class="field"><label>Titel</label><input class="input" name="title" maxlength="160" required placeholder="Was ist passiert?"></div><div class="field"><label>Sachverhalt</label><textarea class="textarea" name="description" required placeholder="Nur Tatsachen und eigene Beobachtungen."></textarea></div><div class="field"><label>Sofortmaßnahmen</label><textarea class="textarea" name="immediate_actions" placeholder="Welche Maßnahmen wurden getroffen?"></textarea></div><div class="field"><label>Beteiligte</label><textarea class="textarea" name="persons_involved"></textarea></div><div class="field"><label>Zeugen</label><textarea class="textarea" name="witnesses"></textarea></div><div class="field"><label>Polizei / Vorgangsnummer</label><input class="input" name="police_reference"></div><div class="field"><label><input type="checkbox" name="injury_reported"> Verletzung gemeldet</label></div><button class="big-action primary" type="submit">Vorfall absenden</button></form></section><section class="employee-card"><span class="kicker">Meine Meldungen</span><h2>Letzte Vorfälle</h2>${S.incidents.slice(0,15).map(x=>`<div class="history-item"><div class="statusline"><b>${esc(x.incident_no||'Vorfall')}</b><span class="pill">${esc(incidentLabel(x.category))}</span><span class="pill">${esc(x.status)}</span></div><div>${esc(x.title)}</div><div class="muted">${AONE.dt(x.occurred_at)} · ${esc(siteName(x.site_id))}</div></div>`).join('')||'<div class="empty-mini">Noch keine Vorfallmeldungen.</div>'}</section>`;
    $('#inc-form').onsubmit=saveIncident;
  }
  async function saveIncident(ev){ev.preventDefault();const f=new FormData(ev.currentTarget),sh=currentShift();try{AONE.loading(true,'Vorfall senden…');const rows=await AONE.insert('guard_incident_reports',{org_id:S.ctx.org_id,employee_id:S.employee.id,site_id:f.get('site_id')||null,shift_id:sh?.id||null,occurred_at:new Date(f.get('occurred_at')).toISOString(),category:f.get('category'),severity:f.get('severity'),title:String(f.get('title')||'').trim(),description:String(f.get('description')||'').trim(),immediate_actions:String(f.get('immediate_actions')||'').trim()||null,persons_involved:String(f.get('persons_involved')||'').trim()||null,witnesses:String(f.get('witnesses')||'').trim()||null,police_reference:String(f.get('police_reference')||'').trim()||null,injury_reported:f.get('injury_reported')==='on',weapon_involved:false,status:'submitted'});AONE.toast(`Vorfall ${rows?.[0]?.incident_no||''} gemeldet.`);await refresh();setTab('incident')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}}

  function renderWks(){
    const run=S.runs.find(r=>r.id===S.activeRunId&&r.status==='in_progress');
    if(run)return renderActiveRun(run);
    const site=defaultSite();const routes=S.routes.filter(r=>!site||r.site_id===site);
    $('#employee-view').innerHTML=`<section class="employee-card"><span class="kicker">Wächterkontrollsystem</span><h2>Rundgang starten</h2><p class="muted">Wähle eine freigegebene Route. Kontrollpunkte werden über den Scan-Link am Objekt bestätigt.</p>${routes.map(r=>`<div class="route-mobile"><div class="row between"><div><b>${esc(r.name)}</b><div class="muted">${esc(siteName(r.site_id))} · ${S.checkpoints.filter(c=>c.route_id===r.id).length} Punkte · Soll ${r.expected_duration_min||'—'} Min.</div></div></div><button class="btn primary block" style="margin-top:10px" data-start-route="${r.id}">Rundgang starten</button></div>`).join('')||'<div class="notice">Für dein aktuelles Objekt ist keine aktive Route eingerichtet.</div>'}</section><section class="employee-card"><span class="kicker">Historie</span><h2>Letzte Rundgänge</h2>${S.runs.filter(r=>r.status!=='in_progress').slice(0,10).map(r=>`<div class="history-item"><b>${esc(routeName(r.route_id))}</b><div class="muted">${AONE.dt(r.started_at)} · ${r.status==='completed'?'Abgeschlossen':esc(r.status)}</div></div>`).join('')||'<div class="empty-mini">Noch keine abgeschlossenen Rundgänge.</div>'}</section>`;
    document.querySelectorAll('[data-start-route]').forEach(b=>b.onclick=()=>startRoute(b.dataset.startRoute));
  }
  function progressForRun(run){const cps=S.checkpoints.filter(c=>c.route_id===run.route_id),done=new Set(S.scans.filter(s=>s.patrol_run_id===run.id).map(s=>s.checkpoint_id)),n=cps.filter(c=>done.has(c.id)).length,pct=cps.length?Math.round(n/cps.length*100):0;return `<div class="statusline"><span class="pill blue">${n}/${cps.length} Kontrollpunkte</span><span class="pill">${pct}%</span></div><div class="progress" style="margin-top:9px"><i style="width:${pct}%"></i></div>`}
  function renderActiveRun(run){
    const cps=S.checkpoints.filter(c=>c.route_id===run.route_id).sort((a,b)=>a.sequence_no-b.sequence_no),done=new Set(S.scans.filter(s=>s.patrol_run_id===run.id).map(s=>s.checkpoint_id)),complete=cps.length>0&&cps.every(c=>done.has(c.id));
    $('#employee-view').innerHTML=`<section class="employee-card"><span class="kicker">Rundgang läuft</span><h2>${esc(routeName(run.route_id))}</h2><div class="muted">Gestartet ${AONE.dt(run.started_at)}</div><div style="margin-top:12px">${progressForRun(run)}</div>${cps.map(c=>`<div class="checkpoint ${done.has(c.id)?'done':''}"><div class="dot">${done.has(c.id)?'✓':c.sequence_no}</div><div><b>${esc(c.name)}</b><div class="muted">${done.has(c.id)?'Bestätigt':c.preferred_method==='nfc'?'NFC':'QR / Scan-Link'}</div></div></div>`).join('')||'<div class="notice">Diese Route hat noch keine Kontrollpunkte.</div>'}<div class="scanbox"><b>Kontrollpunkt bestätigen</b><p class="muted">Normalerweise öffnet der QR-/NFC-Link diese Seite automatisch. Alternativ Token manuell eintragen.</p><form id="scan-form"><input class="input" name="token" value="${esc(S.pendingCheckpoint)}" placeholder="Kontrollpunkt-Token" autocomplete="off" required><button class="btn primary block" style="margin-top:9px" type="submit">Jetzt bestätigen</button></form></div>${complete?'<button class="big-action primary" id="finish-run" style="margin-top:12px">Rundgang abschließen</button>':'<button class="btn block" id="cancel-run" style="margin-top:12px">Rundgang abbrechen</button>'}</section>`;
    $('#scan-form').onsubmit=e=>{e.preventDefault();scanCheckpoint(new FormData(e.currentTarget).get('token'),'manual')};
    if(complete)$('#finish-run').onclick=finishRun;else $('#cancel-run').onclick=cancelRun;
  }
  async function startRoute(routeId){const route=S.routes.find(r=>r.id===routeId),sh=S.shifts.find(x=>x.site_id===route?.site_id&&x.status!=='canceled')||null;try{AONE.loading(true,'Rundgang starten…');const rows=await AONE.insert('guard_patrol_runs',{org_id:S.ctx.org_id,route_id:routeId,employee_id:S.employee.id,shift_id:sh?.id||null,status:'in_progress'});S.activeRunId=rows?.[0]?.id||null;AONE.toast('Rundgang gestartet.');await refresh();setTab('wks')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}}
  async function scanCheckpoint(token,method='qr'){
    const run=S.runs.find(r=>r.id===S.activeRunId&&r.status==='in_progress');if(!run){AONE.toast('Kein aktiver Rundgang.','err');return}
    let geo={lat:null,lng:null,accuracy:null};
    try{geo=await AONE.geolocate()}catch(e){/* Backend entscheidet anhand der Objektregel, ob Standort erforderlich ist. */}
    try{AONE.loading(true,'Kontrollpunkt prüfen…');const result=await AONE.rpc('guard_scan_checkpoint',{p_run:run.id,p_token:String(token||'').trim(),p_method:method,p_lat:geo.lat,p_lng:geo.lng,p_accuracy_m:geo.accuracy});S.pendingCheckpoint='';history.replaceState(null,'','./einsatz.html');AONE.toast(`${result?.checkpoint_name||'Kontrollpunkt'} bestätigt.`);await refresh();setTab('wks')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }
  async function finishRun(){const run=S.runs.find(r=>r.id===S.activeRunId);if(!run)return;try{await AONE.update('guard_patrol_runs',`id=eq.${encodeURIComponent(run.id)}`,{status:'completed',completed_at:new Date().toISOString()});AONE.toast('Rundgang abgeschlossen.');S.activeRunId=null;await refresh();setTab('wks')}catch(e){AONE.toast(e.message,'err')}}
  async function cancelRun(){const run=S.runs.find(r=>r.id===S.activeRunId);if(!run||!confirm('Rundgang wirklich abbrechen?'))return;try{await AONE.update('guard_patrol_runs',`id=eq.${encodeURIComponent(run.id)}`,{status:'canceled',completed_at:new Date().toISOString()});AONE.toast('Rundgang abgebrochen.');S.activeRunId=null;await refresh();setTab('wks')}catch(e){AONE.toast(e.message,'err')}}
  async function handlePendingCheckpoint(){const run=S.runs.find(r=>r.status==='in_progress');if(!run){setTab('wks');AONE.toast('Kontrollpunkt erkannt. Starte zuerst den passenden Rundgang.','warn');return}S.activeRunId=run.id;setTab('wks');await scanCheckpoint(S.pendingCheckpoint,'qr')}

  async function sendSos(){
    if(!confirm('SOS wirklich auslösen? Bei akuter Gefahr zusätzlich 112 oder 110 anrufen.'))return;
    const sh=currentShift(),site=sh?.site_id||defaultSite()||null;
    try{AONE.loading(true,'SOS senden…');await AONE.insert('guard_incident_reports',{org_id:S.ctx.org_id,employee_id:S.employee.id,site_id:site,shift_id:sh?.id||null,occurred_at:new Date().toISOString(),category:'sos',severity:'critical',title:'SOS / Notfallmeldung',description:'SOS wurde über die A ONE Guard Mitarbeiter-App ausgelöst.',immediate_actions:'Sofortige Prüfung und Kontaktaufnahme erforderlich.',injury_reported:false,weapon_involved:false,status:'submitted'});if(site){await AONE.insert('guard_watchbook_entries',{org_id:S.ctx.org_id,site_id:site,employee_id:S.employee.id,category:'alarm',severity:'critical',body:'SOS wurde über die Mitarbeiter-App ausgelöst.',occurred_at:new Date().toISOString(),created_by:S.session.user.id}).catch(()=>{})}AONE.toast('SOS wurde als kritischer Vorfall gemeldet.','warn');await refresh()}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }

  init().catch(e=>{console.error(e);AONE.toast(e.message,'err')});
})();