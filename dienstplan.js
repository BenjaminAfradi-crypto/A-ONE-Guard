(()=>{
  const $=s=>document.querySelector(s);
  const state={ctx:null,user:null,employees:[],sites:[],shifts:[],weekStart:null,loading:false,minRestMinutes:660};
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
  function staffingAt(shift){
    if(!shift||shift.status==='canceled')return null;
    const site=siteById(shift.site_id),required=Math.max(1,Number(site?.minimum_staff||1));
    const start=+new Date(shift.starts_at),end=+new Date(shift.ends_at);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return {required,assigned:0,under:true};
    const candidates=state.shifts.filter(s=>s.status!=='canceled'&&s.site_id===shift.site_id&&s.employee_id&&+new Date(s.starts_at)<end&&+new Date(s.ends_at)>start);
    const boundaries=[start,end];
    for(const s of candidates){
      boundaries.push(Math.max(start,+new Date(s.starts_at)),Math.min(end,+new Date(s.ends_at)));
    }
    const points=[...new Set(boundaries)].sort((a,b)=>a-b);
    let assigned=Infinity;
    for(let i=0;i<points.length-1;i++){
      if(points[i+1]<=points[i])continue;
      const midpoint=(points[i]+points[i+1])/2;
      const count=new Set(candidates.filter(s=>+new Date(s.starts_at)<=midpoint&&+new Date(s.ends_at)>midpoint).map(s=>s.employee_id)).size;
      assigned=Math.min(assigned,count);
    }
    if(!Number.isFinite(assigned))assigned=0;
    return {required,assigned,under:assigned<required};
  }
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
    const [employees,sites,organizations]=await Promise.all([
      AONE.tableAll('guard_employees',`select=id,display_name,employee_no,email,qualification_level,status&org_id=eq.${encodeURIComponent(org)}&status=eq.active&order=display_name.asc`),
      AONE.table('guard_sites',`select=id,name,customer_name,address,active,minimum_staff&org_id=eq.${encodeURIComponent(org)}&active=eq.true&order=name.asc`),
      AONE.table('guard_organizations',`select=id,min_rest_minutes&id=eq.${encodeURIComponent(org)}&limit=1`)
    ]);
    state.employees=employees||[];state.sites=sites||[];
    state.minRestMinutes=Math.max(0,Number(organizations?.[0]?.min_rest_minutes??660));
    fillSelects();
  }

  async function loadWeek(){
    const from=state.weekStart.toISOString(),to=weekEnd().toISOString();
    state.shifts=await AONE.tableAll('guard_shifts',`select=id,site_id,employee_id,title,starts_at,ends_at,required_qualification,status,notes,created_at&org_id=eq.${encodeURIComponent(state.ctx.org_id)}&starts_at=gte.${encodeURIComponent(from)}&starts_at=lt.${encodeURIComponent(to)}&order=starts_at.asc`)||[];
    render();
  }

  function filteredShifts(){
    const site=$('#filter-site').value,emp=$('#filter-employee').value,showCanceled=$('#show-canceled').checked;
    return state.shifts.filter(s=>(!site||s.site_id===site)&&(!emp||s.employee_id===emp)&&(showCanceled||s.status!=='canceled'));
  }

  function shiftCard(s){
    const start=new Date(s.starts_at),end=new Date(s.ends_at),site=siteById(s.site_id),emp=empById(s.employee_id),staffing=staffingAt(s);
    const employee=emp?esc(emp.display_name):'Unbesetzt';
    return `<article class="shift ${esc(s.status)} ${s.employee_id?'':'unassigned'}" data-id="${s.id}">
      <div class="shift-time">${localTime(start)}–${localTime(end)}</div>
      <div class="shift-site"><b>${esc(site?.name||'Objekt')}</b>${s.title&&s.title!==(site?.name||'')?` · ${esc(s.title)}`:''}</div>
      <div class="shift-employee">${employee}</div>
      <div class="shift-meta"><span class="tag">${esc(statusLabel[s.status]||s.status)}</span>${s.required_qualification!=='none'?`<span class="tag">${esc(qualLabel[s.required_qualification]||s.required_qualification)}</span>`:''}${staffing?.under?`<span class="tag">Unterbesetzt ${staffing.assigned}/${staffing.required}</span>`:''}<span class="tag">${durationHours(s).toFixed(1).replace('.0','')} h</span></div>
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
    const underfilled=visible.filter(s=>staffingAt(s)?.under).length;
    $('#stats').innerHTML=`<span class="stat">${visible.filter(s=>s.status!=='canceled').length} Schichten</span><span class="stat">${totalHours.toFixed(1).replace('.0','')} Std.</span><span class="stat">${unassigned} unbesetzt</span>${underfilled?`<span class="stat">${underfilled} unterbesetzt</span>`:''}`;
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
    if(!date||!startTime||!endTime||startTime===endTime)throw new Error('Bitte unterschiedliche Start- und Endzeiten angeben.');
    const start=makeDate(date,startTime);let end=makeDate(date,endTime);if(end<=start)end=addDays(end,1);
    const site=siteById(siteId);
    return {org_id:state.ctx.org_id,site_id:siteId,employee_id:employeeId||null,title:(title||site?.name||'Schicht').trim(),starts_at:start.toISOString(),ends_at:end.toISOString(),required_qualification:qual||'none',status,notes:notes?.trim()||null,created_by:state.user.id};
  }

  // Calendar-day absence/qualification rules use the planner's local timezone.
  function shiftDays(row){
    const start=new Date(row.starts_at),end=new Date(row.ends_at);
    if(!Number.isFinite(+start)||!Number.isFinite(+end)||end<=start)throw new Error('Ungültiger Dienstzeitraum.');
    return {first:localDate(start),last:localDate(new Date(+end-1))};
  }

  async function checkAssignment(row){
    const {first,last}=shiftDays(row),org=encodeURIComponent(state.ctx.org_id);
    const sites=await AONE.table('guard_sites',`select=id,active&org_id=eq.${org}&id=eq.${encodeURIComponent(row.site_id)}&limit=1`);
    if(!Array.isArray(sites)||sites.length!==1||!sites[0].active)throw new Error('Objekt ist nicht aktiv oder nicht verfügbar.');
    if(!row.employee_id)return;
    const employee=encodeURIComponent(row.employee_id);
    const [employees,leaves,requirements,qualifications]=await Promise.all([
      AONE.table('guard_employees',`select=id,status,qualification_level&org_id=eq.${org}&id=eq.${employee}&limit=1`),
      AONE.tableAll('guard_leave_requests',`select=id,kind,status,starts_on,ends_on&org_id=eq.${org}&employee_id=eq.${employee}&starts_on=lte.${last}&ends_on=gte.${first}`),
      AONE.tableAll('guard_compliance_requirements',`select=id,site_id,requirement_type,requirement_key,label,active,mandatory&org_id=eq.${org}&active=eq.true&mandatory=eq.true&requirement_type=eq.qualification`),
      AONE.tableAll('guard_qualifications',`select=id,kind,valid_from,valid_until,verified_at&org_id=eq.${org}&employee_id=eq.${employee}`)
    ]);
    if(!Array.isArray(employees)||employees.length!==1||employees[0].status!=='active')throw new Error('Mitarbeiter ist nicht aktiv oder nicht verfügbar.');
    if(!empEligible(employees[0],row.required_qualification))throw new Error('Die geforderte Qualifikationsstufe ist nicht erfüllt.');
    const absence=leaves.find(l=>l.status==='approved'||(l.kind==='sick'&&l.status==='pending'));
    if(absence)throw new Error(`${absence.kind==='sick'?'Krankmeldung':'Genehmigte Abwesenheit'}: ${absence.starts_on} bis ${absence.ends_on}. Bitte anders besetzen.`);
    for(const requirement of requirements.filter(r=>!r.site_id||r.site_id===row.site_id)){
      const valid=qualifications.some(q=>q.kind===requirement.requirement_key&&q.verified_at&&
        (!q.valid_from||(/^\d{4}-\d{2}-\d{2}$/.test(q.valid_from)&&q.valid_from<=first))&&
        (!q.valid_until||(/^\d{4}-\d{2}-\d{2}$/.test(q.valid_until)&&q.valid_until>=last)));
      if(!valid)throw new Error(`Pflichtnachweis „${requirement.label||requirement.requirement_key}“ fehlt, ist ungeprüft oder deckt den Dienstzeitraum nicht ab.`);
    }
  }

  async function checkConflict(row,excludeId=''){
    if(row.status==='canceled')return;
    if(row.status==='confirmed'&&!row.employee_id)throw new Error('Unbesetzte Dienste können nicht freigegeben werden.');
    await checkAssignment(row);
    if(!row.employee_id)return;

    const start=new Date(row.starts_at),end=new Date(row.ends_at);
    const restMinutes=Math.max(0,Number(state.minRestMinutes||0)),restMs=restMinutes*60000;
    const query=new URLSearchParams({
      select:'id,title,starts_at,ends_at',
      org_id:`eq.${state.ctx.org_id}`,
      employee_id:`eq.${row.employee_id}`,
      status:'neq.canceled',
      starts_at:`lt.${new Date(+end+restMs).toISOString()}`,
      ends_at:`gt.${new Date(+start-restMs).toISOString()}`,
      order:'starts_at.asc'
    });
    if(excludeId)query.set('id',`neq.${excludeId}`);
    const matches=await AONE.tableAll('guard_shifts',query.toString());
    if(!Array.isArray(matches))throw new Error('Konfliktprüfung nicht möglich. Bitte erneut versuchen.');

    for(const s of matches){
      const a=new Date(s.starts_at),b=new Date(s.ends_at);
      if(a<end&&b>start){
        throw new Error(`Überschneidung: ${fmtDate(a)} ${localTime(a)} bis ${fmtDate(b)} ${localTime(b)}. Bitte einen anderen Mitarbeiter oder Zeitraum wählen.`);
      }
      const gapMs=a>=end?a-end:start-b;
      if(gapMs<restMs){
        const gapMinutes=Math.max(0,Math.floor(gapMs/60000));
        const h=Math.floor(gapMinutes/60),m=gapMinutes%60;
        const actual=`${h} Std.${m?` ${m} Min.`:''}`;
        const minH=Math.floor(restMinutes/60),minM=restMinutes%60;
        const required=`${minH} Std.${minM?` ${minM} Min.`:''}`;
        throw new Error(`Ruhezeit unterschritten: ${actual} statt mindestens ${required}. Bitte den Dienst verschieben oder anders besetzen.`);
      }
    }
  }

  function quickDates(){
    const base=$('#q-date').value,mode=$('#q-repeat').value;
    if(!base)throw new Error('Bitte ein Startdatum wählen.');
    const start=new Date(`${base}T12:00:00`);
    if(mode!=='custom')return Array.from({length:Number(mode)},(_,i)=>localDate(addDays(start,i)));
    const until=$('#q-until').value;
    if(!until||until<base)throw new Error('Das Enddatum muss am oder nach dem Startdatum liegen.');
    const last=new Date(`${until}T12:00:00`);
    if(last>addDays(start,90))throw new Error('Bitte höchstens 91 Kalendertage auf einmal planen.');
    const weekdays=[...document.querySelectorAll('[name="q-weekday"]:checked')].map(el=>Number(el.value));
    if(!weekdays.length)throw new Error('Bitte mindestens einen Wochentag wählen.');
    const dates=[];
    for(let d=start;d<=last;d=addDays(d,1))if(weekdays.includes(d.getDay()))dates.push(localDate(d));
    if(!dates.length)throw new Error('Im Zeitraum liegt keiner der gewählten Wochentage.');
    return dates;
  }

  function quickPreview(){
    const custom=$('#q-repeat').value==='custom';
    $('#recurrence').hidden=!custom;$('#q-until').required=custom;$('#q-until').disabled=!custom;$('#q-until').min=$('#q-date').value;
    try{
      const dates=quickDates(),start=$('#q-start').value,end=$('#q-end').value;
      if(!start||!end)throw new Error('Bitte Start- und Endzeit angeben.');
      if(start===end)throw new Error('Start- und Endzeit müssen verschieden sein.');
      $('#quick-preview').textContent=`${dates.length} Schicht${dates.length===1?'':'en'} · ${fmtDate(new Date(dates[0]+'T12:00:00'))}${dates.length>1?' bis '+fmtDate(new Date(dates.at(-1)+'T12:00:00')):''} · ${start}–${end}${end<start?' (Ende am Folgetag)':''}`;
    }catch(err){$('#quick-preview').textContent=err.message}
  }

  function batchResult(el,created,errors){
    message(el,`${created} Schicht${created===1?'':'en'} gespeichert${errors.length?` · ${errors.length} nicht gespeichert`:''}.`,created?'ok':'err');
    if(errors.length)el.insertAdjacentHTML('beforeend',`<details open><summary>Nicht gespeicherte Schichten</summary><ul>${errors.map(error=>`<li>${esc(error)}</li>`).join('')}</ul></details>`);
  }

  async function refreshWeek(){
    try{await loadWeek()}catch(err){message($('#planner-msg'),`Ansicht konnte nicht aktualisiert werden: ${err.message}. Bitte die Woche erneut laden.`,'err')}
  }

  async function navigateWeek(date){
    if(state.loading)return;
    const previous=state.weekStart;setBusy(true);state.weekStart=date;
    try{await loadWeek()}catch(err){state.weekStart=previous;message($('#planner-msg'),err.message,'err')}finally{setBusy(false)}
  }

  async function createQuick(e){
    e.preventDefault();if(state.loading)return;message($('#quick-msg'),'');
    const siteId=$('#q-site').value;if(!siteId)return message($('#quick-msg'),'Bitte ein Objekt auswählen.','err');
    const employeeId=$('#q-employee').value,baseDate=$('#q-date').value,start=$('#q-start').value,end=$('#q-end').value,qual=$('#q-qual').value,title=$('#q-title').value,notes=$('#q-notes').value;
    if(!baseDate||!start||!end)return message($('#quick-msg'),'Datum und Uhrzeit fehlen.','err');
    if(start===end)return message($('#quick-msg'),'Start- und Endzeit müssen verschieden sein.','err');
    let dates;try{dates=quickDates()}catch(err){return message($('#quick-msg'),err.message,'err')}
    const employee=empById(employeeId);if(employee&&!empEligible(employee,qual))return message($('#quick-msg'),'Der gewählte Mitarbeiter erfüllt die geforderte Qualifikation nicht.','err');
    setBusy(true);let created=0;const errors=[];
    try{
      for(const date of dates){
        try{
          const row=buildShiftRow({siteId,employeeId,date,startTime:start,endTime:end,title,qual,notes});
          await checkConflict(row);await AONE.insert('guard_shifts',row,false);created++;
        }catch(err){errors.push(`${date}: ${err.message}`)}
      }
      if(created)state.weekStart=startOfWeek(new Date(dates[0]+'T12:00:00'));
      await refreshWeek();batchResult($('#quick-msg'),created,errors);
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
    e.preventDefault();if(state.loading)return;message($('#edit-msg'),'');const id=$('#e-id').value;const siteId=$('#e-site').value,employeeId=$('#e-employee').value,qual=$('#e-qual').value;
    const employee=empById(employeeId);if(employee&&!empEligible(employee,qual))return message($('#edit-msg'),'Der Mitarbeiter erfüllt die geforderte Qualifikation nicht.','err');
    if($('#e-start').value===$('#e-end').value)return message($('#edit-msg'),'Start- und Endzeit müssen verschieden sein.','err');
    const row=buildShiftRow({siteId,employeeId,date:$('#e-date').value,startTime:$('#e-start').value,endTime:$('#e-end').value,title:$('#e-title').value,qual,notes:$('#e-notes').value,status:$('#e-status').value});
    delete row.org_id;delete row.created_by;
    setBusy(true);try{await checkConflict(row,id);await AONE.update('guard_shifts',`id=eq.${encodeURIComponent(id)}&org_id=eq.${encodeURIComponent(state.ctx.org_id)}`,row);closeModal('#shift-modal');await refreshWeek();AONE.toast('Schicht gespeichert.')}catch(err){message($('#edit-msg'),err.message,'err')}finally{setBusy(false)}
  }

  async function cancelShift(){
    const id=$('#e-id').value;if(!confirm('Diese Schicht wirklich stornieren?'))return;
    setBusy(true);try{await AONE.update('guard_shifts',`id=eq.${encodeURIComponent(id)}&org_id=eq.${encodeURIComponent(state.ctx.org_id)}`,{status:'canceled'});closeModal('#shift-modal');await loadWeek();AONE.toast('Schicht storniert.')}catch(err){message($('#edit-msg'),err.message,'err')}finally{setBusy(false)}
  }

  async function cloneShift(id,daysToAdd=1){
    if(state.loading)return;
    const s=state.shifts.find(x=>x.id===id);if(!s)return;const start=addDays(new Date(s.starts_at),daysToAdd),end=addDays(new Date(s.ends_at),daysToAdd);
    const row={org_id:state.ctx.org_id,site_id:s.site_id,employee_id:s.employee_id,title:s.title,starts_at:start.toISOString(),ends_at:end.toISOString(),required_qualification:s.required_qualification,status:'planned',notes:s.notes,created_by:state.user.id};
    setBusy(true);try{await checkConflict(row);await AONE.insert('guard_shifts',row,false);state.weekStart=startOfWeek(start);await refreshWeek();AONE.toast('Schicht kopiert.')}catch(err){AONE.toast(err.message,'err')}finally{setBusy(false)}
  }

  async function releaseShift(id){
    const org=encodeURIComponent(state.ctx.org_id);
    const rows=await AONE.table('guard_shifts',`select=*&org_id=eq.${org}&id=eq.${encodeURIComponent(id)}&limit=1`);
    if(!Array.isArray(rows)||rows.length!==1||rows[0].status!=='planned')throw new Error('Dienst wurde geändert oder ist nicht mehr geplant. Bitte neu laden.');
    const row=rows[0];
    if(!row.employee_id)throw new Error('Unbesetzte Dienste können nicht freigegeben werden.');
    await checkConflict(row,id);
    // Optimistic guard: do not release a different assignment edited during validation.
    const query=new URLSearchParams({id:`eq.${id}`,org_id:`eq.${state.ctx.org_id}`,status:'eq.planned',employee_id:`eq.${row.employee_id}`,site_id:`eq.${row.site_id}`,starts_at:`eq.${row.starts_at}`,ends_at:`eq.${row.ends_at}`,required_qualification:row.required_qualification==null?'is.null':`eq.${row.required_qualification}`});
    const saved=await AONE.update('guard_shifts',query.toString(),{status:'confirmed'});
    if(!Array.isArray(saved)||saved.length!==1)throw new Error('Freigabe nicht bestätigt: Dienst oder Berechtigung wurde geändert. Bitte neu laden.');
  }

  async function confirmOne(id){
    if(state.loading)return;setBusy(true);
    try{await releaseShift(id);await refreshWeek();AONE.toast('Dienst freigegeben.');}
    catch(err){message($('#planner-msg'),err.message,'err');AONE.toast(err.message,'err');}
    finally{setBusy(false)}
  }

  async function confirmWeek(){
    if(state.loading)return;
    const planned=state.shifts.filter(s=>s.status==='planned');if(!planned.length)return AONE.toast('Keine geplanten Schichten zum Freigeben.','warn');
    if(!confirm(`${planned.length} geplante Schichten prüfen und freigeben? Konflikte bleiben ungeändert.`))return;
    setBusy(true);let released=0;const errors=[];
    try{
      for(const row of planned){
        try{await releaseShift(row.id);released++;}
        catch(err){errors.push(`${fmtDate(new Date(row.starts_at))} · ${row.title}: ${err.message}`);}
      }
      await refreshWeek();
      message($('#planner-msg'),`${released} Dienste freigegeben · ${errors.length} nicht freigegeben.`,errors.length?'err':'ok');
      if(errors.length)$('#planner-msg').insertAdjacentHTML('beforeend',`<details open><summary>Bitte prüfen</summary><ul>${errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>`);
    }finally{setBusy(false)}
  }

  async function copyWeek(){
    if(state.loading)return;
    const source=state.shifts.filter(s=>s.status!=='canceled');if(!source.length)return AONE.toast('Diese Woche enthält keine Schichten.','warn');
    if(!confirm(`${source.length} Schichten in die nächste Woche kopieren? Bestehende Konflikte werden automatisch übersprungen.`))return;
    setBusy(true);let created=0;const errors=[];
    try{
      for(const s of source){
        const row={org_id:state.ctx.org_id,site_id:s.site_id,employee_id:s.employee_id,title:s.title,starts_at:addDays(new Date(s.starts_at),7).toISOString(),ends_at:addDays(new Date(s.ends_at),7).toISOString(),required_qualification:s.required_qualification,status:'planned',notes:s.notes,created_by:state.user.id};
        try{await checkConflict(row);await AONE.insert('guard_shifts',row,false);created++}catch(err){errors.push(`${fmtDate(new Date(row.starts_at))} · ${s.title}: ${err.message}`)}
      }
      if(created)state.weekStart=addDays(state.weekStart,7);
      await refreshWeek();batchResult($('#quick-msg'),created,errors);
    }finally{setBusy(false)}
  }

  function openPlanningSettings(){
    if(!['owner','admin'].includes(state.ctx?.role))return;
    const hours=state.minRestMinutes/60;
    $('#f-rest-hours').value=Number.isInteger(hours)?String(hours):hours.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
    $('#rest-rule-preview').textContent=`${state.minRestMinutes} Minuten · ${hours.toLocaleString('de-DE',{maximumFractionDigits:2})} Stunden`;
    message($('#settings-msg'),'');
    openModal('#settings-modal');
  }

  async function savePlanningSettings(e){
    e.preventDefault();
    if(!['owner','admin'].includes(state.ctx?.role))return message($('#settings-msg'),'Nur Inhaber/Admin dürfen die Planungsregeln ändern.','err');
    const hours=Number($('#f-rest-hours').value);
    if(!Number.isFinite(hours)||hours<0||hours>24)return message($('#settings-msg'),'Bitte 0 bis 24 Stunden angeben.','err');
    const minutes=Math.round(hours*60);
    setBusy(true);
    try{
      const saved=await AONE.update('guard_organizations',`id=eq.${encodeURIComponent(state.ctx.org_id)}`,{min_rest_minutes:minutes});
      if(!Array.isArray(saved)||saved.length!==1)throw new Error('Planungsregel wurde nicht bestätigt.');
      state.minRestMinutes=minutes;
      closeModal('#settings-modal');
      AONE.toast(`Mindestruhezeit auf ${hours.toLocaleString('de-DE',{maximumFractionDigits:2})} Stunden gesetzt.`);
    }catch(err){message($('#settings-msg'),err.message,'err')}finally{setBusy(false)}
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
    document.querySelectorAll('.preset').forEach(b=>b.addEventListener('click',()=>{$('#q-start').value=b.dataset.start;$('#q-end').value=b.dataset.end;quickPreview()}));
    $('#quick-form').addEventListener('input',quickPreview);
    $('#quick-form').addEventListener('change',quickPreview);
    $('#q-qual').addEventListener('change',()=>{const current=$('#q-employee').value;employeeOptionsForQual($('#q-employee'),$('#q-qual').value,current)});
    $('#e-qual').addEventListener('change',()=>{const current=$('#e-employee').value;employeeOptionsForQual($('#e-employee'),$('#e-qual').value,current)});
    $('#filter-site').addEventListener('change',render);$('#filter-employee').addEventListener('change',render);$('#show-canceled').addEventListener('change',render);
    $('#prev-week').onclick=()=>navigateWeek(addDays(state.weekStart,-7));$('#next-week').onclick=()=>navigateWeek(addDays(state.weekStart,7));$('#today-week').onclick=()=>navigateWeek(startOfWeek());
    $('#add-site').onclick=()=>{message($('#site-msg'),'');openModal('#site-modal')};$('#close-site').onclick=()=>closeModal('#site-modal');$('#close-edit').onclick=()=>closeModal('#shift-modal');$('#cancel-shift').onclick=cancelShift;$('#confirm-week').onclick=confirmWeek;$('#copy-week').onclick=copyWeek;
    $('#planning-settings').onclick=openPlanningSettings;$('#close-settings').onclick=()=>closeModal('#settings-modal');$('#settings-form').onsubmit=savePlanningSettings;
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
      $('#planning-settings').hidden=!['owner','admin'].includes(ctx.role);
      state.weekStart=startOfWeek();$('#q-date').value=localDate(new Date());$('#q-until').value=localDate(addDays(new Date(),27));bind();quickPreview();await loadReferences();employeeOptionsForQual($('#q-employee'),'none','');await loadWeek();
    }catch(err){message($('#planner-msg'),err.message||'Dienstplan konnte nicht geladen werden.','err')}finally{setBusy(false)}
  }
  init();
})();
