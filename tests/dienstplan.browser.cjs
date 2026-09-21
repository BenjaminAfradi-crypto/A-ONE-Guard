// Run with Playwright installed: node --test tests/dienstplan.browser.cjs
// All HTTP requests are intercepted. No live accounts or writes are used.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
let browser;
before(async () => { browser = await chromium.launch({headless:true,executablePath:process.env.AONE_CHROMIUM_PATH||undefined,args:JSON.parse(process.env.AONE_CHROMIUM_ARGS||'[]')}); });
after(async () => { await browser?.close(); });
const shift = (id, date, start='08:00', end='16:00', extra={}) => ({id,org_id:'org1',site_id:'site1',employee_id:'emp1',title:'Empfang',starts_at:`${date}T${start}:00+02:00`,ends_at:`${date}T${end}:00+02:00`,status:'planned',required_qualification:'none',...extra});
async function setup(t, rows=[]) {
  const context = await browser.newContext({timezoneId:'Europe/Berlin',locale:'de-DE',serviceWorkers:'block'});
  t.after(() => context.close());
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date('2026-09-21T10:00:00Z'));
  const db={rows:structuredClone(rows),writes:[],queries:[],failCheck:false,failDate:null};
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  t.after(()=>assert.deepEqual(errors,[]));
  page.on('dialog',d=>d.accept());
  await context.addInitScript(()=>localStorage.setItem('aone_guard_session_v1',JSON.stringify({access_token:'test-only',expires_at:9999999999999,user:{id:'user1'}})));
  function matches(row,params) {
    return [...params].every(([key,filter])=>{
      if(['select','limit','order'].includes(key))return true;
      const dot=filter.indexOf('.'),op=filter.slice(0,dot),value=filter.slice(dot+1);
      const a=key.endsWith('_at')?Date.parse(row[key]):String(row[key]);
      const b=key.endsWith('_at')?Date.parse(value):value;
      if(op==='eq')return a===b;if(op==='neq')return a!==b;
      if(op==='lt')return a<b;if(op==='gt')return a>b;
      if(op==='gte')return a>=b;if(op==='lte')return a<=b;
      throw new Error(`Unhandled filter ${filter}`);
    });
  }
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.hostname==='planner.test'){
      const filename=url.pathname.slice(1)||'dienstplan.html';
      const contentType=filename.endsWith('.js')?'text/javascript':filename.endsWith('.css')?'text/css':filename.endsWith('.svg')?'image/svg+xml':'text/html';
      try{return route.fulfill({contentType,body:await fs.readFile(path.join(__dirname,'..',filename))})}catch{return route.fulfill({status:404,body:'Not found'})}
    }
    assert.equal(url.hostname,'rwojydgekobbckpcvlnu.supabase.co');
    const table=url.pathname.split('/').at(-1),p=url.searchParams;
    const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    if(table==='guard_memberships')return send([{org_id:'org1',role:'admin',user_id:'user1'}]);
    if(table==='guard_organizations')return send([{id:'org1',name:'Testfirma'}]);
    if(table==='guard_employees')return send([{id:'emp1',display_name:'Testmitarbeiter',qualification_level:'sachkunde',status:'active'}]);
    if(table==='guard_sites')return send([{id:'site1',name:'Testobjekt',active:true}]);
    assert.equal(table,'guard_shifts');
    if(request.method()==='POST')assert.equal(request.postDataJSON().org_id,'org1');
    else assert.equal(p.get('org_id'),'eq.org1');
    if(request.method()==='GET'){
      db.queries.push(url.search);
      if(db.failCheck&&p.has('ends_at'))return send({message:'Konfliktprüfung offline'},503);
      let found=db.rows.filter(row=>matches(row,p));
      if(p.has('limit'))found=found.slice(0,Number(p.get('limit')));
      return send(found);
    }
    const row=request.postDataJSON();
    if(request.method()==='POST'){
      if(db.failDate&&row.starts_at.startsWith(db.failDate))return send({message:'Test-Speicherfehler'},500);
      db.writes.push(row);db.rows.push({id:`new-${db.writes.length}`,...row});return send(null,201);
    }
    assert.equal(request.method(),'PATCH');
    const found=db.rows.filter(r=>matches(r,p));found.forEach(r=>Object.assign(r,row));db.writes.push(row);return send(found);
  });
  await page.goto('https://planner.test/dienstplan.html');
  await page.waitForSelector('#week-grid .day');
  await page.waitForFunction(()=>!document.body.classList.contains('busy'));
  await page.selectOption('#q-site','site1');await page.selectOption('#q-employee','emp1');
  return {page,db};
}
async function submit(page){await page.locator('#quick-form button[type=submit]').click();await page.waitForFunction(()=>!document.body.classList.contains('busy')&&document.querySelector('#quick-msg').textContent.length>0);}

