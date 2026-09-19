(()=>{
  const S={session:null,ctx:null,customers:[],access:[],sites:[],watchbook:[],incidents:[],runs:[],routes:[],releases:[],tickets:[],customer:null};
  const $=s=>document.querySelector(s),esc=AONE.esc;
  const customer=()=>S.customers.find(x=>x.id===S.customer);
  const relKey=(t,id)=>`${t}:${id}`;
  const releaseMap=()=>new Map(S.releases.map(r=>[relKey(r.entity_type,r.entity_id),r.active]));
  const siteName=id=>S.sites.find(x=>x.id===id)?.name||'—';
  async function init(){
    S.session=await AONE.session().catch(()=>null);if(!S.session){location.replace('./admin-login.html');return}
    S.ctx=await AONE.chooseContext();if(!S.ctx||!AONE.isManager(S.ctx.role)){location.replace('./app.html');return}
    $('#org-name').textContent=S.ctx.org?.name||'Kundenportal';$('#who').textContent=`${S.session.user.email||''} · ${AONE.roleLabel(S.ctx.role)}`;
    $('#logout').onclick=()=>{AONE.signOut();location.replace('./admin-login.html')};$('#refresh').onclick=refresh;
    $('#customer-select').onchange=()=>{S.customer=$('#customer-select').value||null;render()};
    $('#assign-site').onclick=assignSite;$('#invite-form').onsubmit=invite;
    await refresh();
  }
  async function refresh(){
    AONE.loading(true,'Kundenportal-Verwaltung laden…');
    try{
      const org=encodeURIComponent(S.ctx.org_id);
      const [customers,access,sites,watchbook,incidents,runs,routes,releases,tickets]=await Promise.all([
        AONE.table('guard_customers',`select=id,customer_no,company_name,contact_name,email,phone,status&org_id=eq.${org}&order=company_name.asc`),
        AONE.table('guard_customer_portal_access',`select=id,customer_id,user_id,display_name,email,role,active,created_at&org_id=eq.${org}&order=created_at.desc`),
        AONE.table('guard_sites',`select=id,name,address,customer_id,customer_name,active&org_id=eq.${org}&order=name.asc`),
        AONE.table('guard_watchbook_entries',`select=id,site_id,category,severity,body,occurred_at&org_id=eq.${org}&order=occurred_at.desc&limit=120`),
        AONE.table('guard_incident_reports',`select=id,site_id,title,severity,status,occurred_at&org_id=eq.${org}&order=occurred_at.desc&limit=120`),
        AONE.table('guard_patrol_runs',`select=id,route_id,status,started_at,completed_at&org_id=eq.${org}&order=started_at.desc&limit=120`),
        AONE.table('guard_patrol_routes',`select=id,site_id,name&org_id=eq.${org}`),
        AONE.table('guard_customer_releases',`select=id,customer_id,entity_type,entity_id,active,released_at&org_id=eq.${org}`),
        AONE.table('guard_customer_tickets',`select=id,customer_id,site_id,subject,body,priority,status,created_at,resolution_note,resolved_at&org_id=eq.${org}&order=created_at.desc&limit=250`)
      ]);
      Object.assign(S,{customers,access,sites,watchbook,incidents,runs,routes,releases,tickets});
      if(!S.customer||!customers.some(x=>x.id===S.customer))S.customer=customers[0]?.id||null;
      render();
    }catch(e){AONE.toast(e.message,'err')}finally{AONE.loading(false)}
  }
  function render(){
    $('#customer-select').innerHTML=S.customers.map(c=>`<option value="${c.id}" ${c.id===S.customer?'selected':''}>${esc(c.company_name)} · ${esc(c.customer_no)}</option>`).join('')||'<option value="">Keine Kunden</option>';
    const c=customer(),customerSites=S.sites.filter(s=>s.customer_id===S.customer),acc=S.access.filter(a=>a.customer_id===S.customer),tickets=S.tickets.filter(t=>t.customer_id===S.customer),open=tickets.filter(t=>['open','in_progress'].includes(t.status)).length;
    $('#kp-stats').innerHTML=`<div class="card"><div class="muted">Portal-Zugänge</div><div class="stat">${acc.filter(x=>x.active).length}</div></div><div class="card"><div class="muted">Objekte</div><div class="stat">${customerSites.length}</div></div><div class="card"><div class="muted">Freigaben</div><div class="stat">${S.releases.filter(r=>r.customer_id===S.customer&&r.active).length}</div></div><div class="card"><div class="muted">Offene Tickets</div><div class="stat">${open}</div></div>`;
    renderAccess(acc);renderSites(customerSites);renderTickets(tickets);renderReleases(customerSites);
    $('#invite-form').querySelector('button').disabled=!c;
  }
  function renderAccess(rows){
    $('#access-list').innerHTML=rows.map(a=>`<div class="kp-row"><div class="row between wrap"><h3>${esc(a.display_name||a.email||'Kundenbenutzer')}</h3><span class="pill ${a.active?'green':'red'}">${a.active?'Aktiv':'Gesperrt'}</span></div><div class="kp-meta"><span>${esc(a.email||'')}</span><span>${a.role==='customer_admin'?'Kunden-Admin':'Leser'}</span></div><div class="kp-actions"><button class="btn small ${a.active?'red':'green'}" data-access="${a.id}" data-active="${a.active?'0':'1'}">${a.active?'Sperren':'Aktivieren'}</button></div></div>`).join('')||'<div class="empty">Noch kein Kundenportal-Zugang.</div>';
    document.querySelectorAll('[data-access]').forEach(b=>b.onclick=()=>toggleAccess(b.dataset.access,b.dataset.active==='1'));
  }
  async function toggleAccess(id,active){try{await AONE.update('guard_customer_portal_access',`id=eq.${encodeURIComponent(id)}`,{active,updated_at:new Date().toISOString()});AONE.toast(active?'Zugang aktiviert.':'Zugang gesperrt.');await refresh()}catch(e){AONE.toast(e.message,'err')}}
  function renderSites(rows){
    $('#assigned-sites').innerHTML=rows.map(s=>`<div class="kp-row"><h3>${esc(s.name)}</h3><div class="kp-meta"><span>${esc(s.address||'')}</span></div><div class="kp-actions"><button class="btn small red" data-unassign="${s.id}">Zuordnung lösen</button></div></div>`).join('')||'<div class="empty">Noch keine Objekte zugeordnet.</div>';
    document.querySelectorAll('[data-unassign]').forEach(b=>b.onclick=()=>unassignSite(b.dataset.unassign));
    const available=S.sites.filter(s=>!s.customer_id||s.customer_id===S.customer);
    $('#site-assign-select').innerHTML=available.map(s=>`<option value="${s.id}">${esc(s.name)}${s.customer_id===S.customer?' · bereits zugeordnet':''}</option>`).join('')||'<option value="">Keine Objekte verfügbar</option>';
  }
  async function assignSite(){const id=$('#site-assign-select').value,c=customer();if(!id||!c)return;try{await AONE.update('guard_sites',`id=eq.${encodeURIComponent(id)}`,{customer_id:c.id,customer_name:c.company_name});AONE.toast('Objekt dem Kunden zugeordnet.');await refresh()}catch(e){AONE.toast(e.message,'err')}}
  async function unassignSite(id){if(!confirm('Objektzuordnung zum Kunden wirklich lösen?'))return;try{await AONE.update('guard_sites',`id=eq.${encodeURIComponent(id)}`,{customer_id:null});AONE.toast('Zuordnung gelöst.');await refresh()}catch(e){AONE.toast(e.message,'err')}}
  async function invite(e){
    e.preventDefault();if(!S.customer)return;const f=new FormData(e.currentTarget);
    try{AONE.loading(true,'Kundenzugang erstellen…');const r=await AONE.edge('guard-customer-invite',{org_id:S.ctx.org_id,customer_id:S.customer,display_name:String(f.get('display_name')||'').trim(),email:String(f.get('email')||'').trim(),role:f.get('role'),password:String(f.get('password')||'')||null});const txt=r.existing_user?`Bestehender Account wurde freigeschaltet.\nE-Mail: ${r.email}\nDer Nutzer verwendet sein vorhandenes Passwort.`:`Kundenzugang erstellt.\nE-Mail: ${r.email}\nTemporäres Passwort: ${r.temporary_password}\nLogin: ${location.origin}/kunden-login.html`;$('#credential-result').innerHTML=`<div class="credentials-box">${esc(txt)}</div>`;AONE.toast('Kundenzugang eingerichtet.');e.currentTarget.reset();await refresh()}catch(err){AONE.toast(err.message,'err')}finally{AONE.loading(false)}
  }
  function renderTickets(rows){
    $('#ticket-admin-list').innerHTML=rows.map(t=>`<div class="kp-row"><div class="row between wrap"><h3>${esc(t.subject)}</h3><span class="pill ${t.priority==='high'?'red':t.status==='resolved'||t.status==='closed'?'green':'yellow'}">${esc(t.status)}</span></div><div class="kp-meta"><span>${AONE.dt(t.created_at)}</span><span>${esc(siteName(t.site_id))}</span><span>Priorität ${esc(t.priority)}</span></div><p>${esc(t.body)}</p>${t.resolution_note?`<div class="notice">${esc(t.resolution_note)}</div>`:''}<div class="kp-actions">${t.status==='open'?`<button class="btn small" data-ticket="${t.id}" data-status="in_progress">In Bearbeitung</button>`:''}${!['resolved','closed'].includes(t.status)?`<button class="btn small green" data-ticket="${t.id}" data-status="resolved">Erledigen</button>`:''}${t.status!=='closed'?`<button class="btn small" data-ticket="${t.id}" data-status="closed">Schließen</button>`:''}</div></div>`).join('')||'<div class="empty">Keine Tickets.</div>';
    document.querySelectorAll('[data-ticket]').forEach(b=>b.onclick=()=>ticketStatus(b.dataset.ticket,b.dataset.status));
  }
  async function ticketStatus(id,status){let note=null;if(status==='resolved'||status==='closed')note=prompt('Antwort / Abschlussnotiz für den Kunden:')||null;try{const row={status,updated_at:new Date().toISOString()};if(note)row.resolution_note=note;if(status==='resolved'||status==='closed')row.resolved_at=new Date().toISOString();await AONE.update('guard_customer_tickets',`id=eq.${encodeURIComponent(id)}`,row);AONE.toast('Ticket aktualisiert.');await refresh()}catch(e){AONE.toast(e.message,'err')}}
  function renderReleases(customerSites){
    const siteIds=new Set(customerSites.map(s=>s.id)),rm=releaseMap();
    const wb=S.watchbook.filter(x=>siteIds.has(x.site_id)).slice(0,20);
    const inc=S.incidents.filter(x=>siteIds.has(x.site_id)).slice(0,20);
    const routeMap=new Map(S.routes.map(r=>[r.id,r]));
    const runs=S.runs.filter(x=>siteIds.has(routeMap.get(x.route_id)?.site_id)).slice(0,20);
    const row=(type,id,title,meta)=>{const active=rm.get(relKey(type,id))===true;return `<div class="release-card"><div class="row between wrap"><b>${esc(title)}</b><span class="pill ${active?'green':''}">${active?'Freigegeben':'Intern'}</span></div><div class="kp-meta">${esc(meta)}</div><div class="kp-actions"><button class="btn small ${active?'red':'primary'}" data-release="${type}" data-id="${id}" data-visible="${active?'0':'1'}">${active?'Freigabe entziehen':'Für Kunde freigeben'}</button></div></div>`};
    $('#release-watchbook').innerHTML=wb.map(x=>row('watchbook',x.id,siteName(x.site_id),`${AONE.dt(x.occurred_at)} · ${x.category}`)).join('')||'<div class="empty">Keine Einträge.</div>';
    $('#release-incidents').innerHTML=inc.map(x=>row('incident',x.id,x.title,`${siteName(x.site_id)} · ${AONE.dt(x.occurred_at)}`)).join('')||'<div class="empty">Keine Vorfälle.</div>';
    $('#release-patrols').innerHTML=runs.map(x=>{const r=routeMap.get(x.route_id);return row('patrol',x.id,r?.name||'Rundgang',`${siteName(r?.site_id)} · ${AONE.dt(x.started_at)} · ${x.status}`)}).join('')||'<div class="empty">Keine Rundgänge.</div>';
    document.querySelectorAll('[data-release]').forEach(b=>b.onclick=()=>setRelease(b.dataset.release,b.dataset.id,b.dataset.visible==='1'));
  }
  async function setRelease(type,id,visible){try{await AONE.rpc('guard_customer_release',{p_customer:S.customer,p_entity_type:type,p_entity:id,p_visible:visible});AONE.toast(visible?'Für Kundenportal freigegeben.':'Freigabe entzogen.');await refresh()}catch(e){AONE.toast(e.message,'err')}}
  init();
})();