const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
let browser;
before(async()=>{browser=await chromium.launch({
  headless:true,executablePath:process.env.AONE_CHROMIUM_PATH||undefined,
  args:JSON.parse(process.env.AONE_CHROMIUM_ARGS||'[]')
})});
after(async()=>browser?.close());

async function openDocuments(t,{failUpload=false}={}){
  const context=await browser.newContext({serviceWorkers:'block'});
  t.after(()=>context.close());
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  t.after(()=>assert.deepEqual(errors,[]));
  const core=`(()=>{
    const calls=window.documentTestCalls=[];
    const doc={
      id:'doc1',document_no:'I-2031-000001',title:'Original document',
      stage:'inbox',status:'draft',direction:'inbound',
      category:'other',classification:'internal',
      access_scope:'management',version_no:1,
      employee_id:null,site_id:null,metadata:{},
      storage_path:'org1/management/original.pdf',original_filename:'original.pdf'
    };
    window.AONE={
      esc:v=>String(v??''),
      d:s=>String(s||''),
      roleLabel:r=>r,
      session:async()=>({access_token:'test'}),
      chooseContext:async()=>({org_id:'org1',org:{name:'Synthetic company'},role:'owner'}),
      isManager:()=>true,
      loading:()=>{},
      toast:(msg,type)=>calls.push({kind:'toast',msg,type}),
      table:async name=>name==='guard_document_register'?[doc]:[],
      rpc:async(name,args)=>{
        calls.push({kind:'rpc',name,args});
        if(name==='guard_new_document_version')return 'doc2';
        return 0;
      },
      storageUpload:async(bucket,storagePath,file)=>{
        calls.push({kind:'upload',bucket,storagePath,size:file.size,name:file.name});
        if(${failUpload})throw new Error('Test upload failure');
        return {path:storagePath};
      },
      update:async()=>{}
    };
  })();`;
  await context.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.hostname!=='document.test')return route.abort();
    const filename=u.pathname.slice(1)||'documents.html';
    if(filename.includes('..'))return route.fulfill({status:400,body:'Invalid path'});
    if(filename==='core.js')return route.fulfill({contentType:'text/javascript',body:core});
    if(filename==='register-sw.js')return route.fulfill({contentType:'text/javascript',body:''});
    const ct=filename.endsWith('.js')?'text/javascript':filename.endsWith('.css')?'text/css':filename.endsWith('.svg')?'image/svg+xml':'text/html';
    try{return route.fulfill({contentType:ct,body:await fs.readFile(path.join(__dirname,'..',filename))})}
    catch{return route.fulfill({status:404,body:'not found'})}
  });
  await page.goto('https://document.test/documents.html');
  await page.waitForSelector('button.version-doc');
  await page.click('button.version-doc');
  await page.locator('#v-file').setInputFiles({
    name:'updated.txt',mimeType:'text/plain',buffer:Buffer.from('Updated contract content')
  });
  await page.locator('#version-form button[type=submit]').click();
  return page;
}

test('new version uploads binary before writing metadata to RPC',async t=>{
  const page=await openDocuments(t);
  await page.waitForFunction(()=>window.documentTestCalls.some(c=>c.kind==='rpc'&&c.name==='guard_new_document_version'));
  const calls=await page.evaluate(()=>window.documentTestCalls);
  const uploadAt=calls.findIndex(c=>c.kind==='upload');
  const rpcAt=calls.findIndex(c=>c.kind==='rpc'&&c.name==='guard_new_document_version');
  assert.ok(uploadAt>=0,'no binary upload');
  assert.ok(rpcAt>uploadAt,'metadata inserted before binary upload');
  const upload=calls[uploadAt],rpc=calls[rpcAt];
  assert.equal(upload.bucket,'guard-documents');
  assert.equal(upload.name,'updated.txt');
  assert.match(upload.storagePath,/^org1\/management\/\d+-[a-f0-9-]+-updated\.txt$/);
  assert.equal(rpc.args.p_storage_path,upload.storagePath,'RPC must reference uploaded object');
  assert.equal(rpc.args.p_original_filename,'updated.txt');
  assert.match(rpc.args.p_checksum_sha256,/^[a-f0-9]{64}$/);
  assert.ok(calls.some(c=>c.kind==='toast'&&c.msg==='Neue Version angelegt.'));
});

test('upload failure leaves document version metadata unchanged',async t=>{
  const page=await openDocuments(t,{failUpload:true});
  await page.waitForFunction(()=>window.documentTestCalls.some(c=>c.kind==='toast'&&c.type==='err'));
  const calls=await page.evaluate(()=>window.documentTestCalls);
  assert.equal(calls.filter(c=>c.kind==='upload').length,1);
  assert.equal(calls.some(c=>c.kind==='rpc'&&c.name==='guard_new_document_version'),false,
    'document version was registered despite storage upload failure');
  assert.ok(calls.some(c=>c.kind==='toast'&&c.msg==='Test upload failure'));
});
