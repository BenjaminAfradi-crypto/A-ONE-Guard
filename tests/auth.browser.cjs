const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
let browser;
before(async()=>{browser=await chromium.launch({headless:true,executablePath:process.env.AONE_CHROMIUM_PATH||undefined,args:JSON.parse(process.env.AONE_CHROMIUM_ARGS||'[]')})});
after(async()=>browser?.close());

async function pageFor(t,file){
  const context=await browser.newContext({serviceWorkers:'block',locale:'de-DE'});
  t.after(()=>context.close());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));
  const calls=[];
  await context.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(u.hostname==='auth.test'){
      const name=u.pathname.slice(1)||file;
      const type=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.svg')?'image/svg+xml':'text/html';
      try{return route.fulfill({contentType:type,body:await fs.readFile(path.join(__dirname,'..',name))})}catch{return route.fulfill({status:404,body:'Not found'})}
    }
    assert.equal(u.hostname,'rwojydgekobbckpcvlnu.supabase.co');
    calls.push({method:req.method(),url:u.href,body:req.postDataJSON?.()});
    if(u.pathname.endsWith('/auth/v1/user')&&req.method()==='PUT')return route.fulfill({json:{id:'u1'}});
    if(u.pathname.includes('/auth/v1/recover'))return route.fulfill({json:{}});
    return route.fulfill({json:{}});
  });
  await page.goto('https://auth.test/'+file);
  return {page,calls};
}

for(const [file,mode] of [['login.html','employee'],['admin-login.html','admin']]){
  test(mode+' forgot-password requests the correct reset return URL',async t=>{
    const {page,calls}=await pageFor(t,file);
    await page.fill('input[name=email]',mode+'@example.invalid');
    await page.click('#forgot');
    await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('Zurücksetzen'));
    const call=calls.find(x=>x.url.includes('/auth/v1/recover'));
    assert.ok(call);
    const u=new URL(call.url),redirect=u.searchParams.get('redirect_to');
    assert.equal(redirect,'https://auth.test/reset-password.html?return='+mode);
    assert.equal(call.body.email,mode+'@example.invalid');
  });
}

test('developer forgot-password uses the shared recovery flow',async t=>{
  const {page,calls}=await pageFor(t,'developer-login.html');
  await page.fill('input[name=email]','dev@example.invalid');
  await page.click('#dev-forgot');
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent.includes('Reset-E-Mail'));
  const call=calls.find(x=>x.url.includes('/auth/v1/recover'));assert.ok(call);
  assert.equal(new URL(call.url).searchParams.get('redirect_to'),'https://auth.test/reset-password.html?return=developer');
});

test('reset page returns management recovery to management login',async t=>{
  const {page,calls}=await pageFor(t,'reset-password.html?return=admin#access_token=recovery-token&type=recovery');
  assert.equal(await page.locator('#reset-login-link').getAttribute('href'),'./admin-login.html');
  await page.fill('input[name=password]','PilotSecure123!');
  await page.fill('input[name=confirm]','PilotSecure123!');
  await page.click('button[type=submit]');
  await page.waitForURL(/admin-login\.html\?changed=1$/);
  const update=calls.find(x=>x.url.endsWith('/auth/v1/user')&&x.method==='PUT');
  assert.ok(update);assert.equal(update.body.password,'PilotSecure123!');
});

test('expired recovery link is blocked with a clear message',async t=>{
  const {page}=await pageFor(t,'reset-password.html?return=employee');
  assert.match(await page.locator('#reset-error').textContent(),/ungültig oder abgelaufen/i);
  assert.equal(await page.locator('button[type=submit]').isDisabled(),true);
});
