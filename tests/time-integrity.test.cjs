const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
function core(fetch=async()=>{throw Error('Unexpected network request')}){
 const values=new Map([['aone_guard_session_v1',JSON.stringify({access_token:'test',expires_at:Date.now()+3600000,user:{id:'user1'}})]]);
 const context=vm.createContext({URLSearchParams,Date,Intl,Response,fetch,document:{addEventListener(){}},localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},setTimeout,clearTimeout});
 vm.runInContext(fs.readFileSync(path.join(root,'core.js'),'utf8')+'\nglobalThis.api=AONE;',context);return context.api;
}
const e={id:'e',clock_in_at:'2026-09-28T08:00:00Z',clock_out_at:'2026-09-28T16:00:00Z'};
const pause=(start,end,id='e')=>({time_entry_id:id,started_at:`2026-09-28T${start}:00Z`,ended_at:end?`2026-09-28T${end}:00Z`:null});
test('eight hours with a half-hour pause yields 7.5 net hours',()=>{
 const h=core().entryHours(e,[pause('12:00','12:30')]);assert.equal(h.gross,8);assert.equal(h.breaks,.5);assert.equal(h.net,7.5);
});
test('overlapping and duplicate pauses are subtracted only once; foreign pauses ignored',()=>{
 const h=core().entryHours(e,[pause('12:00','13:00'),pause('12:30','13:30'),pause('12:00','13:00'),pause('08:00','16:00','other')]);assert.equal(h.net,6.5);
});
test('pauses outside corrected shift boundaries are clipped',()=>{
 const h=core().entryHours(e,[pause('07:00','09:00'),pause('15:30','17:00')]);assert.equal(h.net,6.5);
});
test('an open pause ends at clock-out, not the current day',()=>{
 assert.equal(core().entryHours(e,[pause('15:00',null)],{now:Date.parse('2026-10-01')}).net,7);
});
test('ongoing shift and pause use one supplied observation time',()=>{
 const h=core().entryHours({...e,clock_out_at:null},[pause('12:00',null)],{now:Date.parse('2026-09-28T12:30Z')});assert.equal(h.gross,4.5);assert.equal(h.net,4);
});
test('cross-month night shift and pause split without lost or duplicated hours',()=>{
 const a=core(),entry={id:'night',clock_in_at:'2026-08-31T22:00:00+02:00',clock_out_at:'2026-09-01T06:00:00+02:00'},b=[{time_entry_id:'night',started_at:'2026-08-31T23:30:00+02:00',ended_at:'2026-09-01T00:30:00+02:00'}],boundary='2026-09-01T00:00:00+02:00';
 assert.equal(a.entryHours(entry,b,{to:boundary}).net,1.5);assert.equal(a.entryHours(entry,b,{from:boundary}).net,5.5);assert.equal(a.entryHours(entry,b).net,7);
});
test('DST fall-back measures elapsed time and invalid records fail visibly',()=>{
 const a=core();assert.equal(a.entryHours({id:'dst',clock_in_at:'2026-10-25T01:00:00+02:00',clock_out_at:'2026-10-25T04:00:00+01:00'},[]).net,4);
 assert.throws(()=>a.entryHours({...e,clock_out_at:'invalid'},[]),/Ungültige/);
 assert.throws(()=>a.entryHours(e,[pause('13:00','12:00')]),/Ungültige Pause/);
});
test('pagination loads all 1,201 records and preserves filters and deterministic order',async()=>{
 const calls=[],all=Array.from({length:1201},(_,id)=>({id}));const a=core(async url=>{const p=new URL(url).searchParams;calls.push(p);return Response.json(all.slice(Number(p.get('offset')),Number(p.get('offset'))+Number(p.get('limit'))));});
 const rows=await a.tableAll('guard_time_entries','org_id=eq.org1&order=clock_in_at.desc');assert.equal(rows.length,1201);assert.equal(calls.length,3);
 for(const p of calls){assert.equal(p.get('org_id'),'eq.org1');assert.equal(p.get('order'),'clock_in_at.desc,id.asc');}
});
test('pagination failure never returns a partial monthly total',async()=>{
 let n=0;const a=core(async()=>++n===1?Response.json(Array.from({length:500},(_,id)=>({id}))):Response.json({message:'offline'},{status:503}));await assert.rejects(a.tableAll('guard_time_entries'),/offline/);
});
test('pause requests batch entry IDs and propagate failures',async()=>{
 let calls=0;const a=core(async url=>{calls++;assert.ok(new URL(url).searchParams.get('time_entry_id').split(',').length<=50);return Response.json([]);});await a.entryBreaks(Array.from({length:121},(_,id)=>({id})));assert.equal(calls,3);
 await assert.rejects(core(async()=>Response.json({message:'pause unavailable'},{status:503})).entryBreaks([e]),/pause unavailable/);
});
// Execute the actual access transition function with injected API/DOM boundaries.
async function toggle({status='active',rpcFails=false,profileFails=false,confirmed=true}={}){
 const nodes=new Map(),events=[],messages=[];const $=k=>{if(!nodes.has(k))nodes.set(k,{disabled:false});return nodes.get(k)};
 const state={current:{id:'e',user_id:'u',status},ctx:{org_id:'org'}};
 const ctx=vm.createContext({$,state,encodeURIComponent,msg:(_el,m)=>messages.push(m),close:()=>events.push('close'),load:async()=>events.push('reload'),AONE:{loading(){},toast:(m,kind)=>messages.push({m,kind}),rpc:async()=>{events.push('access');if(rpcFails)throw Error('RPC failed')},table:async()=>[{active:confirmed?(status!=='active'):(status==='active')}],update:async()=>{events.push('profile');if(profileFails)throw Error('PATCH failed');return [{id:'e'}]}}});
 const s=fs.readFileSync(path.join(root,'mitarbeiter.js'),'utf8');vm.runInContext(s.slice(s.indexOf('async function toggleActive()'),s.indexOf('async function savePrivate()')),ctx);await vm.runInContext('toggleActive()',ctx);return {events,messages,nodes};
}
test('failed access revocation does not mark employee inactive or show success',async()=>{
 const r=await toggle({rpcFails:true});assert.deepEqual(r.events,['access']);assert.ok(r.messages.some(x=>x.kind==='err'));assert.equal(r.nodes.get('#toggle-active').disabled,false);
});
test('deactivation revokes and confirms access before updating employee status',async()=>{
 assert.deepEqual((await toggle()).events,['access','profile','reload','close']);
 assert.deepEqual((await toggle({confirmed:false})).events,['access']);
});
test('activation grants access last; partial failure is clearly reported',async()=>{
 const r=await toggle({status:'inactive',rpcFails:true});assert.deepEqual(r.events,['profile','access']);assert.ok(r.messages.some(x=>typeof x==='string'&&x.includes('Personalstatus gespeichert; Zugang nicht bestätigt')));
 const s=await toggle({profileFails:true});assert.ok(s.messages.some(x=>typeof x==='string'&&x.includes('Zugangsstatus gespeichert')));
});
function pageContext(api){
 const elements=new Map();const node=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',disabled:false,classList:{add(){},remove(){}}});return elements.get(id)};
 const context=vm.createContext({AONE:api,Date,Intl,Number,Map,Set,URLSearchParams,encodeURIComponent,document:{querySelector:node,querySelectorAll:()=>[]},location:{replace(){}},setTimeout,clearTimeout});
 return {context,node};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('payroll includes a month-boundary shift and disables exports after pause-load failure',async()=>{
 const a=core(),now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),1),entry={id:'e',employee_id:'emp',clock_in_at:new Date(+start-3600000).toISOString(),clock_out_at:new Date(+start+2*3600000).toISOString()};
 let failure=false;const queries=[];
 const {context,node}=pageContext({...a,loading(){},toast(){},session:async()=>({user:{id:'u'}}),chooseContext:async()=>({org_id:'org',org:{name:'Test'},role:'admin'}),table:async()=>[],tableAll:async(name,q)=>{queries.push([name,q]);return name==='guard_employees'?[{id:'emp',display_name:'Test',hourly_rate_cents:1700}]:[entry]},entryBreaks:async()=>{if(failure)throw Error('Pause unavailable');return [{time_entry_id:'e',started_at:new Date(+start-1800000).toISOString(),ended_at:new Date(+start+1800000).toISOString()}]}});
 vm.runInContext(fs.readFileSync(path.join(root,'payroll.js'),'utf8'),context);await settle();
 assert.equal(node('#st-hours').textContent,'1.50');assert.equal(node('#csv').disabled,false);
 const q=queries.find(([n])=>n==='guard_time_entries')[1];assert.ok(q.includes('clock_out_at=gt.'));assert.ok(!q.includes('clock_in_at=gte.'));
 failure=true;await node('#load').onclick();assert.equal(node('#st-hours').textContent,'—');assert.equal(node('#csv').disabled,true);assert.equal(node('#snapshot').disabled,true);assert.match(node('#payroll-table').textContent,/unvollständig/);
});
test('management time view never substitutes zero pauses after a failed refresh',async()=>{
 const a=core(),now=new Date(),start=new Date(now);start.setHours(0,0,0,0);let failure=false;
 const entry={id:'e',clock_in_at:new Date(+start+3600000).toISOString(),clock_out_at:new Date(+start+3*3600000).toISOString()};
 const {context,node}=pageContext({...a,loading(){},toast(){},session:async()=>({user:{id:'u'}}),chooseContext:async()=>({org_id:'org',org:{name:'Test'},role:'admin'}),table:async()=>[],tableAll:async()=>[entry],entryBreaks:async()=>{if(failure)throw Error('offline');return []}});
 vm.runInContext(fs.readFileSync(path.join(root,'arbeitszeiten.js'),'utf8'),context);await settle();assert.equal(node('#m-hours').textContent,'2');
 failure=true;await node('#refresh').onclick();assert.equal(node('#m-hours').textContent,'—');assert.match(node('#time-list').textContent,/nicht vollständig/);
});
