const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const launch=()=>chromium.launch({headless:true,executablePath:process.env.AONE_CHROMIUM_PATH||undefined,args:JSON.parse(process.env.AONE_CHROMIUM_ARGS||'[]')});
async function setup(t,browser,module,role='admin',seed={}) {
 const context=await browser.newContext({timezoneId:'Europe/Berlin',locale:'de-DE',serviceWorkers:'block'});t.after(()=>context.close());
 const page=await context.newPage();await page.clock.setFixedTime(new Date('2026-09-21T10:00:00Z'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));
 const db={guard_memberships:[{org_id:'org1',role,user_id:'user1'}],guard_organizations:[{id:'org1',name:'Testfirma'}],guard_employees:[{id:'emp1',org_id:'org1',user_id:'user1',display_name:'Testmitarbeiter',status:'active'}],guard_sites:[{id:'site1',org_id:'org1',name:'Testobjekt',active:true,latitude:50,longitude:8}],...structuredClone(seed)};
 const calls=[],writes=[],failures=new Set();let count=0;
 await context.addInitScript(()=>localStorage.setItem('aone_guard_session_v1',JSON.stringify({access_token:'fixture',expires_at:9999999999999,user:{id:'user1'}})));
 function filter(row,p){return [...p].every(([key,f])=>{
  if(['select','order','limit','offset','and','or'].includes(key))return true;
  const i=f.indexOf('.'),op=f.slice(0,i),v=f.slice(i+1),a=row[key];
  if(op==='eq')return String(a)===v;if(op==='neq')return String(a)!==v;
  if(op==='is')return v==='null'?a==null:String(a)===v;
  if(op==='in')return v.slice(1,-1).split(',').includes(String(a));
  if(op==='gte')return a>=v;if(op==='gt')return a>v;if(op==='lte')return a<=v;if(op==='lt')return a<v;
  throw Error(`Unknown filter ${key}=${f}`);
 });}
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.hostname==='guard.test'){
   const file=u.pathname.slice(1),contentType=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html';
   try{return route.fulfill({contentType,body:await fs.readFile(path.join(__dirname,'../..',file))})}catch{return route.fulfill({status:404,body:'Missing file'})}
  }
  assert.equal(u.hostname,'rwojydgekobbckpcvlnu.supabase.co');
  const name=u.pathname.split('/').at(-1),send=(value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  calls.push({name,method:req.method(),query:u.search});
  if(failures.has(name))return send({message:'Test: Server nicht erreichbar'},503);
  if(u.pathname.includes('/rpc/')){
   const a=req.postDataJSON();writes.push({rpc:name,args:a});
   if(name==='guard_complete_task'){const task=db.guard_tasks.find(t=>t.id===a.p_task);task.status='done';task.completion_note=a.p_note;return send(task.id);}
   if(name==='guard_submit_form'){
    const template=db.guard_form_templates.find(t=>t.id===a.p_template),id='submission-'+(++count);
    (db.guard_form_submissions??=[]).push({id,org_id:'org1',employee_id:'emp1',template_id:template.id,site_id:a.p_site,responses:a.p_responses,template_snapshot:structuredClone(template),status:'submitted',submitted_at:'2026-09-21T10:00:00Z'});return send(id);
   }
   if(name==='guard_review_form_submission'){db.guard_form_submissions.find(s=>s.id===a.p_submission).status='reviewed';return send(a.p_submission);}
   if(name==='guard_lone_worker_start'){const id='session-'+(++count);(db.guard_lone_worker_sessions??=[]).push({id,org_id:'org1',employee_id:'emp1',site_id:a.p_site,interval_minutes:a.p_interval_minutes,status:'active',started_at:'2026-09-21T10:00:00Z',last_checkin_at:'2026-09-21T10:00:00Z',next_check_due_at:'2026-09-21T10:30:00Z'});return send(id);}
   if(name==='guard_lone_worker_checkin'||name==='guard_lone_worker_close'){const s=db.guard_lone_worker_sessions.find(s=>s.id===a.p_session);s.status=name.endsWith('close')?'closed':'active';s.closed_at='2026-09-21T11:00:00Z';return send(s.id);}
   if(name==='guard_log_export')return send(null);
   throw Error(`Unexpected RPC: ${name}`);
  }
  if(!['guard_memberships','guard_organizations'].includes(name)){
   if(req.method()==='POST')assert.equal(req.postDataJSON().org_id,'org1');else assert.equal(u.searchParams.get('org_id'),'eq.org1');
  }
  const records=db[name]??=[];
  if(req.method()==='GET'){
   let rows=records.filter(r=>filter(r,u.searchParams));const offset=Number(u.searchParams.get('offset')||0);rows=rows.slice(offset,offset+Number(u.searchParams.get('limit')||1000));return send(rows);
  }
  const values=req.postDataJSON();writes.push({table:name,method:req.method(),values});
  if(req.method()==='POST'){const row={id:'record-'+(++count),status:'open',active:true,created_at:'2026-09-21T10:00:00Z',...values};records.push(row);return send([row],201);}
  if(req.method()==='PATCH'){const changed=records.filter(r=>filter(r,u.searchParams));changed.forEach(r=>Object.assign(r,values));return send(changed);}
  throw Error(`Unexpected method ${req.method()}`);
 });
 await page.goto(`https://guard.test/${module}.html`);
 await page.waitForFunction(()=>!document.querySelector('#module-content').textContent.includes('Daten werden geladen'));
 return {page,db,calls,writes,failures,async open(next){await page.goto(`https://guard.test/${next}.html`);await page.waitForFunction(()=>!document.querySelector('#module-content').textContent.includes('Daten werden geladen'));}};
}
async function save(page){await page.locator('#module-editor button[type=submit]').click();await page.waitForSelector('#module-dialog[open]',{state:'hidden'});await page.waitForFunction(()=>document.querySelector('#module-content').getAttribute('aria-busy')!=='true');}
module.exports={launch,setup,save};
