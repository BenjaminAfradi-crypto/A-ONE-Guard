const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('service worker pre-caches scripts required by the login and setup pages',()=>{
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  for(const file of ['auth-page.js','developer-password-setup.js']){
    assert.ok(fs.statSync(path.join(root,file)).isFile(),file+' missing');
    assert.ok(sw.includes("'./"+file+"'"),file+' missing from PWA cache');
  }
});
