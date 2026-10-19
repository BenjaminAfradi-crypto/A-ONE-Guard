const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
let browser;
before(async () => {
  browser = await chromium.launch({headless:true,executablePath:process.env.AONE_CHROMIUM_PATH||undefined,args:JSON.parse(process.env.AONE_CHROMIUM_ARGS||'[]')});
});
after(async () => browser?.close());
async function openPage(t,file='index.html',width=1280) {
  const context = await browser.newContext({viewport:{width,height:860},serviceWorkers:'block',locale:'de-DE'});
  t.after(() => context.close());
  const page = await context.newPage();
  const jsErrors=[];
  page.on('pageerror',e=>jsErrors.push(e.message));
  t.after(() => assert.deepEqual(jsErrors,[]));
  await context.route('**/*',async route => {
    const u=new URL(route.request().url);
    if(u.hostname!=='launch.test') return route.abort();
    const filename=u.pathname.replace(/^\/+/,'')||'index.html';
    if(filename.includes('..'))return route.fulfill({status:400,body:'Invalid path'});
    const suffix=path.extname(filename);
    const contentType={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'}[suffix]||'text/plain';
    try {
      const bytes=await fs.readFile(path.join(__dirname,'..',filename));
      await route.fulfill({contentType,body:bytes});
    }catch{await route.fulfill({status:404,body:'Not found'});}
  });
  await page.goto('https://launch.test/'+file);
  return page;
}
test('marketing homepage offers demo and real login destinations', async t => {
  const page=await openPage(t);
  assert.equal(await page.title(),'A ONE Guard | Software für Sicherheitsunternehmen');
  assert.equal(await page.locator('a[href="./demo.html"]').count(),2);
  assert.ok(await page.locator('a[href="./login.html"]').count() >= 1);
  assert.ok(await page.locator('a[href="./admin-login.html"]').count() >= 1);
  assert.ok(await page.locator('a[href="./register.html"]').count() >= 1);
  assert.equal(await page.locator('.feature-card').count(),6);
  assert.ok(await page.getByText('FIKTIVE DATEN').count()>=1);
});
test('homepage fits iPhone-sized viewports without horizontal overflow', async t => {
  const page=await openPage(t,'index.html',390);
  await page.waitForLoadState('load');
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(dimensions.scroll <= dimensions.width+2,JSON.stringify(dimensions));
  assert.equal(await page.locator('#main').isVisible(),true);
  assert.equal(await page.locator('a[href="./demo.html"]').first().isVisible(),true);
});
test('all public marketing internal destinations exist', async t => {
  const page=await openPage(t);
  const links=await page.locator('main a[href^="./"], footer a[href^="./"]').evaluateAll(nodes=>Array.from(new Set(nodes.map(n=>n.getAttribute('href')))));
  for(const link of links){
    const target=path.join(__dirname,'..',link.replace(/^\.\//,'').split('#')[0]);
    assert.equal((await fs.stat(target)).isFile(),true,link);
  }
});
