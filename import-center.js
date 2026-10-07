(()=>{
  const kind=document.body?.dataset?.importKind;
  if(!kind||!['employees','shifts'].includes(kind)||typeof AONE_IMPORT==='undefined'||typeof AONE==='undefined')return;
  const state={ctx:null,user:null,file:null,buffer:null,book:null,parsed:null,plan:null,sha:'',mapping:{},batchId:null,credentials:[]};
  const labels={
    employeeNo:'Personalnummer',displayName:'Name',email:'E-Mail',phone:'Telefon',qualification:'Qualifikation',
    siteName:'Objekt',date:'Datum',start:'Beginn',end:'Ende',title:'Tätigkeit'
  };
  const fields=kind==='employees'
    ?['employeeNo','displayName','email','phone','qualification']
    :['employeeNo','displayName','email','siteName','date','start','end','title'];
  const esc=v=>AONE.esc(v??'');
  const q=s=>document.querySelector(s);
  const chunks=(arr,size)=>Array.from({length:Math.ceil(arr.length/size)},(_,i)=>arr.slice(i*size,i*size+size));
  const status=(text,bad=false)=>{const el=q('#import-status');if(el){el.className=bad?'aone-import-status bad':'aone-import-status';el.textContent=text||''}};
  async function sha256(buffer){const h=await crypto.subtle.digest('SHA-256',buffer);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  function addUi(){
    const host=kind==='employees'?q('.core-hero .row.wrap'):q('.planner-head .planner-toolbar');
    if(!host||q('#open-import'))return;
    const b=document.createElement('button');b.type='button';b.id='open-import';b.className='btn';b.textContent='Excel importieren';host.prepend(b);
    const account=kind==='employees'?'<label class="aone-import-check"><input type="checkbox" id="import-accounts"> Für Zeilen mit E-Mail zusätzlich Login-Konto erstellen (standardmäßig aus)</label>':'<label class="aone-import-check"><input type="checkbox" id="import-create-sites" checked> Fehlende Objekte nach Vorschau automatisch anlegen</label>';
    document.body.insertAdjacentHTML('beforeend',`
      <div class="aone-import-back" id="import-back" aria-hidden="true">
        <section class="aone-import-sheet" role="dialog" aria-modal="true" aria-labelledby="import-title">
          <header class="aone-import-head"><div><div class="kicker">Import Center</div><h2 id="import-title">${kind==='employees'?'Mitarbeiter aus Excel übernehmen':'Dienstplan aus Excel übernehmen'}</h2></div><button class="btn small" id="close-import" type="button">Schließen</button></header>
          <p class="muted">${kind==='employees'?'XLS, XLSX oder CSV hochladen, Spalten prüfen, Zuordnung kontrollieren und erst danach importieren.':'XLS, XLSX oder CSV als Zeilenliste oder Monatsmatrix. A ONE Guard ordnet Mitarbeiter und Objekte zu und prüft Konflikte vor dem Import.'}</p>
          <div class="aone-import-drop"><input id="import-file" type="file" accept=".xls,.xlsx,.csv"><span>Max. 8 MB. Die Datei wird zuerst nur analysiert.</span></div>
          <div id="import-mapping" class="aone-import-mapping" hidden></div>
          ${account}
          <div id="import-status" class="aone-import-status"></div>
          <div id="import-summary" class="aone-import-summary"></div>
          <div id="import-issues"></div>
          <div class="aone-import-table-wrap"><table class="aone-import-table" id="import-table"></table></div>
          <div id="import-credentials"></div>
          <footer class="aone-import-actions">
            <button class="btn" id="export-import-errors" type="button" hidden>Fehler als CSV</button>
            <button class="btn" id="undo-import" type="button" hidden>Letzten Import zurücknehmen</button>
            <button class="btn primary" id="apply-import" type="button" disabled>Gültige Datensätze importieren</button>
          </footer>
        </section>
      </div>`);
    const style=document.createElement('style');style.textContent=`
      .aone-import-back{position:fixed;inset:0;z-index:10020;background:rgba(0,0,0,.74);display:none;align-items:center;justify-content:center;padding:18px}.aone-import-back.open{display:flex}
      .aone-import-sheet{width:min(1120px,100%);max-height:94vh;overflow:auto;background:#101720;border:1px solid #35445a;border-radius:22px;padding:20px;box-sizing:border-box}
      .aone-import-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.aone-import-head h2{margin:4px 0 8px}
      .aone-import-drop{display:flex;gap:12px;align-items:center;flex-wrap:wrap;border:1px dashed #46576c;border-radius:14px;padding:14px;margin:14px 0}.aone-import-drop span{font-size:12px;color:#94a3b8}
      .aone-import-mapping{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}.aone-import-mapping label{display:grid;gap:5px;font-size:12px;color:#cbd5e1}
      .aone-import-check{display:flex;gap:8px;align-items:flex-start;margin:10px 0;color:#cbd5e1;font-size:13px}.aone-import-status{min-height:22px;margin:10px 0;color:#cbd5e1}.aone-import-status.bad{color:#fecaca}
      .aone-import-summary{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.aone-import-summary span{padding:6px 9px;border-radius:999px;background:#172230;border:1px solid #2b3a4d;font-size:12px}
      .aone-import-table-wrap{overflow:auto;max-height:310px;border:1px solid #263446;border-radius:12px}.aone-import-table{width:100%;border-collapse:collapse;font-size:12px}.aone-import-table th,.aone-import-table td{padding:8px;border-bottom:1px solid #263446;text-align:left;white-space:nowrap}.aone-import-table th{position:sticky;top:0;background:#111a25;z-index:1}
      .aone-import-issues{max-height:160px;overflow:auto;margin:8px 0;padding:10px 10px 10px 28px;border:1px solid rgba(248,113,113,.25);background:rgba(248,113,113,.05);border-radius:12px;font-size:12px}
      .aone-import-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px}.aone-import-creds{margin-top:14px;padding:12px;border:1px solid #3b526d;border-radius:12px;background:#08111b}.aone-import-creds code{user-select:all}
      @media(max-width:760px){.aone-import-back{padding:8px}.aone-import-sheet{padding:14px;border-radius:16px}.aone-import-mapping{grid-template-columns:1fr 1fr}.aone-import-actions>*{flex:1}.aone-import-head{position:sticky;top:-14px;background:#101720;padding:8px 0;z-index:3}}
    `;document.head.appendChild(style);
    b.onclick=open;q('#close-import').onclick=close;q('#import-back').addEventListener('click',e=>{if(e.target.id==='import-back')close()});
    q('#import-file').onchange=e=>void readFile(e.target.files?.[0]);
    q('#apply-import').onclick=()=>void apply();
    q('#export-import-errors').onclick=downloadIssues;
    q('#undo-import').onclick=()=>void undo();
    if(q('#import-create-sites'))q('#import-create-sites').onchange=()=>void plan();
  }
  function open(){q('#import-back').classList.add('open');q('#import-back').setAttribute('aria-hidden','false')}
  function close(){q('#import-back').classList.remove('open');q('#import-back').setAttribute('aria-hidden','true');if(kind==='shifts'&&state.batchId)location.reload()}
  async function loadWorkbook(buffer,fileName){
    const XLSX=await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
    if(/\.xls$/i.test(fileName)&&XLSX.set_cptable){
      try{const cp=await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/cpexcel.full.mjs');XLSX.set_cptable(cp)}catch{}
    }
    const wb=XLSX.read(buffer,{type:'array',cellDates:true,cellFormula:false,cellHTML:false,dense:true});
    if(wb.SheetNames.length>50)throw new Error('Maximal 50 Arbeitsblätter pro Datei.');
    const Sheets={};let cells=0;
    for(const name of wb.SheetNames){
      const grid=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',raw:true,blankrows:false});
      cells+=grid.reduce((n,row)=>n+row.length,0);if(grid.length>20000||grid.some(r=>r.length>400))throw new Error('Ein Arbeitsblatt ist zu groß.');
      Sheets[name]=grid;
    }
    if(cells>500000)throw new Error('Die Datei enthält zu viele Zellen. Bitte nur relevante Daten exportieren.');
    return {SheetNames:wb.SheetNames,Sheets};
  }
  async function readFile(file){
    resetResult();if(!file)return;
    if(file.size>8*1024*1024)return status('Datei ist größer als 8 MB.',true);
    if(!/\.(xls|xlsx|csv)$/i.test(file.name))return status('Bitte XLS, XLSX oder CSV auswählen.',true);
    state.file=file;status('Datei wird sicher analysiert …');q('#apply-import').disabled=true;
    try{
      state.buffer=await file.arrayBuffer();state.sha=await sha256(state.buffer);state.book=await loadWorkbook(state.buffer,file.name);state.mapping={};
      state.parsed=AONE_IMPORT.parseWorkbook(state.book,kind,state.mapping);renderMapping();await plan();status('Vorschau bereit. Es wurde noch nichts gespeichert.');
    }catch(e){status(e.message||'Datei konnte nicht gelesen werden.',true)}
  }
  function resetResult(){state.file=null;state.buffer=null;state.book=null;state.parsed=null;state.plan=null;state.batchId=null;state.credentials=[];q('#import-summary').innerHTML='';q('#import-table').innerHTML='';q('#import-issues').innerHTML='';q('#import-credentials').innerHTML='';q('#import-mapping').hidden=true;q('#apply-import').disabled=true;q('#undo-import').hidden=true;q('#export-import-errors').hidden=true}
  function renderMapping(){
    const box=q('#import-mapping'),headers=state.parsed?.headers||[];if(!headers.length){box.hidden=true;return}
    box.hidden=false;box.innerHTML=fields.map(key=>`<label>${esc(labels[key]||key)}<select class="input import-map" data-key="${key}"><option value="">Automatisch erkennen</option>${headers.map(h=>`<option value="${esc(h)}">${esc(h)}</option>`).join('')}</select></label>`).join('');
    box.querySelectorAll('.import-map').forEach(sel=>sel.onchange=()=>{state.mapping[sel.dataset.key]=sel.value;state.parsed=AONE_IMPORT.parseWorkbook(state.book,kind,state.mapping);void plan()});
  }
  async function plan(){
    if(!state.parsed)return;status('Zuordnungen und Konflikte werden geprüft …');
    try{
      if(kind==='employees'){
        const employees=await AONE.tableAll('guard_employees',`select=id,employee_no,display_name,email,phone,qualification_level,status,user_id&org_id=eq.${encodeURIComponent(state.ctx.org_id)}`);
        state.plan=AONE_IMPORT.planEmployees(state.parsed.rows,employees);
      }else{
        const [employees,sites,orgRows]=await Promise.all([
          AONE.tableAll('guard_employees',`select=id,employee_no,display_name,email,status&org_id=eq.${encodeURIComponent(state.ctx.org_id)}`),
          AONE.tableAll('guard_sites',`select=id,name,active&org_id=eq.${encodeURIComponent(state.ctx.org_id)}`),
          AONE.table('guard_organizations',`select=id,min_rest_minutes&id=eq.${encodeURIComponent(state.ctx.org_id)}&limit=1`)
        ]);
        const valid=state.parsed.rows.filter(r=>r.starts_at&&r.ends_at);
        let shifts=[];if(valid.length){
          const min=new Date(Math.min(...valid.map(r=>+new Date(r.starts_at)))-86400000).toISOString(),max=new Date(Math.max(...valid.map(r=>+new Date(r.ends_at)))+86400000).toISOString();
          shifts=await AONE.tableAll('guard_shifts',`select=id,employee_id,site_id,starts_at,ends_at,status&org_id=eq.${encodeURIComponent(state.ctx.org_id)}&starts_at=lt.${encodeURIComponent(max)}&ends_at=gt.${encodeURIComponent(min)}`);
        }
        state.plan=AONE_IMPORT.planShifts(state.parsed.rows,{employees,sites,shifts,restMinutes:Number(orgRows?.[0]?.min_rest_minutes??660),createMissingSites:q('#import-create-sites').checked});
      }
      renderPlan();status('Vorschau aktualisiert. Es wurde noch nichts gespeichert.');
    }catch(e){status(e.message||'Vorschau konnte nicht erstellt werden.',true)}
  }
  function allIssues(){return [...(state.parsed?.problems||[]),...(state.plan?.issues||[])]}
  function renderPlan(){
    const p=state.plan,issues=allIssues();if(!p)return;
    const accepted=p.accepted?.length||0;
    q('#import-summary').innerHTML=kind==='employees'
      ?`<span>${p.total} erkannt</span><span>${p.created} neu</span><span>${p.updated} Änderungen</span><span>${p.skipped} übersprungen</span><span>${issues.length} Hinweise/Fehler</span>`
      :`<span>${p.total} erkannt</span><span>${accepted} importierbar</span><span>${p.skipped} übersprungen</span><span>${p.newSites.length} neue Objekte</span><span>${issues.length} Hinweise/Fehler</span>`;
    q('#import-issues').innerHTML=issues.length?`<ul class="aone-import-issues">${issues.slice(0,100).map(x=>`<li>${esc(x.sheet)}, Zeile ${esc(x.row)}: ${esc(x.reason)}</li>`).join('')}${issues.length>100?'<li>Weitere Fehler sind im CSV-Export enthalten.</li>':''}</ul>`:'';
    q('#export-import-errors').hidden=!issues.length;
    const rows=(p.accepted||[]).slice(0,50);
    if(kind==='employees'){
      q('#import-table').innerHTML='<thead><tr><th>Aktion</th><th>Personalnr.</th><th>Name</th><th>E-Mail</th><th>Telefon</th><th>Qualifikation</th></tr></thead><tbody>'+rows.map(r=>`<tr><td>${r.existing_id?'Aktualisieren':'Neu'}</td><td>${esc(r.employee_no)}</td><td>${esc(r.display_name)}</td><td>${esc(r.email)}</td><td>${esc(r.phone)}</td><td>${esc(r.qualification_level)}</td></tr>`).join('')+'</tbody>';
    }else{
      q('#import-table').innerHTML='<thead><tr><th>Mitarbeiter</th><th>Objekt</th><th>Beginn</th><th>Ende</th><th>Tätigkeit</th></tr></thead><tbody>'+rows.map(r=>`<tr><td>${esc(r.display_name||r.employee_no||r.email)}</td><td>${esc(r.site_name)}</td><td>${esc(AONE.dt(r.starts_at))}</td><td>${esc(AONE.dt(r.ends_at))}</td><td>${esc(r.title)}</td></tr>`).join('')+'</tbody>';
    }
    q('#apply-import').textContent=`${accepted} gültige Datensätze importieren`;q('#apply-import').disabled=!accepted;
  }
  async function apply(){
    const p=state.plan;if(!p?.accepted?.length)return;const btn=q('#apply-import');btn.disabled=true;state.credentials=[];state.batchId=null;
    try{
      if(kind==='employees')await applyEmployees();else await applyShifts();
    }catch(e){status(e.message||'Import fehlgeschlagen.',true)}
    finally{btn.disabled=false}
  }
  async function applyEmployees(){
    const rows=state.plan.accepted.map(r=>({row_no:r.row,display_name:r.display_name,employee_no:r.employee_no||null,email:r.email||null,phone:r.phone||null,qualification_level:r.qualification_level||'none',status:'active'}));
    let created=0,updated=0,accounts=0,failed=0;const errors=[];
    status('Mitarbeiter werden importiert …');
    for(const part of chunks(rows,50)){
      const result=await AONE.edge('guard-import-employees',{action:'import',org_id:state.ctx.org_id,file_name:state.file.name,file_sha256:state.sha,rows:part,create_accounts:q('#import-accounts').checked});
      created+=Number(result.created||0);updated+=Number(result.updated||0);accounts+=Number(result.accounts||0);failed+=Number(result.failed||0);state.credentials.push(...(result.credentials||[]));
      for(const r of result.results||[])if(!r.ok)errors.push({sheet:'Import',row:r.row_no,reason:r.error||'Importfehler'});
    }
    status(`Import abgeschlossen: ${created} neu, ${updated} aktualisiert, ${failed} fehlgeschlagen.`,failed>0);
    if(errors.length){state.plan.issues.push(...errors);renderPlan()}
    if(state.credentials.length){
      q('#import-credentials').innerHTML=`<div class="aone-import-creds"><b>Einmalige Zugangsdaten</b><p class="muted">Diese Passwörter werden nicht erneut angezeigt. Sicher übergeben; beim ersten Login ist ein Passwortwechsel vorgesehen.</p><div class="aone-import-table-wrap"><table class="aone-import-table"><thead><tr><th>Name</th><th>E-Mail</th><th>Temporäres Passwort</th></tr></thead><tbody>${state.credentials.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.email)}</td><td><code>${esc(c.temporary_password)}</code></td></tr>`).join('')}</tbody></table></div></div>`;
    }
  }
  async function applyShifts(){
    status('Dienstplan wird serverseitig geprüft und importiert …');
    const rows=state.plan.accepted.map(r=>({
      sheet:r.sheet,
      row:r.row,
      employee_id:r.employee_id,
      site_id:r.site_id||null,
      site_name:r.site_name,
      title:r.title||'Sicherheitsdienst',
      starts_at:r.starts_at,
      ends_at:r.ends_at,
      required_qualification:r.required_qualification||'none'
    }));
    if(rows.length>2000)throw new Error('Maximal 2.000 Schichten pro Import. Bitte die Datei aufteilen.');
    const result=await AONE.rpc('guard_apply_schedule_import',{
      p_org:state.ctx.org_id,
      p_file_name:state.file.name,
      p_file_sha256:state.sha,
      p_rows:rows,
      p_create_missing_sites:q('#import-create-sites').checked
    });
    const done=Number(result?.imported||0),failed=Number(result?.failed||0),errors=Array.isArray(result?.errors)?result.errors:[];
    state.batchId=result?.batch_id||null;
    q('#undo-import').hidden=!state.batchId||done===0;
    if(errors.length){state.plan.issues.push(...errors);renderPlan()}
    status(`Dienstplan importiert: ${done} Schichten gespeichert, ${failed} fehlgeschlagen. Jeder Mitarbeiter sieht nur seine eigenen zugeordneten Schichten.`,failed>0);
  }
  async function undo(){
    if(!state.batchId)return;const b=q('#undo-import');b.disabled=true;
    try{const result=await AONE.rpc('guard_revert_schedule_import',{p_batch:state.batchId});status(`Import zurückgenommen: ${result.reverted_shifts||0} Schichten storniert.`);b.hidden=true;state.batchId=null}
    catch(e){status(e.message||'Import konnte nicht zurückgenommen werden.',true)}
    finally{b.disabled=false}
  }
  function downloadIssues(){
    const issues=allIssues();if(!issues.length)return;const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    const csv=['Arbeitsblatt;Zeile;Fehler',...issues.map(x=>[x.sheet,x.row,x.reason].map(quote).join(';'))].join('\r\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='a-one-guard-import-fehler.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function init(){
    const session=await AONE.session();if(!session)return;state.user=session.user;state.ctx=await AONE.chooseContext();
    if(!state.ctx||!AONE.isManager(state.ctx.role))return;
    if(kind==='employees'&&!['owner','admin'].includes(state.ctx.role))return;
    addUi();
  }
  init().catch(e=>console.error('Import Center konnte nicht initialisiert werden',e));
})();