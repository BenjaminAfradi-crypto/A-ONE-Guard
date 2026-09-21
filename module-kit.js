/* Shared UI and tenant-scoped data helpers for operational modules. */
const GuardUI = (() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const esc = value => AONE.esc(value == null ? '' : value);
  const state = {ctx:null,user:null,employee:null,sites:[],employees:[],busy:false};
  const labels = {open:'Offen',in_progress:'In Bearbeitung',done:'Erledigt',canceled:'Storniert',follow_up:'Nachkontrolle',closed:'Abgeschlossen',submitted:'Eingereicht',reviewed:'Geprüft',active:'Aktiv',overdue:'Überfällig',escalated:'Eskaliert',low:'Niedrig',normal:'Normal',high:'Hoch',critical:'Kritisch',success:'Erfolgreich',error:'Fehler',skipped:'Übersprungen'};
  const label = value => labels[value] || value || '–';
  const date = value => value ? AONE.dt(value) : '–';
  const site = id => state.sites.find(x=>x.id===id)?.name || 'Ohne Objekt';
  const employee = id => state.employees.find(x=>x.id===id)?.display_name || 'Nicht zugewiesen';
  const params = values => new URLSearchParams(Object.entries(values).filter(([,v])=>v!==undefined&&v!==null)).toString();
  async function rows(table, values={}) {
    const result=[];
    // Bounded pages prevent the Data API's row cap from silently truncating results.
    for(let offset=0;offset<20000;offset+=500) {
      const page=await AONE.table(table,params({select:'*',...values,org_id:`eq.${state.ctx.org_id}`,order:values.order||'id.asc',limit:500,offset}));
      if(!Array.isArray(page))throw new Error('Ungültige Serverantwort. Bitte erneut versuchen.');
      result.push(...page);if(page.length<500)return result;
    }
    throw new Error('Zu viele Ergebnisse. Bitte den Zeitraum oder Filter eingrenzen.');
  }
  const update = (table,id,values) => AONE.update(table,params({id:`eq.${id}`,org_id:`eq.${state.ctx.org_id}`}),values).then(result=>{
    if(!Array.isArray(result)||result.length!==1)throw new Error('Datensatz wurde nicht geändert. Bitte Berechtigung und aktuellen Stand prüfen.');return result[0];
  });
  const insert = (table,values) => AONE.insert(table,{...values,org_id:state.ctx.org_id,created_by:state.user.id},true).then(result=>{
    if(!Array.isArray(result)||result.length!==1)throw new Error('Speicherung konnte nicht bestätigt werden. Bitte vor erneutem Speichern aktualisieren.');return result[0];
  });
  function message(text,kind='ok') { const el=$('#module-message');el.textContent=text;el.className=`notice ${kind==='err'?'warn':''}`;el.hidden=!text; }
  function button(text,action,id='',kind='') {return `<button type="button" class="btn small ${kind}" data-action="${esc(action)}" data-id="${esc(id)}">${esc(text)}</button>`;}
  function empty(text='Noch keine Einträge vorhanden.') {return `<p class="module-empty">${esc(text)}</p>`;}
  function badges(values) {return `<div class="module-badges">${values.map(v=>`<span class="badge">${esc(v)}</span>`).join('')}</div>`;}
  function card(title,body,actions='') {return `<article class="card module-card"><h2>${esc(title)}</h2>${body}${actions?`<div class="module-actions">${actions}</div>`:''}</article>`;}
  function options(rows,chosen='',first='Bitte wählen') {return `<option value="">${esc(first)}</option>`+rows.map(x=>`<option value="${esc(x.id??x.value)}" ${(x.id??x.value)===chosen?'selected':''}>${esc(x.name??x.label??x.display_name)}</option>`).join('');}
  function field(key,title,type='text',value='',extra='') {
    const attrs=`id="field-${esc(key)}" name="${esc(key)}" class="input" ${extra}`;
    return `<label class="module-field" for="field-${esc(key)}"><span>${esc(title)}</span>${type==='textarea'?`<textarea ${attrs} rows="4">${esc(value)}</textarea>`:type==='select'?`<select ${attrs}>${value}</select>`:`<input ${attrs} type="${esc(type)}" value="${esc(value)}">`}</label>`;
  }
  function localInput(value) {if(!value)return '';const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
  function iso(value){return value?new Date(value).toISOString():null;}
  function dialog(title,html,save,{submit='Speichern',onOpen}={}) {
    const modal=$('#module-dialog');
    modal.innerHTML=`<form id="module-editor"><h2>${esc(title)}</h2><div class="module-form">${html}</div><p id="editor-error" class="error" role="alert" hidden></p><div class="module-actions"><button class="btn" type="button" id="editor-close">Schließen</button>${save?`<button class="btn primary" type="submit">${esc(submit)}</button>`:''}</div></form>`;
    modal.showModal();let saving=false;
    $('#editor-close').onclick=()=>modal.close();
    modal.oncancel=e=>{if(saving)e.preventDefault()};
    $('#module-editor').onsubmit=async e=>{
      e.preventDefault();if(!save||saving)return;saving=true;
      const form=e.currentTarget,data=new FormData(form),error=$('#editor-error');error.hidden=true;
      form.querySelectorAll('button').forEach(b=>b.disabled=true);
      try {await save(data,form);modal.close();message('Gespeichert.');try{await state.reload()}catch(err){message('Gespeichert, aber die Ansicht konnte nicht aktualisiert werden: '+err.message,'err')}}
      catch(err){error.textContent=err.message;error.hidden=false;}
      finally {saving=false;form.querySelectorAll('button').forEach(b=>b.disabled=false);}
    };
    onOpen?.(modal);
  }
  async function run(action) {
    if(state.busy)return;state.busy=true;$('#module-content').setAttribute('aria-busy','true');
    try {message('');await action();}catch(err){message(err.message||'Aktion fehlgeschlagen.','err');}
    finally{state.busy=false;$('#module-content').setAttribute('aria-busy','false');}
  }
  function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  async function csv(name,headers,records,entity='report') {
    await AONE.rpc('guard_log_export',{p_org:state.ctx.org_id,p_entity_type:entity,p_entity_id:null,p_format:'csv',p_note:name});
    const text='\uFEFF'+[headers,...records].map(row=>row.map(csvCell).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function init(manager=false) {
    const session=await AONE.session();if(!session){location.replace(manager?'./admin-login.html':'./login.html');return false;}
    if(session.user.app_metadata?.must_change_password){location.replace('./change-password.html');return false;}
    state.user=session.user;state.ctx=await AONE.chooseContext();
    if(!state.ctx)throw new Error('Diesem Konto ist keine Firma zugeordnet.');
    if(manager&&!AONE.isManager(state.ctx.role))throw new Error('Für diesen Bereich ist ein Management-Zugang erforderlich.');
    [state.sites,state.employees]=await Promise.all([rows('guard_sites'),rows('guard_employees')]);
    state.employee=state.employees.find(e=>e.user_id===state.user.id);
    $('#org-name').textContent=state.ctx.org?.name||'A ONE Guard';
    $('#home-link').href=AONE.isManager(state.ctx.role)?'./admin.html':'./app.html';
    if($('#overview-link'))$('#overview-link').href=$('#home-link').href;
    $('#logout').onclick=()=>{AONE.signOut();location.replace('./login.html')};
    return true;
  }
  return {$,esc,state,label,date,site,employee,params,rows,update,insert,message,button,empty,badges,card,options,field,localInput,iso,dialog,run,csv,init};
})();
