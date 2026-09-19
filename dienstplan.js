(()=>{
  const $=s=>document.querySelector(s);
  const state={ctx:null,user:null,employees:[],sites:[],shifts:[],weekStart:null,loading:false};
  const qualRank={none:0,unterrichtung:1,sachkunde:2};
  const qualLabel={none:'Keine Vorgabe',unterrichtung:'Unterrichtung',sachkunde:'Sachkunde'};
  const statusLabel={planned:'Geplant',confirmed:'Freigegeben',in_progress:'Läuft',completed:'Abgeschlossen',canceled:'Storniert'};
  const days=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];

  function esc(v=''){return AONE.esc(v)}
  function pad(n){return String(n).padStart(2,'0')}
  function localDate(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
  function localTime(d){return `${pad(d.getHours())}:${pad(d.getMinutes())}`}
  function startOfWeek(input=new Date()){
    const d=new Date(input);d.setHours(0,0,0,0);const shift=(d.getDay()+6)%7;d.setDate(d.getDate()-shift);return d;
  }
  function addDays(input,n){const d=new Date(input);d.setDate(d.getDate()+n);return d}
  function weekEnd(){return addDays(state.weekStart,7)}
  function makeDate(date,time){return new Date(`${date}T${time}:00`)}
  function durationHours(s){return Math.max(0,(new Date(s.ends_at)-new Date(s.starts_at))/3600000)}
  function fmtDate(d){return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit'}).format(d)}
  function fmtWeekRange(){return `${fmtDate(state.weekStart)} – ${fmtDate(addDays(state.weekStart,6))}`}
  function siteById(id){return state.sites.find(x=>x.id===id)}
  function empById(id){return state.employees.find(x=>x.id===id)}
  function empEligible(emp,qual){return !emp||qualRank[emp.qualification_level||'none']>=qualRank[qual||'none']}
  function setBusy(on){state.loading=on;document.body.classList.toggle('busy',on)}
  function message(el,text,kind='ok'){
    if(!el)return; if(!text){el.innerHTML='';return}
    const cls=kind==='err'?'error':'notice-inline';el.innerHTML=`<div class="${cls}">${esc(text)}</div>`;
  }
  function openModal(id){$(id).classList.add('open')}
  function closeModal(id){$(id).classList.remove('open')}

  function fillSelects(){
    const siteOptions=['<option value="">Objekt wählen…</option>',...state.sites.map(s=>`<option value="${s.id}">${esc(s.name)}${s.customer_name?` · ${esc(s.customer_name)}`:''}</option>`)].join('');
    $('#q-site').innerHTML=siteOptions; $('#e-site').innerHTML=siteOptions;
    $('#filter-site').innerHTML='<option value="">Alle Objekte</option>'+state.sites.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
    const empOptions=['<option value="">Unbesetzt</option>',...state.employees.map(e=>`<option value="${e.id}">${esc(e.display_name)}${e.employee_no?` · ${esc(e.employee_no)}`:''}</option>`)].join('');
    $('#q-employee').innerHTML=empOptions; $('#e-employee').innerHTML=empOptions;
    $('#filter-employee').innerHTML='<option value="">Alle Mitarbeiter</option>'+state.employees.map(e=>`<option value="${e.id}">${esc(e.display_name)}</option>`).join('');
  }

  function employeeOptionsForQual(select,qual,current=''){
    const opts=['<option value="">Unbesetzt</option>'];
    for(const e of state.employees){
      const eligible=empEligible(e,qual);
      opts.push(`<option value="${e.id}" ${e.id===current?'selected':''} ${eligible?'':'disabled'}>${esc(e.display_name)}${eligible?'':' · Qualifikation reicht nicht'}</option>`);
    }
    select.innerHTML=opts.join('');
  }

  async function loadReferences(){
    const org=state.ctx.org_id;
    const [employees,sites]=await Promise.all([
      AONE.table('guard_employees',`select=id,display_name,employee_no,email,qualification_level,status&org_id=eq.${encodeURIComponent(org)}&status=eq.active&order=display_name.asc`),
      AONE.table('guard_sites',`select=id,name,customer_name,address,active&org_id=eq.${encodeURIComponent(org)}&active=eq.true&order=name.asc`)
    ]);
    state.employees=employees||[];state.sites=sites||[];fillSelects();
  }

  async function loadWeek(){
    const from=state.weekStart.toISOString(),to=weekEnd().toISOString();
    state.shifts=await AONE.table('guard_shifts',`select=id,site_id,employee_id,title,starts_at,ends_at,required_qualification,status,notes,created_at&org_id=eq.${encodeURIComponent(state.ctx.org_id)}&starts_at=gte.${encodeURIComponent(from)}&starts_at=lt.${encodeURIComponent(to)}&order=starts_at.asc`)||[];
    render();
  }

  function filteredShifts(){
    const site=$('#filter-site').value,emp=$('#filter-employee').value,showCanceled=$('#show-canceled').checked;
    return state.shifts.filter(s=>(!site||s.site_id===site)&&(!emp||s.employee_id===emp)&&(showCanceled||s.status!=='canceled'));
  }

  function shiftCard(s){
    const start=new Date(s.starts_at),end=new Date(s.ends_at),site=siteById(s.site_id),emp=empById(s.employee_id);
    const employee=emp?esc(emp.display_name):'Unbesetzt';
    return `<article class="shift ${esc(s.status)} ${s.employee_id?'':'unassigned'}" data-id="${s.id}">
      <div class="shift-time">${localTime(start)}–${localTime(end)}</div>
      <div class="shift-site"><b>${esc(site?.name||'Objekt')}</b>${s.title&&s.title!==(site?.name||'')?` · ${esc(s.title)}`:''}</div>
      <div class="shift-employee">${employee}</div>
      <div class="shift-meta"><span class="tag">${esc(statusLabel[s.status]||s.status)}</span>${s.required_qualification!=='none'?`<span class="tag">${esc(qualLabel[s.required_qualification]||s.required_qualification)}</span>`:''}<span class="tag">${durationHours(s).toFixed(1).replace('.0','')} h</span></div>
      <div class="shift-actions">
        <button class="btn small edit-shift" type="button" data-id="${s.id}">Bearbeiten</button>
        <button class="btn small copy-shift" type="button" data-id="${s.id}">+1 Tag</button>
        ${s.status==='planned'?`<button class="btn small confirm-shift" type="button" data-id="${s.id}">Freigeben</button>`:''}
      </div>
    </article>`;
  }

  function render(){
    $('#week-title').textContent=fmtWeekRange();
    const visible=filteredShifts();
    const totalHours=visible.filter(s=>s.status!=='canceled').reduce((a,s)=>a+durationHours(s),0);
    const unassigned=visible.filter(s=>!s.employee_id&&s.status!=='canceled').length;
    $('#stats').innerHTML=`<span class="stat">${visible.filter(s=>s.status!=='canceled').length} Schichten</span><span class="stat">${totalHours.toFixed(1).replace('.0','')} Std.</span><span class="stat">${unassigned} unbesetzt</span>`;
    const today=localDate(new Date());
    const html=[];
    for(let i=0;i<7;i++){
      const d=addDays(state.weekStart,i),key=localDate(d);
      const list=visible.filter(s=>localDate(new Date(s.starts_at))===key);
      html.push(`<section class="day ${key===today?'today':''}"><div class="day-head"><span class="day-name">${days[i]}</span><span class="day-date">${fmtDate(d)}</span></div>${list.length?list.map(shiftCard).join(''):'<div class="empty-day">Keine Schicht</div>'}</section>`);
    }
    $('#week-grid').innerHTML=html.join('');
    if(!state.sites.length) message($('#planner-msg'),'Noch kein Objekt vorhanden. Lege zuerst oben über „+ Objekt“ ein Objekt an.','warn');
    else if(!state.employees.length) message($('#planner-msg'),'Noch keine aktiven Mitarbeiter vorhanden. Schichten können trotzdem unbesetzt geplant und später zugewiesen werden.','warn');
    else message($('#planner-msg'),'');
  }

  function buildShiftRow({siteId,employeeId,date,startTime,endTime,title,qual,notes,status='planned'}){
    const start=makeDate(date,startTime);let end=makeDate(date,endTime);if(end<=start)end=addDays(end,1);
    const site=siteById(siteId);
    return {org_id:state.ctx.org_id,site_id:siteId,employee_id:employeeId||null,title:(title||site?.name||'Schicht').trim(),starts_at:start.toISOString(),ends_at:end.toISOString(),required_qualification:qual||'none',status,notes:notes?.trim()||null,created_by:state.user.id};
  }

  function localOverlap(row){
    if(!row.employee_id)return null;
    const a=new Date(row.starts_at),b=new Date(row.ends_at);
    return state.shifts.find(s=>s.employee_id===row.employee_id&&s.status!=='canceled'&&a<new Date(s.ends_at)&&b>new Date(s.starts_at));
  }

  async function createQuick(e){
    e.preventDefault();message($('#quick-msg'),'');
    const siteId=$('#q-site').value;if(!siteId)return message($('#quick-msg'),'Bitte ein Objekt auswählen.','err');
    const employeeId=$('#q-employee').value,baseDate=$('#q-date').value,start=$('#q-start').value,end=$('#q-end').value,repeat=Number($('#q-repeat').value||1),qual=$('#q-qual').value,title=$('#q-title').value,notes=$('#q-notes').value;
    if(!baseDate||!start||!end)return message($('#quick-msg'),'Datum und Uhrzeit fehlen.','err');
    const employee=empById(employeeId);if(employee&&!empEligible(employee,qual))return message($('#quick-msg'),'Der gewählte Mitarbeiter erfüllt die geforderte Qualifikation nicht.','err');
    setBusy(true);let created=0;const errors=[];
    try{
      for(let i=0;i<repeat;i++){
        const d=addDays(new Date(`${baseDate}T12:00:00`),i);
        const row=buildShiftRow({siteId,employeeId,date:localDate(d),startTime:start,endTime:end,title,qual,notes});
        const overlap=localOverlap(row);if(overlap){errors.push(`${localDate(d)}: Überschneidung`);continue}
        try{await AONE.insert('guard_shifts',row,false);created++}catch(err){errors.push(`${localDate(d)}: ${err.message}`)}
      }
      await loadWeek();
      if(created) message($('#quick-msg'),`${created} Schicht${created===1?'':'en'} eingetragen${errors.length?` · ${errors.length} nicht erstellt`:''}.`,'ok');
      if(!created&&errors.length) message($('#quick-msg'),errors[0],'err');
    }finally{setBusy(false)}
  }

  function openEdit(id){
    const s=state.shifts.find(x=>x.id===id);if(!s)return;
    const start=new Date(s.starts_at),end=new Date(s.ends_at);
    $('#e-id').value=s.id;$('#e-site').value=s.site_id;$('#e-date').value=localDate(start);$('#e-title').value=s.title;$('#e-start').value=localTime(start);$('#e-end').value=localTime(end);$('#e-qual').value=s.required_qualification;$('#e-status').value=s.status;$('#e-notes').value=s.notes||'';
    employeeOptionsForQual($('#e-employee'),s.required_qualification,s.employee_id||'');
    message($('#edit-msg'),'');openModal('#shift-modal');
  }

  async function saveEdit(e){
    e.preventDefault();message($('#edit-msg'),'');const id=$('#e-id').value;const siteId=$('#e-site').value,employeeId=$('#e-employee').value,qual=$('#e-qual').value;
    const employee=empById(employeeId);if(employee&&!empEligible(employee,qual))return message($('#edit-msg'),'Der Mitarbeiter erfüllt die geforderte Qualifikation nicht.','err');
    const row=buildShiftRow({siteId,employeeId,date:$('#e-date').value,startTime:$('#e-start').value,endTime:$('#e-end').value,title:$('#e-title').value,qual,notes:$('#e-notes').value,status:$('#e-status').value});
    delete row.org_id;delete row.created_by;
    setBusy(true);try{await AONE.update('guard_shifts',`id=eq.${encodeURIComponent(id)}&org_id=eq.${encodeURIComponent(state.ctx.org_id)}`,row);closeModal('#shift-modal');await loadWeek();AONE.toast('Schicht gespeichert.')}catch(err){message($('#edit-msg'),err.message,'err')}finally{setBusy(false)}
  }

  async function cancelShift(){
    const id=$('#e-id').value;if(!confirm('Diese Schicht wirklich stornieren?'))return;
    setBusy(true);try{await AONE.update('guard_shifts',`id=eq.${encodeURIComponent(id)}&org_id=eq.${encodeURIComponent(state.ctx.org_id)}`,{status:'canceled'});closeModal('#shift-modal');await loadWeek();AONE.toast('Schicht storniert.')}catch(err){message($('#edit-msg'),err.message,'err')}finally{setBusy(false)}
  }

  async function cloneShift(id,daysToAdd=1){
    const s=state.shifts.find(x=>x.id===id);if(!s)return;const start=addDays(new Date(s.starts_at),daysToAdd),end=addDays(new Date(s.ends_at),daysToAdd);
    const row={org_id:state.ctx.org_id,site_id:s.site_id,employee_id:s.employee_id,title:s.title,starts_at:start.toISOString(),ends_at:end.toISOString(),required_qualification:s.required_qualification,status:'planned',notes:s.notes,created_by:state.user.id};
    setBusy(true);try{await AONE.insert('guard_shifts',row,false);await loadWeek();AONE.toast('Schicht kopiert.')}catch(err){AONE.toast(err.message,'err')}finally{setBusy(false)}
  }

  async function confirmOne(id){
    setBusy(true);try{await AONE.update('guard_shifts',`id=eq.${encodeURIComponent(id)}&org_id=eq.${encodeURIComponent(state.ctx.org_id)}`,{status:'confirmed'});await loadWeek()}catch(err){AONE.toast(err.message,'err')}finally{setBusy(false)}
  }

  async function confirmWeek(){
    const planned=state.shifts.filter(s=>s.status==='planned');if(!planned.length)return AONE.toast('Keine geplanten Schichten zum Freigeben.','warn');
    if(!confirm(`${planned.length} geplante Schichten dieser Woche freigeben?`))return;
    setBusy(true);try{
      const from=state.weekStart.toISOString(),to=weekEnd().toISOString();
      await AONE.update('guard_shifts',`org_id=eq.${encodeURIComponent(state.ctx.org_id)}&status=eq.planned&starts_at=gte.${encodeURIComponent(from)}&starts_at=lt.${encodeURIComponent(to)}`,{status:'confirmed'});
      await loadWeek();AONE.toast('Woche freigegeben.');
    }catch(err){AONE.toast(err.message,'err')}finally{setBusy(false)}
  }

  async function copyWeek(){
    const source=state.shifts.filter(s=>s.status!=='canceled');if(!source.length)return AONE.toast('Diese Woche enthält keine Schichten.','warn');
    if(!confirm(`${source.length} Schichten in die nächste Woche kopieren? Bestehende Konflikte werden automatisch übersprungen.`))return;
    setBusy(true);let created=0,failed=0;
    try{
      for(const s of source){
        const row={org_id:state.ctx.org_id,site_id:s.site_id,employee_id:s.employee_id,title:s.title,starts_at:addDays(new Date(s.starts_at),7).toISOString(),ends_at:addDays(new Date(s.ends_at),7).toISOString(),required_qualification:s.required_qualification,status:'planned',notes:s.notes,created_by:state.user.id};
        try{await AONE.insert('guard_shifts',row,false);created++}catch{failed++}
      }
      AONE.toast(`${created} Schichten kopiert${failed?`, ${failed} übersprungen`:''}.`);
    }finally{setBusy(false)}
  }

  async function createSite(e){
    e.preventDefault();message($('#site-msg'),'');const name=$('#s-name').value.trim();if(!name)return;
    setBusy(true);try{
      const created=await AONE.insert('guard_sites',{org_id:state.ctx.org_id,name,customer_name:$('#s-customer').value.trim()||null,address:$('#s-address').value.trim()||null,active:true},true);
      await loadReferences();if(created?.[0]?.id)$('#q-site').value=created[0].id;closeModal('#site-modal');$('#site-form').reset();render();AONE.toast('Objekt angelegt.');
    }catch(err){message($('#site-msg'),err.message,'err')}finally{setBusy(false)}
  }

  function bind(){
    $('#quick-form').addEventListener('submit',createQuick);$('#edit-form').addEventListener('submit',saveEdit);$('#site-form').addEventListener('submit',createSite);
    document.querySelectorAll('.preset').forEach(b=>b.addEventListener('click',()=>{$('#q-start').value=b.dataset.start;$('#q-end').value=b.dataset.end}));
    $('#q-qual').addEventListener('change',()=>{const current=$('#q-employee').value;employeeOptionsForQual($('#q-employee'),$('#q-qual').value,current)});
    $('#e-qual').addEventListener('change',()=>{const current=$('#e-employee').value;employeeOptionsForQual($('#e-employee'),$('#e-qual').value,current)});
    $('#filter-site').addEventListener('change',render);$('#filter-employee').addEventListener('change',render);$('#show-canceled').addEventListener('change',render);
    $('#prev-week').onclick=async()=>{state.weekStart=addDays(state.weekStart,-7);await loadWeek()};$('#next-week').onclick=async()=>{state.weekStart=addDays(state.weekStart,7);await loadWeek()};$('#today-week').onclick=async()=>{state.weekStart=startOfWeek();await loadWeek()};
    $('#add-site').onclick=()=>{message($('#site-msg'),'');openModal('#site-modal')};$('#close-site').onclick=()=>closeModal('#site-modal');$('#close-edit').onclick=()=>closeModal('#shift-modal');$('#cancel-shift').onclick=cancelShift;$('#confirm-week').onclick=confirmWeek;$('#copy-week').onclick=copyWeek;
    $('#week-grid').addEventListener('click',e=>{const id=e.target.dataset.id;if(e.target.classList.contains('edit-shift'))openEdit(id);else if(e.target.classList.contains('copy-shift'))cloneShift(id,1);else if(e.target.classList.contains('confirm-shift'))confirmOne(id);else{const card=e.target.closest('.shift');if(card&&!e.target.closest('button'))openEdit(card.dataset.id)}});
    document.querySelectorAll('.planner-modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')}));
    $('#logout').onclick=()=>{AONE.signOut();location.replace('./admin-login.html')};
  }

  async function init(){
    setBusy(true);
    try{
      const session=await AONE.session();if(!session){location.replace('./admin-login.html');return}state.user=session.user;
      const ctx=await AONE.chooseContext();if(!ctx||!AONE.isManager(ctx.role)){location.replace('./admin-login.html');return}state.ctx=ctx;
      $('#org-name').textContent=ctx.org?.name||'Dienstplan';$('#who').textContent=ctx.role?AONE.roleLabel(ctx.role):'';
      state.weekStart=startOfWeek();$('#q-date').value=localDate(new Date());bind();await loadReferences();employeeOptionsForQual($('#q-employee'),'none','');await loadWeek();
    }catch(err){message($('#planner-msg'),err.message||'Dienstplan konnte nicht geladen werden.','err')}finally{setBusy(false)}
  }
  init();
})();
