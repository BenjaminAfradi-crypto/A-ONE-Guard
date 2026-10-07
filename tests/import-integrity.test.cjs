const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('import-core.js','utf8')+'\n;globalThis.__AONE_IMPORT=AONE_IMPORT;';
const context={Intl,Date,console};vm.createContext(context);vm.runInContext(source,context);
const I=context.__AONE_IMPORT;

test('employee import recognizes common German columns and normalizes qualification',()=>{
  const parsed=I.parseWorkbook({SheetNames:['Personal'],Sheets:{Personal:[
    ['Personal-Nr','Vorname','Nachname','E-Mail','Telefon','34a'],
    ['A-17','Ada','Muster','ada@example.de','0151 123','Sachkunde §34a']
  ]}},'employees');
  assert.equal(parsed.problems.length,0);
  assert.equal(parsed.rows.length,1);
  assert.equal(parsed.rows[0].employee_no,'A-17');
  assert.equal(parsed.rows[0].display_name,'Ada Muster');
  assert.equal(parsed.rows[0].qualification_level,'sachkunde');
});

test('employee mapping can override unknown customer headers',()=>{
  const book={SheetNames:['Export'],Sheets:{Export:[
    ['PersKey','Person','Kontakt'],
    ['42','Max Beispiel','max@example.de']
  ]}};
  const parsed=I.parseWorkbook(book,'employees',{employeeNo:'PersKey',displayName:'Person',email:'Kontakt'});
  assert.equal(parsed.rows.length,1);
  assert.equal(parsed.rows[0].employee_no,'42');
  assert.equal(parsed.rows[0].display_name,'Max Beispiel');
});

test('long Dienstplan format parses German date and overnight shift in Europe/Berlin',()=>{
  const parsed=I.parseWorkbook({SheetNames:['Oktober'],Sheets:{Oktober:[
    ['Personalnummer','Objekt','Datum','Beginn','Ende','Tätigkeit'],
    ['7','IKEA Frankfurt','12.10.2026','22:00','06:00','Objektschutz']
  ]}},'shifts');
  assert.equal(parsed.problems.length,0);
  assert.equal(parsed.rows.length,1);
  assert.equal(parsed.rows[0].site_name,'IKEA Frankfurt');
  assert.equal((new Date(parsed.rows[0].ends_at)-new Date(parsed.rows[0].starts_at))/3600000,8);
});

test('monthly matrix distributes shifts from date columns',()=>{
  const parsed=I.parseWorkbook({SheetNames:['Oktober 2026'],Sheets:{'Oktober 2026':[
    ['Dienstplan Oktober 2026','','',''],
    ['Personalnummer','Name','Objekt','1','2'],
    ['11','Erika Muster','Objekt A','08:00-16:00','frei']
  ]}},'shifts');
  assert.equal(parsed.rows.length,1);
  assert.equal(parsed.rows[0].employee_no,'11');
  assert.equal(parsed.rows[0].site_name,'Objekt A');
});

test('employee planner rejects duplicate file identity and protects linked account email',()=>{
  const employees=[{id:'e1',employee_no:'1',display_name:'Alt',email:'old@example.de',phone:null,qualification_level:'none',status:'active',user_id:'u1'}];
  const rows=[
    {sheet:'P',row:2,employee_no:'1',display_name:'Neu',email:'new@example.de',phone:'',qualification_level:'none'},
    {sheet:'P',row:3,employee_no:'2',display_name:'Zwei',email:'zwei@example.de',phone:'',qualification_level:'none'},
    {sheet:'P',row:4,employee_no:'2',display_name:'Zwei doppelt',email:'zwei2@example.de',phone:'',qualification_level:'none'}
  ];
  const plan=I.planEmployees(rows,employees);
  assert.equal(plan.accepted.length,1);
  assert.equal(plan.created,1);
  assert.equal(plan.issues.length,2);
});

test('shift planner matches employee and site, rejects overlap and minimum rest violation',()=>{
  const base={employees:[{id:'e1',employee_no:'1',display_name:'A',email:'a@example.de',status:'active'}],sites:[{id:'s1',name:'Objekt A',active:true}],shifts:[
    {employee_id:'e1',site_id:'s1',starts_at:'2026-10-10T06:00:00.000Z',ends_at:'2026-10-10T14:00:00.000Z',status:'planned'}
  ],restMinutes:660,createMissingSites:true};
  const rows=[
    {sheet:'D',row:2,employee_no:'1',display_name:'A',email:'',site_name:'Objekt A',title:'Dienst',starts_at:'2026-10-10T13:00:00.000Z',ends_at:'2026-10-10T20:00:00.000Z'},
    {sheet:'D',row:3,employee_no:'1',display_name:'A',email:'',site_name:'Objekt A',title:'Dienst',starts_at:'2026-10-10T22:00:00.000Z',ends_at:'2026-10-11T04:00:00.000Z'},
    {sheet:'D',row:4,employee_no:'1',display_name:'A',email:'',site_name:'Neues Objekt',title:'Dienst',starts_at:'2026-10-11T02:00:00.000Z',ends_at:'2026-10-11T10:00:00.000Z'}
  ];
  const plan=I.planShifts(rows,base);
  assert.equal(plan.accepted.length,1);
  assert.deepEqual([...plan.newSites],['Neues Objekt']);
  assert.equal(plan.issues.length,2);
});

test('shift planner requires unambiguous employee match',()=>{
  const plan=I.planShifts([{sheet:'D',row:2,employee_no:'99',display_name:'',email:'',site_name:'A',title:'Dienst',starts_at:'2026-10-10T08:00:00Z',ends_at:'2026-10-10T16:00:00Z'}],
    {employees:[],sites:[{id:'s1',name:'A',active:true}],shifts:[],restMinutes:660,createMissingSites:true});
  assert.equal(plan.accepted.length,0);
  assert.match(plan.issues[0].reason,/Mitarbeiter fehlt/);
});


test('Dienstplan apply uses the guarded atomic RPC instead of direct browser writes',()=>{
  const ui=fs.readFileSync('import-center.js','utf8');
  assert.match(ui,/guard_apply_schedule_import/);
  assert.doesNotMatch(ui,/AONE\.insert\(['"]guard_shifts['"]/);
  assert.doesNotMatch(ui,/AONE\.insert\(['"]guard_schedule_import_batches['"]/);
});
