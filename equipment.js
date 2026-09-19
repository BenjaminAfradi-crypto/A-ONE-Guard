(()=>{
  const S={session:null,ctx:null,tab:'equipment',sites:[],employees:[],equipment:[],assignments:[],keys:[],movements:[],shifts:[]};
  const $=s=>document.querySelector(s),esc=AONE.esc;
  const siteName=id=>S.sites.find(x=>x.id===id)?.name||'—';
  const empName=id=>S.employees.find(x=>x.id===id)?.display_name||'—';
  const catLabel=v=>({radio:'Funkgerät',bodycam:'Bodycam',phone:'Diensthandy',flashlight:'Taschenlampe',tablet:'Tablet',keyring:'Schlüsselbund',ppe:'PSA',other:'Sonstiges'})[v]||v;
  const statusLabel=v=>({available:'Verfügbar',issued:'Ausgegeben',maintenance:'Wartung',lost:'Verloren',retired:'Ausgemustert'})[v]||v;
  const conditionLabel=v=>({new:'Neu',ok:'In Ordnung',used:'Gebraucht',damaged:'Beschädigt'})[v]||v;
  const keyStatusLabel=v=>({available:'Verfügbar',issued:'Ausgegeben',lost:'Verloren',retired:'Ausgemustert'})[v]||v;
  const pill=v=>v==='available'?'green':v==='issued'?'blue':v==='maintenance'?'yellow':v==='lost'?'red':'';

  async function init(){
    S.session=await AONE.session();if(!S.session){location.href='./admin-login.html';return}
    S.ctx=await AONE.chooseContext();if(!S.ctx||!AONE.isManager(S.ctx.role)){location.href='./app.html';return}
    $('#org-name').textContent=S.ctx.org?.name||'Betriebsmittel';$('#who').textContent=`${S.session.user.email||''} · ${AONE.roleLabel(S.ctx.role)}`;
    $('#logout').onclick=()=>{AONE.signOut();location.href='./admin-login.html'};
    document.querySelectorAll('.asset-tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
    await refresh();
  }
  function setTab(tab){S.tab=tab;document.querySelectorAll('.asset-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));render()}
  async function refresh(){
    AONE.loading(true,'Betriebsmittel laden…');
    try{
      const org=encodeURIComponent(S.ctx.org_id);
      const [sites,employees,equipment,assignments,keys,movements,shifts]=await Promise.all([
        AONE.table('guard_sites',`select=id,name,active&org_id=eq.${org}&order=name.asc`),
        AONE.table('guard_employees',`select=id,display_name,status&org_id=eq.${org}&order=display_name.asc`),
        AONE.table('guard_equipment',`select=id,site_id,asset_no,name,category,serial_no,status,condition,notes,created_at,updated_at&org_id=eq.${org}&order=asset_no.asc`),
        AONE.table('guard_equipment_assignments',`select=id,equipment_id,employee_id,shift_id,issued_at,returned_at,issue_condition,return_condition,issue_note,return_note&org_id=eq.${org}&order=issued_at.desc&limit=400`),
        AONE.table('guard_keys',`select=id,site_id,key_no,label,status,current_employee_id,issued_at,notes,created_at,updated_at&org_id=eq.${org}&order=key_no.asc`),
        AONE.table('guard_key_movements',`select=id,key_id,employee_id,shift_id,action,occurred_at,note&org_id=eq.${org}&order=occurred_at.desc&limit=400`),
        AONE.table('guard_shifts',`select=id,site_id,employee_id,starts_at,ends_at,status&org_id=eq.${org}&status=neq.canceled&order=starts_at.desc&limit=250`)
      ]);
      Object.assign(S,{sites,employees,equipment,assignments,keys,movements,shifts});render();
    }catch(e){AONE.toast(e.message,'err');$('#asset-view').innerHTML=`<div class="card error">${esc(e.message)}</div>`}finally{AONE.loading(false)}
  }
  function render(){if(S.tab==='keys')return renderKeys();if(S.tab==='history')return renderHistory();renderEquipment()}
  const siteOptions=(empty=true)=>`${empty?'<option value="">Kein festes Objekt</option>':''}${S.sites.filter(x=>x.active).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}`;
  const employeeOptions=()=>S.employees.filter(x=>x.status==='active').map(x=>`<option value="${x.id}">${esc(x.display_name)}</option>`).join('');
  const openAssignment=eid=>S.assignments.find(x=>x.equipment_id===eid&&!x.returned_at);

  function renderEquipment(){
    const available=S.equipment.filter(x=>x.status==='available').length,issued=S.equipment.filter(x=>x.status==='issued').length,problem=S.equipment.filter(x=>['maintenance','lost'].includes(x.status)).length;
    $('#asset-view').innerHTML=`
      <div class="grid cols-4"><div class="card mini-stat"><span class="kicker">Bestand</span><div class="stat">${S.equipment.length}</div><small class="muted">Betriebsmittel</small></div><div class="card mini-stat"><span class="kicker">Verfügbar</span><div class="stat">${available}</div><small class="muted">sofort einsetzbar</small></div><div class="card mini-stat"><span class="kicker">Ausgegeben</span><div class="stat">${issued}</div><small class="muted">aktuell im Einsatz</small></div><div class="card mini-stat"><span class="kicker">Auffällig</span><div class="stat">${problem}</div><small class="muted">Wartung / verloren</small></div></div>
      <div class="grid cols-2" style="margin-top:14px">
        <section class="card"><span class="kicker">Neu</span><h2>Betriebsmittel anlegen</h2><form id="equipment-form" class="form-grid">
          <div class="field"><label>Inventar-Nr.</label><input class="input" name="asset_no" maxlength="60" required placeholder="z. B. FG-001"></div>
          <div class="field"><label>Bezeichnung</label><input class="input" name="name" maxlength="120" required placeholder="Motorola Funkgerät"></div>
          <div class="field"><label>Kategorie</label><select class="select" name="category"><option value="radio">Funkgerät</option><option value="bodycam">Bodycam</option><option value="phone">Diensthandy</option><option value="flashlight">Taschenlampe</option><option value="tablet">Tablet</option><option value="keyring">Schlüsselbund</option><option value="ppe">PSA</option><option value="other">Sonstiges</option></select></div>
          <div class="field"><label>Zustand</label><select class="select" name="condition"><option value="new">Neu</option><option value="ok" selected>In Ordnung</option><option value="used">Gebraucht</option><option value="damaged">Beschädigt</option></select></div>
          <div class="field"><label>Seriennummer</label><input class="input" name="serial_no" maxlength="120"></div>
          <div class="field"><label>Objekt</label><select class="select" name="site_id">${siteOptions()}</select></div>
          <div class="field wide"><label>Notiz</label><textarea class="textarea" name="notes" maxlength="1000"></textarea></div>
          <div class="wide"><button class="btn primary block" type="submit">Betriebsmittel speichern</button></div>
        </form></section>
        <section class="card"><span class="kicker">Suche</span><h2>Bestand filtern</h2><div class="field"><label>Suche</label><input class="input" id="eq-search" placeholder="Inventar-Nr., Name, Seriennummer"></div><div class="field"><label>Status</label><select class="select" id="eq-status"><option value="">Alle</option><option value="available">Verfügbar</option><option value="issued">Ausgegeben</option><option value="maintenance">Wartung</option><option value="lost">Verloren</option><option value="retired">Ausgemustert</option></select></div><button class="btn" id="eq-refresh">Aktualisieren</button></section>
      </div>
      <section class="card" style="margin-top:14px"><div class="row between wrap"><div><span class="kicker">Inventar</span><h2>Betriebsmittel</h2></div><span class="pill">${S.equipment.length} geladen</span></div><div class="asset-grid" id="equipment-grid"></div></section>`;
    $('#equipment-form').onsubmit=saveEquipment;$('#eq-search').oninput=drawEquipment;$('#eq-status').onchange=drawEquipment;$('#eq-refresh').onclick=refresh;drawEquipment();
  }
  function drawEquipment(){
    const q=($('#eq-search')?.value||'').trim().toLowerCase(),status=$('#eq-status')?.value||'';
    const rows=S.equipment.filter(x=>(!status||x.status===status)&&(!q||[x.asset_no,x.name,x.serial_no,siteName(x.site_id)].join(' ').toLowerCase().includes(q)));
    $('#equipment-grid').innerHTML=rows.map(x=>{const a=openAssignment(x.id);return `<article class="asset-card ${x.status}"><div class="row between wrap"><span class="pill ${pill(x.status)}">${statusLabel(x.status)}</span><span class="muted">${esc(x.asset_no)}</span></div><h3>${esc(x.name)}</h3><div class="asset-meta"><span>${esc(catLabel(x.category))} · ${esc(conditionLabel(x.condition))}</span><span>${esc(siteName(x.site_id))}${x.serial_no?' · SN '+esc(x.serial_no):''}</span>${a?`<span><b>Bei:</b> ${esc(empName(a.employee_id))} seit ${AONE.dt(a.issued_at)}</span>`:''}${x.notes?`<span>${esc(x.notes)}</span>`:''}</div><div class="action-row">${x.status==='available'?`<select class="select" data-issue-emp="${x.id}" style="min-width:170px"><option value="">Mitarbeiter wählen…</option>${employeeOptions()}</select><button class="btn small primary" data-issue="${x.id}">Ausgeben</button>`:''}${x.status==='issued'&&a?`<button class="btn small green" data-return="${a.id}" data-condition="ok">Zurück OK</button><button class="btn small red" data-return="${a.id}" data-condition="damaged">Beschädigt</button>`:''}<button class="btn small" data-state="${x.id}" data-next="${x.status==='maintenance'?'available':'maintenance'}">${x.status==='maintenance'?'Wartung beendet':'In Wartung'}</button>${x.status!=='lost'?`<button class="btn small red" data-state="${x.id}" data-next="lost">Verlust</button>`:''}</div></article>`}).join('')||'<div class="empty">Keine passenden Betriebsmittel.</div>';
    document.querySelectorAll('[data-issue]').forEach(b=>b.onclick=()=>issueEquipment(b.dataset.issue));document.querySelectorAll('[data-return]').forEach(b=>b.onclick=()=>returnEquipment(b.dataset.return,b.dataset.condition||'ok'));document.querySelectorAll('[data-state]').forEach(b=>b.onclick=()=>setEquipmentState(b.dataset.state,b.dataset.next));
  }
  async function saveEquipment(ev){ev.preventDefault();const f=new FormData(ev.currentTarget);try{AONE.loading(true,'Speichern…');await AONE.insert('guard_equipment',{org_id:S.ctx.org_id,site_id:f.get('site_id')||null,asset_no:String(f.get('asset_no')||'').trim(),name:String(f.get('name')||'').trim(),category:f.get('category'),serial_no:String(f.get('serial_no')||'').trim()||null,status:f.get('condition')==='damaged'?'maintenance':'available',condition:f.get('condition'),notes:String(f.get('notes')||'').trim()||null,created_by:S.session.user.id});AONE.toast('Betriebsmittel angelegt.');await refresh();setTab('equipment')}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}}
  async function issueEquipment(id){
    const emp=document.querySelector(`[data-issue-emp="${id}"]`)?.value;if(!emp){AONE.toast('Bitte zuerst einen Mitarbeiter auswählen.','warn');return}
    try{AONE.loading(true,'Ausgabe buchen…');await AONE.rpc('guard_issue_equipment',{p_equipment:id,p_employee:emp,p_shift:null,p_note:null});AONE.toast('Betriebsmittel ausgegeben.');await refresh()}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }
  async function returnEquipment(assignment,condition='ok'){if(!confirm(condition==='damaged'?'Als beschädigt zurücknehmen und in Wartung setzen?':'Rückgabe als in Ordnung buchen?'))return;try{AONE.loading(true,'Rückgabe buchen…');await AONE.rpc('guard_return_equipment',{p_assignment:assignment,p_condition:condition,p_note:null});AONE.toast('Rückgabe gebucht.');await refresh()}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}}
  async function setEquipmentState(id,next){if(!confirm(`Status auf „${statusLabel(next)}“ setzen?`))return;try{await AONE.update('guard_equipment',`id=eq.${encodeURIComponent(id)}`,{status:next});AONE.toast('Status aktualisiert.');await refresh()}catch(e){AONE.toast(e.message,'err')}}

  function renderKeys(){
    const issued=S.keys.filter(x=>x.status==='issued').length,lost=S.keys.filter(x=>x.status==='lost').length;
    $('#asset-view').innerHTML=`<div class="grid cols-3"><div class="card mini-stat"><span class="kicker">Schlüssel</span><div class="stat">${S.keys.length}</div><small class="muted">registriert</small></div><div class="card mini-stat"><span class="kicker">Ausgegeben</span><div class="stat">${issued}</div><small class="muted">aktuell unterwegs</small></div><div class="card mini-stat"><span class="kicker">Verlust</span><div class="stat">${lost}</div><small class="muted">sofort klären</small></div></div>
      <div class="grid cols-2" style="margin-top:14px"><section class="card"><span class="kicker">Neu</span><h2>Schlüssel registrieren</h2><form id="key-form" class="form-grid"><div class="field"><label>Objekt</label><select class="select" name="site_id" required>${siteOptions(false)}</select></div><div class="field"><label>Schlüssel-Nr.</label><input class="input" name="key_no" maxlength="60" required placeholder="SK-01"></div><div class="field wide"><label>Bezeichnung</label><input class="input" name="label" maxlength="160" required placeholder="Haupteingang / Technikraum"></div><div class="field wide"><label>Notiz</label><textarea class="textarea" name="notes" maxlength="1000"></textarea></div><div class="wide"><button class="btn primary block">Schlüssel speichern</button></div></form></section><section class="card"><span class="kicker">Kontrolle</span><h2>Offene Schlüssel</h2>${S.keys.filter(x=>x.status==='issued').map(x=>`<div class="history-item"><b>${esc(x.key_no)} · ${esc(x.label)}</b><div class="muted">${esc(siteName(x.site_id))} · ${esc(empName(x.current_employee_id))} · seit ${AONE.dt(x.issued_at)}</div></div>`).join('')||'<div class="empty-mini">Keine ausgegebenen Schlüssel.</div>'}</section></div>
      <section class="card" style="margin-top:14px"><div class="row between wrap"><div><span class="kicker">Schlüsselbestand</span><h2>Alle Schlüssel</h2></div><button class="btn small" id="key-refresh">Aktualisieren</button></div><div class="asset-grid" id="key-grid"></div></section>`;
    $('#key-form').onsubmit=saveKey;$('#key-refresh').onclick=refresh;drawKeys();
  }
  function drawKeys(){
    $('#key-grid').innerHTML=S.keys.map(k=>`<article class="asset-card ${k.status}"><div class="row between wrap"><span class="pill ${pill(k.status)}">${keyStatusLabel(k.status)}</span><span class="muted">${esc(k.key_no)}</span></div><h3>${esc(k.label)}</h3><div class="asset-meta"><span>${esc(siteName(k.site_id))}</span>${k.current_employee_id?`<span><b>Bei:</b> ${esc(empName(k.current_employee_id))}</span>`:''}${k.issued_at?`<span>seit ${AONE.dt(k.issued_at)}</span>`:''}${k.notes?`<span>${esc(k.notes)}</span>`:''}</div><div class="action-row">${k.status==='available'?`<select class="select" data-key-emp="${k.id}" style="min-width:170px"><option value="">Mitarbeiter wählen…</option>${employeeOptions()}</select><button class="btn small primary" data-key-action="issue" data-key="${k.id}">Ausgeben</button>`:''}${k.status==='issued'?`<button class="btn small green" data-key-action="return" data-key="${k.id}">Zurück</button>`:''}${k.status!=='lost'?`<button class="btn small red" data-key-action="lost" data-key="${k.id}">Verloren</button>`:`<button class="btn small" data-key-action="found" data-key="${k.id}">Gefunden</button>`}</div></article>`).join('')||'<div class="empty">Noch keine Schlüssel registriert.</div>';
    document.querySelectorAll('[data-key-action]').forEach(b=>b.onclick=()=>keyAction(b.dataset.key,b.dataset.keyAction));
  }
  async function saveKey(ev){ev.preventDefault();const f=new FormData(ev.currentTarget);try{await AONE.insert('guard_keys',{org_id:S.ctx.org_id,site_id:f.get('site_id'),key_no:String(f.get('key_no')||'').trim(),label:String(f.get('label')||'').trim(),notes:String(f.get('notes')||'').trim()||null,created_by:S.session.user.id});AONE.toast('Schlüssel registriert.');await refresh();setTab('keys')}catch(e){AONE.toast(e.message,'err')}}
  async function keyAction(id,action){let employee=null;if(action==='issue'){employee=document.querySelector(`[data-key-emp="${id}"]`)?.value;if(!employee){AONE.toast('Bitte zuerst einen Mitarbeiter auswählen.','warn');return}}if(!confirm(action==='issue'?'Schlüssel an ausgewählten Mitarbeiter ausgeben?':action==='return'?'Schlüssel zurücknehmen?':action==='lost'?'Schlüssel als verloren markieren?':'Status aktualisieren?'))return;try{AONE.loading(true,'Schlüssel buchen…');await AONE.rpc('guard_move_key',{p_key:id,p_action:action,p_employee:employee,p_shift:null,p_note:null});AONE.toast('Schlüsselstatus aktualisiert.');await refresh()}catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}}

  function renderHistory(){
    const eq=S.assignments.slice(0,100).map(a=>({at:a.returned_at||a.issued_at,type:a.returned_at?'Rückgabe':'Ausgabe',title:S.equipment.find(e=>e.id===a.equipment_id)?.name||'Betriebsmittel',meta:`${empName(a.employee_id)} · ${a.returned_at?conditionLabel(a.return_condition):conditionLabel(a.issue_condition)}`}));
    const km=S.movements.slice(0,100).map(m=>({at:m.occurred_at,type:{issue:'Schlüssel Ausgabe',return:'Schlüssel Rückgabe',lost:'Schlüsselverlust',found:'Schlüssel gefunden',retire:'Schlüssel ausgemustert'}[m.action]||m.action,title:(()=>{const k=S.keys.find(x=>x.id===m.key_id);return k?`${k.key_no} · ${k.label}`:'Schlüssel'})(),meta:`${empName(m.employee_id)}${m.note?' · '+m.note:''}`}));
    const rows=[...eq,...km].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,150);
    $('#asset-view').innerHTML=`<div class="page-head"><div><h1>Ausgabe- & Rückgabehistorie</h1><p>Nachvollziehbarer Verlauf von Betriebsmitteln und Schlüsseln.</p></div><button class="btn" id="history-refresh">Aktualisieren</button></div><section class="card"><div class="history">${rows.map(x=>`<div class="history-item"><div class="row between wrap"><b>${esc(x.type)} · ${esc(x.title)}</b><span class="muted">${AONE.dt(x.at)}</span></div><div class="muted">${esc(x.meta)}</div></div>`).join('')||'<div class="empty">Noch keine Bewegungen.</div>'}</div></section>`;$('#history-refresh').onclick=refresh;
  }
  init().catch(e=>{AONE.toast(e.message,'err');AONE.loading(false)});
})();
