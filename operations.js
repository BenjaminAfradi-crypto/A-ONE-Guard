(async () => {
  'use strict';
  const M=GuardUI, {$,esc,state,rows,insert,update,field,options,button,card,badges,empty,label,date}=M;
  const module=document.body.dataset.module;
  const data={};let render=()=>{},act=async()=>{},load=async()=>{};
  const selected={search:'',status:'',site:''};
  const statuses=values=>values.map(value=>({value,label:label(value)}));
  const details=entries=>`<dl>${entries.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
  const grid=cards=>`<div class="module-grid">${cards.join('')}</div>`;
  const content=html=>{$('#module-content').innerHTML=html;};
  const nullable=value=>String(value||'').trim()||null;
  const ownEmployee=()=>{if(!state.employee)throw new Error('Für dieses Konto ist noch kein Mitarbeiterprofil hinterlegt.');return state.employee.id;};
  const refFields=(record={},employeeKey='employee_id')=>field('site_id','Objekt','select',options(state.sites,record.site_id,'Ohne Objekt'))+field(employeeKey,'Verantwortlicher Mitarbeiter','select',options(state.employees.filter(e=>e.status==='active'),record[employeeKey],'Nicht zugewiesen'));
  function filtered(items,searchKeys=['title','description']) {return items.filter(row=>(!selected.status||row.status===selected.status)&&(!selected.site||row.site_id===selected.site)&&(!selected.search||searchKeys.some(key=>String(row[key]||'').toLocaleLowerCase('de').includes(selected.search.toLocaleLowerCase('de')))));}
  function controls(html='',filterStatuses=[]) {
    $('#module-controls').innerHTML=`<div class="module-actions">${html}</div><div class="module-toolbar">${field('search','Suchen','search',selected.search)}${field('filter-site','Objekt','select',options(state.sites,selected.site,'Alle Objekte'))}${filterStatuses.length?field('filter-status','Status','select',options(statuses(filterStatuses),selected.status,'Alle Status')):''}</div>`;
    $('#field-search').oninput=e=>{selected.search=e.target.value;render()};
    $('#field-filter-site').onchange=e=>{selected.site=e.target.value;render()};
    if($('#field-filter-status'))$('#field-filter-status').onchange=e=>{selected.status=e.target.value;render()};
  }
  const taskCard=t=>card(t.title,`${badges([label(t.priority),label(t.status)])}${details([['Objekt',M.site(t.site_id)],['Verantwortlich',M.employee(t.employee_id)],['Fällig',date(t.due_at)]])}<p>${esc(t.description)}</p>${t.completion_note?`<p>Rückmeldung: ${esc(t.completion_note)}</p>`:''}`,`${module==='quality'?button('Bearbeiten','edit-task',t.id):''}${!['done','canceled'].includes(t.status)?button('Erledigen','complete-task',t.id,'primary'):''}`);
  function taskEditor(id='') {
    const t=data.tasks.find(x=>x.id===id)||{};
    M.dialog(id?'Aufgabe bearbeiten':'Neue Aufgabe',field('title','Aufgabe','text',t.title,'required maxlength="180"')+field('description','Beschreibung','textarea',t.description)+refFields(t)+field('due_at','Fällig am','datetime-local',M.localInput(t.due_at))+field('priority','Priorität','select',options(statuses(['low','normal','high','critical']),t.priority||'normal')),
      async f=>{const row={title:f.get('title').trim(),description:nullable(f.get('description')),site_id:f.get('site_id')||null,employee_id:f.get('employee_id')||null,due_at:M.iso(f.get('due_at')),priority:f.get('priority')};if(!row.title)throw new Error('Bitte eine Aufgabe eingeben.');if(id)await update('guard_tasks',id,row);else await insert('guard_tasks',row);});
  }
  function completeTask(id) {
    M.dialog('Aufgabe abschließen',field('note','Rückmeldung','textarea',''),async f=>{await AONE.rpc('guard_complete_task',{p_task:id,p_note:nullable(f.get('note'))});},{submit:'Als erledigt speichern'});
  }
  function qualityEditor(id='') {
    const q=data.audits.find(x=>x.id===id)||{};
    M.dialog(id?'Prüfung bearbeiten':'Qualitätsprüfung',field('title','Prüfung','text',q.title,'required maxlength="180"')+refFields(q,'responsible_employee_id')+field('performed_at','Prüfzeitpunkt','datetime-local',M.localInput(q.performed_at||new Date()),'required')+field('score_percent','Ergebnis in Prozent','number',q.score_percent??'','min="0" max="100" step="0.1"')+field('findings','Feststellungen','textarea',q.findings)+field('corrective_actions','Maßnahmen','textarea',q.corrective_actions)+field('due_on','Nachkontrolle bis','date',q.due_on)+field('status','Status','select',options(statuses(['open','follow_up','closed']),q.status||'open')),
      async f=>{const row={title:f.get('title').trim(),site_id:f.get('site_id')||null,responsible_employee_id:f.get('responsible_employee_id')||null,performed_at:M.iso(f.get('performed_at')),score_percent:f.get('score_percent')===''?null:Number(f.get('score_percent')),findings:nullable(f.get('findings')),corrective_actions:nullable(f.get('corrective_actions')),due_on:f.get('due_on')||null,status:f.get('status')};if(!row.title)throw new Error('Bitte eine Bezeichnung eingeben.');if(id)await update('guard_quality_audits',id,row);else await insert('guard_quality_audits',row);});
  }
  if(['quality','meine-aufgaben'].includes(module)) {
    load=async()=>{
      data.tasks=await rows('guard_tasks',module==='meine-aufgaben'?{employee_id:`eq.${ownEmployee()}`,order:'due_at.asc.nullslast,id.asc'}:{order:'due_at.asc.nullslast,id.asc'});
      if(module==='quality')data.audits=await rows('guard_quality_audits',{order:'performed_at.desc,id.asc'});
    };
    render=()=>{
      const tasks=filtered(data.tasks);
      let html=(module==='quality'?'<h2>Aufgaben</h2>':'')+(tasks.length?grid(tasks.map(taskCard)):empty('Keine passenden Aufgaben.'));
      if(module==='quality'){
        const audits=filtered(data.audits,['title','findings','corrective_actions']);
        html+='<h2>Qualitätsprüfungen</h2>'+(audits.length?grid(audits.map(q=>card(q.title,badges([label(q.status),q.score_percent==null?'Ohne Bewertung':`${q.score_percent} %`])+details([['Objekt',M.site(q.site_id)],['Prüfung',date(q.performed_at)],['Nachkontrolle',q.due_on||'–']])+`<p>${esc(q.findings)}</p><p>${esc(q.corrective_actions)}</p>`,button('Bearbeiten','edit-audit',q.id)))):empty('Noch keine passenden Qualitätsprüfungen.'));
      }
      content(html);
    };
    act=async(action,id)=>{if(action==='new-task')taskEditor();if(action==='edit-task')taskEditor(id);if(action==='complete-task')completeTask(id);if(action==='new-audit')qualityEditor();if(action==='edit-audit')qualityEditor(id);};
  }

  if(module==='modules') {
    load=async()=>{};
    render=()=>{
      const groups=[['Mein Dienst',[['app','Heute & Zeiterfassung'],['einsatz','Einsatz & Wachbuch'],['meine-aufgaben','Meine Aufgaben'],['meine-formulare','Meine Formulare'],['lone-worker','Sicherheits-Check-in'],['mein-dienstausch','Dienste tauschen'],['meine-dokumente','Meine Dokumente'],['mein-fahrtenbuch','Mein Fahrtenbuch'],['lernwelt','Lernwelt'],['pflichtschulungen','Pflichtschulungen'],['meine-compliance','Meine Nachweise'],['meine-ausruestung','Meine Ausrüstung']]]];
      if(AONE.isManager(state.ctx.role))groups.push(
        ['Personal & Planung',[['admin','Command Center'],['mitarbeiter','Mitarbeiter'],['personalakte','Personalakten'],['dienstplan','Dienstplan'],['arbeitszeiten','Arbeitszeiten'],['dienstausch-admin','Dienstausch-Freigabe'],['recruiting','Recruiting'],['hr-workflows','Onboarding'],['compliance','Compliance']]],
        ['Einsatz & Kontrolle',[['objekte','Objekte'],['security-ops','Wachbuch, WKS & Vorfälle'],['live-operations','Live Operations'],['escalations','Eskalationen'],['quality','Qualität & Aufgaben'],['forms-admin','Formularbaukasten'],['equipment','Ausrüstung & Schlüssel'],['fuhrpark','Fuhrpark'],['fahrtenbuch','Fahrtenbuch'],['waffen','Waffenverwaltung'],['nfc-admin','NFC-Tags']]],
        ['Steuerung & Auswertung',[['commercial','Kunden, Angebote & Verträge'],['payroll','Lohnvorbereitung'],['reporting','Berichte & Archive'],['proof-service','Leistungsnachweise'],['intelligence','Betriebsübersicht'],['automation','Automatische Regeln'],['developer-platform','API-Schnittstellen'],['documents','Dokumentenzentrale'],['kundenportal-admin','Kundenportal verwalten'],['lernwelt-admin','Lernwelt verwalten'],['schulungen-admin','Schulungen zuweisen']]]);
      content(groups.map(([title,links])=>`<section><h2>${esc(title)}</h2><div class="module-grid">${links.filter(([,name])=>name.toLowerCase().includes(selected.search.toLowerCase())).map(([url,name])=>`<a class="card module-card" href="./${url}.html"><h3>${esc(name)}</h3><span class="muted">Öffnen →</span></a>`).join('')}</div></section>`).join(''));
    };
  }

  function templateEditor(id='') {
    const t=data.templates.find(x=>x.id===id)||{};
    let fields=structuredClone(t.fields||[{key:'field_'+crypto.randomUUID().replaceAll('-',''),label:'Kontrolle durchgeführt',type:'checkbox',required:true}]);
    function drawFields(root){
      $('#builder-fields',root).innerHTML=fields.map((f,i)=>`<div class="builder-field" data-index="${i}"><label class="module-field">Feldbezeichnung<input class="input" data-prop="label" value="${esc(f.label)}" required maxlength="180"></label><div class="module-inline"><label class="module-field">Feldtyp<select class="input" data-prop="type">${['text','textarea','number','date','checkbox','select'].map(type=>`<option value="${type}" ${f.type===type?'selected':''}>${esc(({text:'Kurzer Text',textarea:'Langer Text',number:'Zahl',date:'Datum',checkbox:'Bestätigung',select:'Auswahl'})[type])}</option>`).join('')}</select></label><label class="check-field"><input type="checkbox" data-prop="required" ${f.required?'checked':''}>Pflichtfeld</label></div><label class="module-field" ${f.type==='select'?'':'hidden'}>Auswahlmöglichkeiten, eine pro Zeile<textarea class="input" data-prop="options">${esc((f.options||[]).join('\n'))}</textarea></label><button class="btn small" type="button" data-remove-field="${i}">Feld entfernen</button></div>`).join('');
      root.querySelectorAll('[data-prop]').forEach(input=>input.onchange=e=>{
        const i=Number(e.target.closest('[data-index]').dataset.index),prop=e.target.dataset.prop;
        fields[i][prop]=prop==='required'?e.target.checked:prop==='options'?e.target.value.split('\n').map(x=>x.trim()).filter(Boolean):e.target.value;
        if(prop==='type')drawFields(root);
      });
      root.querySelectorAll('[data-remove-field]').forEach(b=>b.onclick=()=>{fields.splice(Number(b.dataset.removeField),1);drawFields(root)});
    }
    M.dialog(id?'Formular bearbeiten':'Formular erstellen',field('name','Name','text',t.name,'required maxlength="180"')+field('description','Hinweise','textarea',t.description)+field('site_id','Objektbindung','select',options(state.sites,t.site_id,'Für alle Objekte'))+'<div id="builder-fields"></div><button class="btn" id="add-field" type="button">+ Feld hinzufügen</button>',
      async f=>{
        if(!fields.length||fields.length>50)throw new Error('Bitte 1 bis 50 Felder anlegen.');
        for(const item of fields){if(!item.label.trim())throw new Error('Jedes Feld benötigt eine Bezeichnung.');if(item.type==='select'&&!item.options?.length)throw new Error('Bitte Auswahlmöglichkeiten eintragen.');}
        const row={name:f.get('name').trim(),description:nullable(f.get('description')),site_id:f.get('site_id')||null,fields};
        if(!row.name)throw new Error('Bitte einen Namen eingeben.');if(id)await update('guard_form_templates',id,row);else await insert('guard_form_templates',row);
      },{onOpen:root=>{drawFields(root);$('#add-field',root).onclick=()=>{if(fields.length>=50)return;fields.push({key:'field_'+crypto.randomUUID().replaceAll('-',''),label:'',type:'text',required:false});drawFields(root)};}});
  }
  function fillTemplate(id) {
    const t=data.templates.find(x=>x.id===id);if(!t)return;
    const html=(t.description?`<p>${esc(t.description)}</p>`:'')+field('site_id','Objekt','select',options(t.site_id?state.sites.filter(s=>s.id===t.site_id):state.sites,t.site_id,t.site_id?'Objekt wählen':'Ohne Objekt'),t.site_id?'required':'')+t.fields.map(f=>{
      const key='answer_'+f.key,required=f.required?'required':'';
      if(f.type==='checkbox')return `<label class="check-field"><input type="checkbox" name="${esc(key)}" ${required}>${esc(f.label)}${f.required?' *':''}</label>`;
      return field(key,f.label+(f.required?' *':''),f.type,f.type==='select'?options((f.options||[]).map(value=>({value,label:value}))):'',required+(f.type==='number'?' step="any"':''));
    }).join('');
    M.dialog(t.name,html,async f=>{
      const responses={};for(const item of t.fields){const value=f.get('answer_'+item.key);responses[item.key]=item.type==='checkbox'?value!==null:item.type==='number'?(value===''?null:Number(value)):value;}
      await AONE.rpc('guard_submit_form',{p_template:t.id,p_site:f.get('site_id')||null,p_shift:null,p_responses:responses});
    },{submit:'Formular einreichen'});
  }
  function submissionDetail(id) {
    const s=data.submissions.find(x=>x.id===id);if(!s)return;
    const t=s.template_snapshot||data.templates.find(x=>x.id===s.template_id)||{name:'Archiviertes Formular',fields:[]};
    const fields=t.fields?.length?t.fields:Object.keys(s.responses||{}).map(key=>({key,label:key}));
    M.dialog(t.name,details([['Mitarbeiter',M.employee(s.employee_id)],['Eingereicht',date(s.submitted_at)],['Objekt',M.site(s.site_id)],...fields.map(f=>[f.label,typeof s.responses[f.key]==='boolean'?(s.responses[f.key]?'Ja':'Nein'):s.responses[f.key]??'–'])]),module==='forms-admin'&&s.status==='submitted'?async()=>AONE.rpc('guard_review_form_submission',{p_submission:s.id}):null,{submit:'Als geprüft bestätigen'});
  }
  if(['forms-admin','meine-formulare'].includes(module)) {
    load=async()=>{
      [data.templates,data.submissions]=await Promise.all([rows('guard_form_templates',module==='meine-formulare'?{active:'eq.true'}:{}),rows('guard_form_submissions',module==='meine-formulare'?{employee_id:`eq.${ownEmployee()}`,order:'submitted_at.desc,id.asc'}:{order:'submitted_at.desc,id.asc'})]);
    };
    render=()=>{
      const templates=filtered(data.templates,['name','description']);
      const submissions=data.submissions.filter(s=>(!selected.site||s.site_id===selected.site)&&(!selected.search||String(s.template_snapshot?.name||data.templates.find(t=>t.id===s.template_id)?.name||'').toLowerCase().includes(selected.search.toLowerCase())));
      content('<h2>Vorlagen</h2>'+(templates.length?grid(templates.map(t=>card(t.name,`<p>${esc(t.description)}</p>`+badges([`${t.fields.length} Felder`,t.active?'Aktiv':'Deaktiviert',M.site(t.site_id)]),module==='forms-admin'?button('Bearbeiten','edit-template',t.id)+button(t.active?'Deaktivieren':'Aktivieren','toggle-template',t.id):button('Ausfüllen','fill-template',t.id,'primary')))):empty('Keine passenden Formulare.'))+'<h2>Einreichungen</h2>'+(submissions.length?grid(submissions.map(s=>card(s.template_snapshot?.name||data.templates.find(t=>t.id===s.template_id)?.name||'Formular',details([['Mitarbeiter',M.employee(s.employee_id)],['Eingereicht',date(s.submitted_at)],['Status',label(s.status)]]),button('Antworten ansehen','view-submission',s.id)))):empty('Noch keine Einreichungen.')));
    };
    act=async(action,id)=>{
      if(action==='new-template')templateEditor();if(action==='edit-template')templateEditor(id);if(action==='fill-template')fillTemplate(id);if(action==='view-submission')submissionDetail(id);
      if(action==='toggle-template'){const t=data.templates.find(x=>x.id===id);await update('guard_form_templates',id,{active:!t.active});await state.reload();}
    };
  }

  const triggers={open_time_entry:'Zeiteintrag zu lange offen',document_expiry:'Dokument läuft ab',qualification_expiry:'Qualifikation läuft ab',overdue_task:'Aufgabe überfällig',critical_incident:'Kritischer Vorfall'};
  const actions={escalation:'Eskalation erstellen',task:'Aufgabe erstellen',notification:'Benachrichtigung erstellen'};
  function automationEditor(id='') {
    const r=data.rules.find(x=>x.id===id)||{};
    M.dialog(id?'Regel bearbeiten':'Neue Regel',field('name','Name','text',r.name,'required')+field('trigger_type','Wenn','select',options(Object.entries(triggers).map(([value,label])=>({value,label})),r.trigger_type),'')+field('action_type','Dann','select',options(Object.entries(actions).map(([value,label])=>({value,label})),r.action_type))+field('hours','Offene Buchung: nach Stunden','number',r.config?.hours??12,'min="1" max="168" step="1"')+field('days','Ablaufwarnung: Tage vorher','number',r.config?.days??30,'min="0" max="365" step="1"'),
      async f=>{const row={name:f.get('name').trim(),trigger_type:f.get('trigger_type'),action_type:f.get('action_type'),config:{hours:Number(f.get('hours')),days:Number(f.get('days'))}};if(!row.name||!triggers[row.trigger_type]||!actions[row.action_type])throw new Error('Bitte Name, Auslöser und Aktion auswählen.');if(id)await update('guard_automation_rules',id,row);else await insert('guard_automation_rules',row);});
  }
  if(module==='automation') {
    load=async()=>{[data.rules,data.runs]=await Promise.all([rows('guard_automation_rules'),rows('guard_automation_runs',{run_at:`gte.${new Date(Date.now()-7*86400000).toISOString()}`,order:'run_at.desc,id.asc'})]);};
    render=()=>content('<p class="notice">Aktive Regeln werden serverseitig alle fünf Minuten geprüft. Erfolgreiche Folgeaktionen werden je Regel und Datensatz innerhalb von 24 Stunden nicht erneut erzeugt.</p>'+grid(data.rules.filter(r=>!selected.search||r.name.toLowerCase().includes(selected.search.toLowerCase())).map(r=>card(r.name,badges([r.active?'Aktiv':'Pausiert'])+details([['Wenn',triggers[r.trigger_type]],['Dann',actions[r.action_type]],['Letzte Prüfung',date(r.last_run_at)]]),button('Bearbeiten','edit-rule',r.id)+button(r.active?'Pausieren':'Aktivieren','toggle-rule',r.id))))+(!data.rules.length?empty('Noch keine Regeln. Erstelle die erste Regel.'):'' )+'<h2>Ausführungen der letzten sieben Tage</h2>'+(data.runs.length?grid(data.runs.map(r=>card(label(r.status),`<p>${esc(r.message)}</p><p class="muted">${esc(date(r.run_at))}</p>`))):empty('Noch keine Ausführungen im Zeitraum.')));
    act=async(action,id)=>{if(action==='new-rule')automationEditor();if(action==='edit-rule')automationEditor(id);if(action==='toggle-rule'){const r=data.rules.find(x=>x.id===id);await update('guard_automation_rules',id,{active:!r.active});await state.reload();}};
  }

  if(module==='lone-worker') {
    load=async()=>{data.sessions=await rows('guard_lone_worker_sessions',{employee_id:`eq.${ownEmployee()}`,order:'started_at.desc,id.asc'});};
    render=()=>{
      const current=data.sessions.find(s=>['active','overdue','escalated'].includes(s.status));
      content('<p class="notice">Diese Funktion überwacht deine Rückmeldungen im Betrieb. Sie löst keinen Notruf bei Polizei oder Rettungsdienst aus. Bei akuter Gefahr: 112 anrufen.</p>'+(current?card('Aktiver Sicherheits-Check-in',badges([label(current.status),M.site(current.site_id)])+details([['Letzte Rückmeldung',date(current.last_checkin_at)],['Nächste Rückmeldung',date(current.next_check_due_at)],['Intervall',`${current.interval_minutes} Minuten`]])+`<p class="${new Date(current.next_check_due_at)<new Date()?'module-stale':'muted'}">${new Date(current.next_check_due_at)<new Date()?'Rückmeldung ist überfällig. Bitte jetzt bestätigen.':'Bitte spätestens zur angezeigten Zeit zurückmelden.'}</p>`,button('Mir geht es gut','checkin',current.id,'primary')+button('Dienst beenden','close-session',current.id)):card('Sicherheits-Check-in starten','<p>Wähle dein Objekt und das mit der Leitstelle vereinbarte Intervall.</p>',button('Starten','start-session','','primary')))+'<h2>Vergangene Dienste</h2>'+grid(data.sessions.filter(s=>s.status==='closed').slice(0,20).map(s=>card(M.site(s.site_id),details([['Beginn',date(s.started_at)],['Ende',date(s.closed_at)]])))));
    };
    act=async(action,id)=>{
      if(action==='start-session')M.dialog('Sicherheits-Check-in starten',field('site_id','Objekt','select',options(state.sites),'required')+field('interval','Rückmeldung alle … Minuten','number',30,'required min="5" max="240" step="1"'),async f=>AONE.rpc('guard_lone_worker_start',{p_org:state.ctx.org_id,p_site:f.get('site_id'),p_shift:null,p_interval_minutes:Number(f.get('interval'))}),{submit:'Starten'});
      if(action==='checkin'){await AONE.rpc('guard_lone_worker_checkin',{p_session:id});await state.reload();M.message('Rückmeldung gespeichert.');}
      if(action==='close-session')M.dialog('Dienst beenden','<p>Die Überwachung dieses Check-ins wird beendet.</p>',async()=>AONE.rpc('guard_lone_worker_close',{p_session:id}),{submit:'Dienst beenden'});
    };
  }

  if(module==='live-operations'||module==='intelligence') {
    load=async()=>{
      const today=new Date();today.setHours(0,0,0,0);const end=new Date(today);end.setDate(end.getDate()+1);
      [data.shifts,data.times,data.incidents,data.tasks,data.escalations,data.sessions]=await Promise.all([
        rows('guard_shifts',{starts_at:`lt.${end.toISOString()}`,ends_at:`gt.${today.toISOString()}`,status:'neq.canceled'}),rows('guard_time_entries',{clock_out_at:'is.null'}),rows('guard_incident_reports',{status:'neq.closed'}),rows('guard_tasks',{status:'in.(open,in_progress)'}),rows('guard_escalations',{status:'in.(open,acknowledged)'}),rows('guard_lone_worker_sessions',{status:'in.(active,overdue,escalated)'})]);
      data.updated=new Date();
    };
    render=()=>{
      const sites=state.sites.filter(s=>(!selected.site||selected.site===s.id)&&(!selected.search||s.name.toLowerCase().includes(selected.search.toLowerCase())));
      const active=data.times.filter(t=>!selected.site||t.site_id===selected.site),unassigned=data.shifts.filter(s=>!s.employee_id&&(!selected.site||s.site_id===selected.site));
      let html=`<p class="muted">Stand: ${esc(date(data.updated))}. ${module==='live-operations'?'Aktualisierung alle 30 Sekunden, solange die Seite sichtbar ist.':'Regelbasierte Auswertung gespeicherter Daten.'}</p>`+grid([card('Im Dienst',`<div class="module-count">${active.length}</div><p>Offene Zeitbuchungen</p>`),card('Unbesetzte Dienste heute',`<div class="module-count">${unassigned.length}</div>`),card('Offene Eskalationen',`<div class="module-count">${data.escalations.filter(e=>!selected.site||e.site_id===selected.site).length}</div>`)]);
      if(module==='intelligence')html+=`<div class="card" style="margin-top:16px"><h2>Betriebsabfrage</h2><p class="muted">Unterstützt: offene Dienste, Vorfälle, Aufgaben und Check-ins.</p><label class="module-field">Was möchtest du sehen?<input class="input" id="operations-question" placeholder="Zeige offene Aufgaben"></label>${button('Anzeigen','ask')}<div id="operations-answer" class="module-result" role="status"></div></div>`;
      html+='<h2>Objekte</h2>'+grid(sites.map(s=>{
        const shifts=data.shifts.filter(x=>x.site_id===s.id),times=data.times.filter(x=>x.site_id===s.id),issues=data.escalations.filter(x=>x.site_id===s.id);
        const map=Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)?`<a class="btn small" target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(s.latitude)}&mlon=${encodeURIComponent(s.longitude)}#map=16/${encodeURIComponent(s.latitude)}/${encodeURIComponent(s.longitude)}">Standort öffnen</a>`:'';
        return card(s.name,details([['Dienste heute',shifts.length],['Aktuell eingestempelt',times.length],['Unbesetzt',shifts.filter(x=>!x.employee_id).length],['Eskalationen',issues.length]])+times.map(t=>`<p>${esc(M.employee(t.employee_id))} · seit ${esc(date(t.clock_in_at))}</p>`).join(''),map);
      }));
      html+='<h2>Offene Eskalationen</h2>'+(data.escalations.length?grid(data.escalations.filter(e=>!selected.site||e.site_id===selected.site).map(e=>card(e.title,badges([label(e.severity),label(e.status)])+`<p>${esc(e.description)}</p>`,`<a class="btn small" href="./escalations.html">Eskalation bearbeiten</a>`))):empty('Keine offenen Eskalationen.'));
      content(html);
    };
    act=async action=>{
      if(action!=='ask')return;
      const q=$('#operations-question').value.toLowerCase();let result;
      const atSite=items=>items.filter(x=>!selected.site||x.site_id===selected.site);
      if(/aufgab/.test(q))result=atSite(data.tasks).map(t=>`${t.title} · ${M.employee(t.employee_id)} · ${date(t.due_at)}`);
      else if(/vorfall|vorfälle|incident/.test(q))result=atSite(data.incidents).map(i=>`${i.incident_no||''} ${i.title} · ${label(i.severity)}`);
      else if(/check|allein/.test(q))result=atSite(data.sessions).map(s=>`${M.employee(s.employee_id)} · ${label(s.status)} · nächste Rückmeldung ${date(s.next_check_due_at)}`);
      else if(/dienst|schicht/.test(q))result=atSite(data.shifts).filter(s=>!s.employee_id).map(s=>`${M.site(s.site_id)} · ${date(s.starts_at)} bis ${date(s.ends_at)}`);
      else {$('#operations-answer').textContent='Bitte nach offenen Diensten, Vorfällen, Aufgaben oder Check-ins fragen.';return;}
      $('#operations-answer').textContent=result.length?result.join('\n'):'Keine passenden Einträge im geladenen Zeitraum.';
    };
  }

  if(module==='proof-service') {
    const today=new Date();today.setHours(0,0,0,0);
    data.from=today.toISOString();data.to=new Date(today.getTime()+86400000).toISOString();
    load=async()=>{
      [data.times,data.watchbook,data.incidents]=await Promise.all([rows('guard_time_entries',{clock_in_at:`lt.${data.to}`,or:`(clock_out_at.is.null,clock_out_at.gt.${data.from})`}),rows('guard_watchbook_entries',{occurred_at:`gte.${data.from}`,and:`(occurred_at.lt.${data.to})`}),rows('guard_incident_reports',{occurred_at:`gte.${data.from}`,and:`(occurred_at.lt.${data.to})`})]);
      data.events=[...data.times.flatMap(t=>[{at:t.clock_in_at,site_id:t.site_id,employee_id:t.employee_id,type:'Dienstbeginn',text:label(t.status),source:t.id},...(t.clock_out_at?[{at:t.clock_out_at,site_id:t.site_id,employee_id:t.employee_id,type:'Dienstende',text:'Zeitbuchung',source:t.id}]:[])]),...data.watchbook.map(w=>({at:w.occurred_at,site_id:w.site_id,employee_id:w.employee_id,type:'Wachbuch',text:w.body,source:w.id})),...data.incidents.map(i=>({at:i.occurred_at,site_id:i.site_id,employee_id:i.employee_id,type:'Vorfall',text:`${i.incident_no||''} ${i.title}`,source:i.id}))].filter(e=>new Date(e.at)>=new Date(data.from)&&new Date(e.at)<new Date(data.to)).sort((a,b)=>new Date(a.at)-new Date(b.at));
    };
    const events=()=>filtered(data.events,['type','text']);
    render=()=>content(`<p class="muted">Zeitraum: ${esc(date(data.from))} bis ${esc(date(data.to))}, Ende nicht eingeschlossen.</p><ol class="module-timeline">${events().map(e=>`<li><time>${esc(date(e.at))}</time><strong>${esc(e.type)} · ${esc(M.site(e.site_id))}</strong><p>${esc(M.employee(e.employee_id))}</p><p>${esc(e.text)}</p><small>Datensatz: ${esc(e.source)}</small></li>`).join('')}</ol>${events().length?'':empty('Keine Ereignisse im gewählten Zeitraum.')}<p class="muted">Enthalten: Zeitbuchungen, Wachbuch und Vorfälle. Rundgangnachweise findest du unter Security Operations.</p>`);
    act=async action=>{
      if(action==='period')M.dialog('Zeitraum wählen',field('from','Von','datetime-local',M.localInput(data.from),'required')+field('to','Bis, ausschließlich','datetime-local',M.localInput(data.to),'required'),async f=>{const a=M.iso(f.get('from')),b=M.iso(f.get('to'));if(a>=b)throw new Error('Das Ende muss nach dem Beginn liegen.');if(new Date(b)-new Date(a)>93*86400000)throw new Error('Bitte höchstens 93 Tage auswählen.');data.from=a;data.to=b;},{submit:'Anzeigen'});
      if(action==='csv')await M.csv('Leistungsnachweis.csv',['Zeit','Typ','Objekt','Mitarbeiter','Inhalt','Datensatz'],events().map(e=>[date(e.at),e.type,M.site(e.site_id),M.employee(e.employee_id),e.text,e.source]),'proof_of_service');
      if(action==='print'){await AONE.rpc('guard_log_export',{p_org:state.ctx.org_id,p_entity_type:'proof_of_service',p_entity_id:null,p_format:'pdf',p_note:'Druckansicht Leistungsnachweis'});window.print();}
    };
  }

  if(module==='developer-platform') {
    load=async()=>{[data.keys,data.logs]=await Promise.all([rows('guard_api_keys',{select:'id,name,key_prefix,active,expires_at,last_used_at,created_at'}),rows('guard_integration_logs',{created_at:`gte.${new Date(Date.now()-7*86400000).toISOString()}`,order:'created_at.desc,id.asc'})]);};
    render=()=>content('<p class="notice">API-Schlüssel erlauben lesenden Zugriff auf die Daten deiner Firma. Vollständige Schlüssel werden nur direkt nach Erstellung angezeigt.</p>'+grid(data.keys.filter(k=>!selected.search||k.name.toLowerCase().includes(selected.search.toLowerCase())).map(k=>card(k.name,badges([k.active?'Aktiv':'Gesperrt'])+details([['Präfix',k.key_prefix],['Gültig bis',date(k.expires_at)],['Zuletzt verwendet',date(k.last_used_at)]]),k.active?button('Schlüssel sperren','revoke-key',k.id):'')))+(!data.keys.length?empty('Noch keine API-Schlüssel.'):'' )+`<div class="card" style="margin-top:16px"><h2>REST-Zugriff</h2><p><code>${esc(AONE.SUPABASE_URL)}/functions/v1/aone-api/health</code></p><p>Ressourcen: /sites, /employees, /shifts, /incidents</p><p>Header: <code>X-AONE-API-Key</code></p></div><h2>Integrationsprotokolle der letzten sieben Tage</h2>`+(data.logs.length?grid(data.logs.map(l=>card(l.event_name||l.integration_type,badges([label(l.status),l.http_status||''])+`<p>${esc(l.message)}</p><p class="muted">${esc(date(l.created_at))}</p>`))):empty('Keine Aufrufe im Zeitraum.')));
    act=async(action,id)=>{
      if(action==='new-key'){
        let generated='';
        M.dialog('API-Schlüssel erstellen',field('name','Bezeichnung','text','','required maxlength="120"')+field('expires','Gültig bis','datetime-local',M.localInput(new Date(Date.now()+90*86400000)),'required'),async f=>{
          const expiry=M.iso(f.get('expires'));if(new Date(expiry)<=new Date())throw new Error('Das Ablaufdatum muss in der Zukunft liegen.');
          const bytes=crypto.getRandomValues(new Uint8Array(32));generated='aone_'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
          const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(generated))),b=>b.toString(16).padStart(2,'0')).join('');
          await insert('guard_api_keys',{name:f.get('name').trim(),key_prefix:generated.slice(0,16),key_hash:hash,scopes:['read'],expires_at:expiry});
          // Show after the saving dialog has closed and its reload has completed.
          data.newKey=generated;
        },{submit:'Schlüssel erstellen'});
      }
      if(action==='revoke-key')M.dialog('API-Schlüssel sperren','<p>Dieser Schlüssel kann danach nicht mehr für API-Aufrufe verwendet werden.</p>',async()=>update('guard_api_keys',id,{active:false}),{submit:'Sperren'});
    };
  }

  state.reload=async()=>{
    try{await load();render();data.loaded=true;}catch(err){if(!data.loaded)content(empty('Daten konnten nicht geladen werden. Bitte erneut aktualisieren.'));throw err;}
    if(data.newKey){const key=data.newKey;delete data.newKey;setTimeout(()=>M.dialog('Schlüssel jetzt kopieren',`<p>Speichere diesen Schlüssel sicher. Nach dem Schließen kann er nicht erneut angezeigt werden.</p><div class="module-secret">${esc(key)}</div><button type="button" class="btn" id="copy-api-key">Kopieren</button>`,null,{onOpen:()=>{$('#copy-api-key').onclick=async()=>{try{await navigator.clipboard.writeText(key);$('#copy-api-key').textContent='Kopiert'}catch{$('#copy-api-key').textContent='Bitte Schlüssel markieren und kopieren'}}}}),0);}
  };
  try {
    if(!await M.init(document.body.dataset.manager==='true'))return;
    const mainActions={quality:button('+ Aufgabe','new-task','','primary')+button('+ Qualitätsprüfung','new-audit'), 'forms-admin':button('+ Formular','new-template','','primary'),automation:button('+ Regel','new-rule','','primary'),'proof-service':button('Zeitraum','period')+button('CSV exportieren','csv')+button('Drucken / PDF','print'),'developer-platform':button('+ API-Schlüssel','new-key','','primary')};
    controls(mainActions[module]||'', ['quality','meine-aufgaben'].includes(module)?['open','in_progress','done','canceled','follow_up','closed']:[]);
    if(['automation','lone-worker','developer-platform','modules'].includes(module))$('#field-filter-site').closest('label').hidden=true;
    if(module==='lone-worker')$('#field-search').closest('label').hidden=true;
    $('#refresh').onclick=()=>M.run(state.reload);
    for(const root of [$('#module-controls'),$('#module-content')])root.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)M.run(()=>act(b.dataset.action,b.dataset.id));});
    await M.run(state.reload);
    if(['live-operations','lone-worker'].includes(module))setInterval(()=>{if(!document.hidden&&!$('#module-dialog').open)M.run(state.reload)},30000);
  } catch(err){content(empty('Dieser Bereich konnte nicht geöffnet werden.'));M.message(err.message,'err');}
})();
