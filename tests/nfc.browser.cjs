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
 await page.goto('https://guard.test/nfc.html?t=test-token');await page.waitForSelector('#retry-btn:not([hidden])');await page.click('#retry-btn');await page.waitForFunction(()=>document.querySelector('#headline').textContent==='Eingestempelt');
 await page.reload();await page.waitForFunction(()=>document.querySelector('#headline').textContent==='Eingestempelt');assert.equal(receipts.size,1);assert.equal(requests.length,3);assert.ok(requests.every(a=>a.p_request_id===requests[0].p_request_id));
 await page.goto('https://guard.test/nfc.html?t=test-token');await page.waitForFunction(()=>document.querySelector('#headline').textContent==='Ausgestempelt');assert.equal(receipts.size,2);assert.deepEqual(errors,[]);
});
