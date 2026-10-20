const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {launch}=require('./helpers/modules.cjs');
test('NFC retry after lost response and reload preserve request ID; new scan creates a new booking',async t=>{
 const browser=await launch();t.after(()=>browser.close());const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const requests=[],receipts=new Map();let lost=true;
 await context.addInitScript(()=>localStorage.setItem('aone_guard_session_v1',JSON.stringify({access_token:'fixture',expires_at:9999999999999,user:{id:'user1'}})));
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.hostname==='guard.test')return route.fulfill({contentType:u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.css')?'text/css':'text/html',body:await fs.readFile(path.join(__dirname,'..',u.pathname.slice(1)))});
  assert.equal(u.hostname,'rwojydgekobbckpcvlnu.supabase.co');
  if(u.pathname.endsWith('/guard_sites'))return route.fulfill({json:[{id:'site1',name:'Testobjekt'}]});
  assert.ok(u.pathname.endsWith('/rpc/guard_clock_nfc_once'));
  const a=req.postDataJSON();requests.push(a);if(!receipts.has(a.p_request_id))receipts.set(a.p_request_id,{action:receipts.size?'out':'in',site_id:'site1',entry_id:'entry1'});
  if(lost){lost=false;return route.abort('failed')}
  return route.fulfill({json:receipts.get(a.p_request_id)});
 });
 await page.goto('https://guard.test/nfc.html?t=test-token');await page.waitForSelector('#retry-btn:not([hidden])');
 assert.equal(new URL(page.url()).searchParams.has('t'),false,'scan token must not remain in URL');
 assert.equal(await page.locator('meta[name="referrer"]').getAttribute('content'),'no-referrer');
 await page.click('#retry-btn');await page.waitForFunction(()=>document.querySelector('#headline').textContent==='Eingestempelt');
 await page.reload();await page.waitForFunction(()=>document.querySelector('#headline').textContent==='Eingestempelt');assert.equal(receipts.size,1);assert.equal(requests.length,3);assert.ok(requests.every(a=>a.p_request_id===requests[0].p_request_id));
 await page.goto('https://guard.test/nfc.html?t=test-token');await page.waitForFunction(()=>document.querySelector('#headline').textContent==='Ausgestempelt');assert.equal(receipts.size,2);
 assert.equal(new URL(page.url()).searchParams.has('t'),false);
 // A stale replay must not trigger another booking on browser reload.
 await page.evaluate(()=>{
   const last=JSON.parse(sessionStorage.getItem('aone_nfc_last'));
   last.created_at=Date.now()-11*60*1000;
   sessionStorage.setItem('aone_nfc_last',JSON.stringify(last));
   localStorage.setItem('aone_nfc_pending',JSON.stringify(last));
 });
 const count=requests.length;
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#headline').textContent==='Tag erneut scannen');
 assert.equal(requests.length,count,'expired replay triggered a new booking');
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('aone_nfc_last')),null);
 assert.deepEqual(errors,[]);
});

test('NFC preserves an unconfirmed scan across login and never exposes token on return',async t=>{
 const browser=await launch();t.after(()=>browser.close());
 const context=await browser.newContext({serviceWorkers:'block'});t.after(()=>context.close());
 const page=await context.newPage(),requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.hostname==='guard.test')return route.fulfill({contentType:u.pathname.endsWith('.js')?'text/javascript':u.pathname.endsWith('.css')?'text/css':'text/html',body:await fs.readFile(path.join(__dirname,'..',u.pathname.slice(1)))});
   assert.equal(u.hostname,'rwojydgekobbckpcvlnu.supabase.co');
   if(u.pathname.endsWith('/guard_sites'))return route.fulfill({json:[{id:'site1',name:'Testobjekt'}]});
   assert.ok(u.pathname.endsWith('/rpc/guard_clock_nfc_once'));
   requests.push(req.postDataJSON());
   return route.fulfill({json:{action:'in',site_id:'site1',entry_id:'entry1'}});
 });
 await page.goto('https://guard.test/nfc.html?t=private-token');
 await page.waitForURL(/\/login\.html$/);
 const pending=await page.evaluate(()=>JSON.parse(localStorage.getItem('aone_nfc_pending')));
 assert.equal(pending.token,'private-token');
 assert.ok(pending.request_id);
 assert.equal(requests.length,0);
 await page.evaluate(()=>localStorage.setItem('aone_guard_session_v1',JSON.stringify({access_token:'fixture',expires_at:9999999999999,user:{id:'user1'}})));
 await page.goto('https://guard.test/nfc.html');
 await page.waitForFunction(()=>document.querySelector('#headline').textContent==='Eingestempelt');
 assert.equal(requests.length,1);
 assert.equal(requests[0].p_request_id,pending.request_id);
 assert.equal(new URL(page.url()).searchParams.has('t'),false);
 assert.deepEqual(errors,[]);
});
