const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
process.env.TZ='Europe/Berlin';
const shift={id:'s',org_id:'org',employee_id:'e',site_id:'site',title:'Empfang',starts_at:'2026-09-28T08:00:00+02:00',ends_at:'2026-09-28T16:00:00+02:00',required_qualification:'sachkunde',status:'planned'};
function setup(seed={}){
 const data={guard_sites:[{id:'site',active:true}],guard_employees:[{id:'e',status:'active',qualification_level:'sachkunde'}],guard_leave_requests:[],guard_compliance_requirements:[],guard_qualifications:[],guard_shifts:[{...shift}],...seed};
 const calls=[],writes=[],failures=new Set(),nodes=new Map();let rejectUpdate=false;
 const node=k=>{if(!nodes.has(k))nodes.set(k,{value:'',checked:false,textContent:'',innerHTML:'',classList:{toggle(){},remove(){},add(){}},insertAdjacentHTML(_p,s){this.innerHTML+=s}});return nodes.get(k)};
 const matches=(r,q)=>[...new URLSearchParams(q)].every(([key,f])=>{
  if(['select','order','offset','limit','org_id'].includes(key))return true;
  const i=f.indexOf('.'),op=f.slice(0,i),v=f.slice(i+1);let a=r[key],b=v;
  if(key.endsWith('_at')){a=Date.parse(a);b=Date.parse(v);}
  if(op==='is')return r[key]==null;
  if(op==='eq')return String(a)===String(b);
  if(op==='neq')return String(a)!==String(b);
  if(op==='gt')return a>b;if(op==='gte')return a>=b;if(op==='lt')return a<b;if(op==='lte')return a<=b;
  throw Error('Unexpected filter '+f);
 });
 async function read(name,q){calls.push({name,q});if(failures.has(name))throw Error('Server unavailable: '+name);return (data[name]||[]).filter(r=>matches(r,q));}
 const context=vm.createContext({Date,Intl,URLSearchParams,encodeURIComponent,console,confirm:()=>true,document:{querySelector:node,querySelectorAll:()=>[],body:{classList:{toggle(){}}}},AONE:{table:read,tableAll:read,esc:s=>String(s).replaceAll('<','&lt;'),toast(){},update:async(name,q,value)=>{writes.push({name,q,value});if(rejectUpdate)return [];const rows=await read(name,q);rows.forEach(r=>Object.assign(r,value));return rows;},insert:async(name,value)=>{writes.push({name,value});data[name].push({...value,id:'new'})}}});
 let source=fs.readFileSync(path.join(__dirname,'../dienstplan.js'),'utf8');source=source.replace('  init();','  globalThis.planner={state,shiftDays,checkAssignment,checkConflict,staffingAt,releaseShift,confirmWeek,cloneShift,createQuick};');vm.runInContext(source,context);
 const p=context.planner;p.state.ctx={org_id:'org'};p.state.user={id:'u'};p.state.weekStart=new Date('2026-09-28T00:00:00+02:00');p.state.employees=data.guard_employees;p.state.sites=data.guard_sites;p.state.shifts=data.guard_shifts;
 return {p,data,calls,writes,failures,node,rejectUpdate:()=>{rejectUpdate=true}};
}
const absence=(kind='vacation',status='approved',day='2026-09-28')=>({id:'leave',employee_id:'e',kind,status,starts_on:day,ends_on:day});
const req={id:'r',active:true,mandatory:true,requirement_type:'qualification',requirement_key:'first_aid',label:'Erste Hilfe',site_id:'site'};
const qual={id:'q',employee_id:'e',kind:'first_aid',valid_from:'2026-01-01',valid_until:'2026-12-31',verified_at:'2026-01-01T12:00:00Z'};
test('approved vacation blocks assignment with a visible date range',async()=>{await assert.rejects(setup({guard_leave_requests:[absence()]}).p.checkAssignment(shift),/Genehmigte Abwesenheit: 2026-09-28/)});
test('pending sickness blocks; pending vacation and rejected sickness do not',async()=>{
 await assert.rejects(setup({guard_leave_requests:[absence('sick','pending')]}).p.checkAssignment(shift),/Krankmeldung/);
 await setup({guard_leave_requests:[absence('vacation','pending'),absence('sick','rejected')]}).p.checkAssignment(shift);
});
test('night shift checks the following day; midnight end excludes the next day',async()=>{
 const s=setup({guard_leave_requests:[absence('vacation','approved','2026-09-29')]});
 await assert.rejects(s.p.checkAssignment({...shift,starts_at:'2026-09-28T22:00:00+02:00',ends_at:'2026-09-29T06:00:00+02:00'}),/Abwesenheit/);
 await s.p.checkAssignment({...shift,starts_at:'2026-09-28T22:00:00+02:00',ends_at:'2026-09-29T00:00:00+02:00'});
});
test('inactive employee and stale qualification rank are rechecked from API',async()=>{
 const s=setup();s.data.guard_employees[0].status='inactive';await assert.rejects(s.p.checkAssignment(shift),/nicht aktiv/);
 s.data.guard_employees[0].status='active';s.data.guard_employees[0].qualification_level='none';await assert.rejects(s.p.checkAssignment(shift),/Qualifikationsstufe/);
});
test('inactive site blocks even unassigned shifts; canceled shifts remain cancellable',async()=>{
 const s=setup({guard_sites:[{id:'site',active:false}]});await assert.rejects(s.p.checkConflict({...shift,employee_id:null}),/Objekt/);await s.p.checkConflict({...shift,status:'canceled'});
});
test('missing, expired or unverified mandatory evidence blocks assignment',async()=>{
 for(const qs of [[],[{...qual,valid_until:'2026-09-27'}],[{...qual,verified_at:null}]])await assert.rejects(setup({guard_compliance_requirements:[req],guard_qualifications:qs}).p.checkAssignment(shift),/Pflichtnachweis/);
});
test('evidence must cover the whole night shift; renewal is considered',async()=>{
 const night={...shift,starts_at:'2026-09-28T22:00:00+02:00',ends_at:'2026-09-29T06:00:00+02:00'},old={...qual,valid_until:'2026-09-28'};
 const s=setup({guard_compliance_requirements:[req],guard_qualifications:[old]});await assert.rejects(s.p.checkAssignment(night),/Pflichtnachweis/);
 s.data.guard_qualifications.push({...qual,id:'renewal'});await s.p.checkAssignment(night);
});
test('global mandatory requirements apply; other sites and optional requirements do not',async()=>{
 await setup({guard_compliance_requirements:[{...req,site_id:'other'},{...req,id:'optional',mandatory:false}]}).p.checkAssignment(shift);
 await assert.rejects(setup({guard_compliance_requirements:[{...req,site_id:null}]}).p.checkAssignment(shift),/Pflichtnachweis/);
});
test('future qualification does not cover an earlier shift',async()=>{await assert.rejects(setup({guard_compliance_requirements:[req],guard_qualifications:[{...qual,valid_from:'2026-09-29'}]}).p.checkAssignment(shift),/Pflichtnachweis/)});
test('failed checks prevent release and make no write',async()=>{
 for(const name of ['guard_leave_requests','guard_qualifications','guard_compliance_requirements']){const s=setup();s.failures.add(name);await assert.rejects(s.p.releaseShift('s'),/Server unavailable/);assert.equal(s.writes.length,0)}
});
test('release rejects unassigned and already changed shifts',async()=>{
 for(const row of [{...shift,employee_id:null},{...shift,status:'canceled'}]){const s=setup({guard_shifts:[row]});await assert.rejects(s.p.releaseShift('s'));assert.equal(s.writes.length,0)}
});
test('release ignores itself but rejects overlapping other assignment',async()=>{
 const s=setup();await s.p.releaseShift('s');assert.equal(s.data.guard_shifts[0].status,'confirmed');
 const conflict=setup({guard_shifts:[{...shift},{...shift,id:'other'}]});await assert.rejects(conflict.p.releaseShift('s'),/Überschneidung/);assert.equal(conflict.writes.length,0);
});
test('minimum rest time rejects 10h59 and accepts the exact 11-hour boundary',async()=>{
 const s=setup();
 await assert.rejects(s.p.checkConflict({...shift,id:'later',starts_at:'2026-09-29T02:59:00+02:00',ends_at:'2026-09-29T04:00:00+02:00'}),/Ruhezeit unterschritten.*10 Std. 59 Min.*11 Std/);
 await s.p.checkConflict({...shift,id:'later',starts_at:'2026-09-29T03:00:00+02:00',ends_at:'2026-09-29T04:00:00+02:00'});
});
test('canceled neighboring shifts do not consume rest time',async()=>{
 const canceled={...shift,id:'old',status:'canceled'};
 const s=setup({guard_shifts:[canceled]});
 await s.p.checkConflict({...shift,id:'later',starts_at:'2026-09-28T16:01:00+02:00',ends_at:'2026-09-28T17:00:00+02:00'});
});
test('minimum staffing checks the full shift and counts distinct employees',()=>{
 const second={id:'e2',status:'active',qualification_level:'sachkunde'};
 const partial={...shift,id:'partial',employee_id:'e2',starts_at:'2026-09-28T10:00:00+02:00',ends_at:'2026-09-28T16:00:00+02:00'};
 const s=setup({guard_sites:[{id:'site',active:true,minimum_staff:2}],guard_employees:[{id:'e',status:'active',qualification_level:'sachkunde'},second],guard_shifts:[{...shift},partial]});
 assert.deepEqual(JSON.parse(JSON.stringify(s.p.staffingAt(shift))),{required:2,assigned:1,under:true});
 const full={...partial,starts_at:'2026-09-28T08:00:00+02:00'};
 s.data.guard_shifts[1]=full;s.p.state.shifts=s.data.guard_shifts;
 assert.deepEqual(JSON.parse(JSON.stringify(s.p.staffingAt(shift))),{required:2,assigned:2,under:false});
 s.data.guard_shifts.push({...full,id:'duplicate',employee_id:'e2'});
 assert.equal(s.p.staffingAt(shift).assigned,2);
});
test('release update guards all validated assignment fields and rejects zero updated rows',async()=>{
 const s=setup();s.rejectUpdate();await assert.rejects(s.p.releaseShift('s'),/Freigabe nicht bestätigt/);
 const q=new URLSearchParams(s.writes[0].q);for(const key of ['id','org_id','status','employee_id','site_id','starts_at','ends_at','required_qualification'])assert.ok(q.has(key),key);
});
test('week release preserves successes and reports each rejected shift',async()=>{
 const s=setup({guard_shifts:[{...shift},{...shift,id:'unassigned',employee_id:null}]});await s.p.confirmWeek();assert.equal(s.data.guard_shifts[0].status,'confirmed');assert.equal(s.data.guard_shifts[1].status,'planned');assert.match(s.node('#planner-msg').innerHTML,/1 Dienste freigegeben · 1 nicht freigegeben/);assert.match(s.node('#planner-msg').innerHTML,/Unbesetzte Dienste/);
});
test('copy to an absent day is rejected without writing',async()=>{
 const s=setup({guard_leave_requests:[absence('vacation','approved','2026-09-29')]});await s.p.cloneShift('s');assert.equal(s.writes.length,0);
});