test('Weekday series: chosen dates only, preview, overnight end and mobile layout',async t=>{
  const {page,db}=await setup(t);
  await page.selectOption('#q-repeat','custom');await page.fill('#q-until','2026-10-02');
  for(const v of ['2','4','5'])await page.uncheck(`[name=q-weekday][value="${v}"]`);
  await page.locator('.preset[data-start="22:00"]').click();
  assert.match(await page.locator('#quick-preview').textContent(),/4 Schichten.*Folgetag/);
  await page.setViewportSize({width:390,height:844});
  if(process.env.AONE_SCREENSHOT)await page.screenshot({path:process.env.AONE_SCREENSHOT,fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:e.getBoundingClientRect().right})))));
  await submit(page);assert.equal(db.writes.length,4);
  assert.deepEqual(db.writes.map(s=>s.starts_at.slice(0,10)),['2026-09-21','2026-09-23','2026-09-28','2026-09-30']);
  assert.equal(db.writes[0].ends_at,'2026-09-22T04:00:00.000Z');
  if(process.env.AONE_SCREENSHOT)await page.screenshot({path:process.env.AONE_SCREENSHOT,fullPage:true});
});
test('Prior-week overnight conflict blocks quick creation, adjacent shift allowed',async t=>{
  const {page,db}=await setup(t,[shift('night','2026-09-20','22:00','06:00',{ends_at:'2026-09-21T09:00:00+02:00'})]);
  await submit(page);assert.equal(db.writes.length,0);assert.match(await page.locator('#quick-msg').textContent(),/Überschneidung/);
  await page.fill('#q-start','09:00');await submit(page);assert.equal(db.writes.length,1);
});
test('Edit ignores itself but rejects another overlapping shift',async t=>{
  const {page,db}=await setup(t,[shift('first','2026-09-21'),shift('second','2026-09-21','16:00','20:00')]);
  await page.locator('.edit-shift[data-id=first]').click();await page.locator('#edit-form button[type=submit]').click();
  await page.waitForSelector('#shift-modal.open',{state:'hidden'});assert.equal(db.writes.length,1);
  await page.locator('.edit-shift[data-id=first]').click();await page.fill('#e-end','17:00');await page.locator('#edit-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#edit-msg').textContent.includes('Überschneidung'));assert.equal(db.writes.length,1);
});
test('Copy day and week reject conflicts outside loaded week',async t=>{
  const {page,db}=await setup(t,[shift('sunday','2026-09-27'),shift('monday','2026-09-28'),shift('nextSunday','2026-10-04')]);
  await page.locator('.copy-shift[data-id=sunday]').click();await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('Überschneidung'));
  assert.equal(db.writes.length,0);
  await page.click('#copy-week');await page.waitForFunction(()=>document.querySelector('#quick-msg').textContent.includes('nicht gespeichert'));
  assert.equal(db.writes.length,0);
});
test('Canceled shifts do not block; partial failures show dates and remain retryable',async t=>{
  const {page,db}=await setup(t,[shift('canceled','2026-09-21','08:00','16:00',{status:'canceled'})]);
  db.failDate='2026-09-23';await page.selectOption('#q-repeat','5');await submit(page);
  assert.equal(db.writes.length,4);assert.match(await page.locator('#quick-msg').textContent(),/2026-09-23: Test-Speicherfehler/);
  db.failDate=null;await submit(page);assert.equal(db.writes.length,5);
});
test('Failed conflict lookup prevents writes; missing weekdays and excessive range rejected',async t=>{
  const {page,db}=await setup(t);db.failCheck=true;await submit(page);assert.equal(db.writes.length,0);
  assert.match(await page.locator('#quick-msg').textContent(),/offline/);
  await page.selectOption('#q-repeat','custom');
  for(const v of ['1','2','3','4','5'])await page.uncheck(`[name=q-weekday][value="${v}"]`);
  await submit(page);assert.match(await page.locator('#quick-msg').textContent(),/mindestens einen Wochentag/);
  await page.check('[name=q-weekday][value="1"]');await page.fill('#q-until','2027-01-01');await submit(page);
  assert.match(await page.locator('#quick-msg').textContent(),/91 Kalendertage/);assert.equal(db.writes.length,0);
});
test('Night recurrence preserves local times over daylight-saving change',async t=>{
  const {page,db}=await setup(t);await page.fill('#q-date','2026-10-24');await page.selectOption('#q-repeat','5');
  await page.locator('.preset[data-start="22:00"]').click();await submit(page);
  assert.equal(db.writes.length,5);
  assert.equal(db.writes[0].starts_at,'2026-10-24T20:00:00.000Z');assert.equal(db.writes[0].ends_at,'2026-10-25T05:00:00.000Z');
  assert.equal(db.writes[1].starts_at,'2026-10-25T21:00:00.000Z');
});
