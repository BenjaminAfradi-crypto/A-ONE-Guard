const {test,before,after}=require('node:test');const assert=require('node:assert/strict');const {createHash}=require('node:crypto');
const {launch,setup,save}=require('./helpers/modules.cjs');let browser;
before(async()=>{browser=await launch()});after(async()=>browser?.close());
test('Manager creates task, employee completes assigned task and sees persisted feedback',async t=>{
 const h=await setup(t,browser,'quality');const {page,db}=h;
 await page.click('[data-action=new-task]');await page.fill('#field-title','Tor kontrollieren');await page.selectOption('#field-site_id','site1');await page.selectOption('#field-employee_id','emp1');await page.fill('#field-due_at','2026-09-22T14:00');await save(page);
 assert.equal(db.guard_tasks[0].title,'Tor kontrollieren');assert.equal(db.guard_tasks[0].due_at,'2026-09-22T12:00:00.000Z');
 db.guard_memberships[0].role='employee';await h.open('meine-aufgaben');await page.click('[data-action=complete-task]');await page.fill('#field-note','Tor abgeschlossen');await save(page);
 assert.equal(db.guard_tasks[0].status,'done');assert.match(await page.locator('#module-content').textContent(),/Tor abgeschlossen/);
});
test('Quality audit can be created, edited, scored and closed',async t=>{
 const {page,db}=await setup(t,browser,'quality');await page.click('[data-action=new-audit]');await page.fill('#field-title','Objektkontrolle');await page.fill('#field-score_percent','85');await page.fill('#field-findings','Schlüssel fehlt');await save(page);
 await page.click('[data-action=edit-audit]');await page.fill('#field-corrective_actions','Schlüssel ersetzt');await page.selectOption('#field-status','closed');await save(page);
 assert.equal(db.guard_quality_audits[0].status,'closed');assert.equal(db.guard_quality_audits[0].score_percent,85);
});
test('Form builder to required employee submission to manager review, historical snapshot preserved',async t=>{
 const h=await setup(t,browser,'forms-admin');const {page,db}=h;
 await page.click('[data-action=new-template]');await page.fill('#field-name','Schließkontrolle');await page.selectOption('#field-site_id','site1');await page.locator('[data-prop=label]').fill('Alle Türen geschlossen');await save(page);
 db.guard_memberships[0].role='employee';await h.open('meine-formulare');await page.click('[data-action=fill-template]');
 assert.equal(await page.locator('#module-editor').evaluate(f=>f.checkValidity()),false);
 await page.locator('#module-editor input[type=checkbox]').check();await save(page);assert.equal(db.guard_form_submissions.length,1);
 const key=db.guard_form_templates[0].fields[0].key;assert.equal(db.guard_form_submissions[0].responses[key],true);
 db.guard_form_templates[0].fields[0].label='Neue Frage';db.guard_memberships[0].role='admin';await h.open('forms-admin');await page.click('[data-action=view-submission]');
 assert.match(await page.locator('#module-dialog').textContent(),/Alle Türen geschlossen/);assert.doesNotMatch(await page.locator('#module-dialog').textContent(),/Neue Frage/);await save(page);assert.equal(db.guard_form_submissions[0].status,'reviewed');
});
test('Automation rule creation and pause are stored',async t=>{
 const {page,db}=await setup(t,browser,'automation');await page.click('[data-action=new-rule]');await page.fill('#field-name','Dokumentfristen');await page.selectOption('#field-trigger_type','document_expiry');await page.selectOption('#field-action_type','task');await save(page);
 assert.equal(db.guard_automation_rules[0].config.days,30);await page.click('[data-action=toggle-rule]');await page.waitForFunction(()=>document.querySelector('#module-content').textContent.includes('Pausiert'));assert.equal(db.guard_automation_rules[0].active,false);
});
test('Lone worker start, checkin and close invoke the corresponding RPCs',async t=>{
 const {page,db,writes}=await setup(t,browser,'lone-worker','employee');await page.click('[data-action=start-session]');await page.selectOption('#field-site_id','site1');await save(page);await page.click('[data-action=checkin]');await page.waitForFunction(()=>document.querySelector('#module-message').textContent.includes('Rückmeldung gespeichert'));
 await page.click('[data-action=close-session]');await save(page);assert.equal(db.guard_lone_worker_sessions[0].status,'closed');assert.ok(writes.some(w=>w.rpc==='guard_lone_worker_checkin'));
});
test('API key stores only SHA256 hash, displays once, supports revocation',async t=>{
 const {page,db}=await setup(t,browser,'developer-platform');await page.click('[data-action=new-key]');await page.fill('#field-name','Test integration');await page.locator('#module-editor button[type=submit]').click();await page.waitForSelector('.module-secret');
 const raw=await page.locator('.module-secret').textContent();assert.match(raw,/^aone_[a-f0-9]{64}$/);assert.equal(db.guard_api_keys[0].key_hash,createHash('sha256').update(raw).digest('hex'));assert.ok(!JSON.stringify(db.guard_api_keys).includes(raw));
 await page.click('#editor-close');await page.click('[data-action=revoke-key]');await save(page);assert.equal(db.guard_api_keys[0].active,false);
});
test('All modules load on mobile, employee cannot open management pages, refresh failures are visible',async t=>{
 const h=await setup(t,browser,'live-operations');await h.page.setViewportSize({width:390,height:844});
 for(const module of ['live-operations','intelligence','proof-service','quality','forms-admin','automation','developer-platform','meine-aufgaben','meine-formulare','lone-worker']){
  await h.open(module);assert.equal(await h.page.locator('#module-message').isHidden(),true,module);assert.ok(await h.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),module);
 }
 await h.open('quality');h.failures.add('guard_tasks');await h.page.click('#refresh');await h.page.waitForFunction(()=>document.querySelector('#module-message').textContent.includes('Server nicht erreichbar'));
 h.db.guard_memberships[0].role='employee';await h.open('forms-admin');assert.match(await h.page.locator('#module-message').textContent(),/Management-Zugang/);assert.equal(await h.page.locator('[data-action=new-template]').count(),0);
});
test('Pagination loads beyond 500 records and stored markup is escaped',async t=>{
 const tasks=Array.from({length:501},(_,i)=>({id:'task-'+i,org_id:'org1',title:i===500?'<img src=x onerror="alert(1)">':'Task '+i,status:'open',employee_id:'emp1'}));
 const {page,calls}=await setup(t,browser,'meine-aufgaben','employee',{guard_tasks:tasks});assert.equal(await page.locator('.module-card').count(),501);assert.equal(await page.locator('#module-content img').count(),0);assert.ok(calls.some(c=>c.name==='guard_tasks'&&c.query.includes('offset=500')));
});
