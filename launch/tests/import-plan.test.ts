import test from "node:test";
import assert from "node:assert/strict";
import {loadHelper} from "./load-helper.ts";
const {planImport}=await loadHelper("importPlan");
const employee={id:"a",employeeNo:"001",displayName:"Ali Afradi",email:"ali@example.test",phone:null,qualification:null,active:true,userId:null};
const other={...employee,id:"b",employeeNo:"002",displayName:"Andere Person",email:"other@example.test"};
const row={row:2,sheet:"Mitarbeiter",employeeNo:"001",displayName:"Ali Afradi",email:"ali@example.test",phone:"",qualification:""};
const shift={row:2,sheet:"Dienste",employeeNo:"001",displayName:"",email:"",siteName:"IKEA",title:"Wache",startsAt:"2026-10-10T10:00:00Z",endsAt:"2026-10-10T18:00:00Z"};
const existing={employees:[employee,other],sites:[{id:"site",name:"IKEA",active:true}],shifts:[]};
test("new employees have no automatic account link",()=>{
  const p=planImport({kind:"employees",rows:[row]},{employees:[],sites:[],shifts:[]});
  assert.equal(p.created,1);assert.equal(p.employees[0].id,null);assert.equal(p.employees[0].row.employeeNo,"001");
});
test("repeat employee imports are idempotent",()=>{
  const p=planImport({kind:"employees",rows:[row]},existing);assert.equal(p.accepted,0);assert.equal(p.skipped,1);
});
test("conflicting personnel number and email are rejected",()=>{
  const p=planImport({kind:"employees",rows:[{...row,email:other.email}]},existing);
  assert.equal(p.accepted,0);assert.match(p.issues[0].reason,/verschiedene Mitarbeiter/);
});
test("connected email cannot be reassigned by spreadsheet",()=>{
  const p=planImport({kind:"employees",rows:[{...row,email:"new@example.test"}]},{...existing,employees:[{...employee,userId:"99"}]});
  assert.equal(p.accepted,0);assert.match(p.issues[0].reason,/Benutzerkontos/);
});
test("blank optional cells preserve existing values",()=>{
  const p=planImport({kind:"employees",rows:[{...row,displayName:"Ali neu",email:""}]},{...existing,employees:[{...employee,phone:"0123",qualification:"34a"}]});
  assert.equal(p.updated,1);assert.equal(p.employees[0].row.phone,"0123");assert.equal(p.employees[0].row.email,employee.email);
});
test("duplicate new employees in a file are rejected",()=>{
  const p=planImport({kind:"employees",rows:[row,{...row,row:3}]},{employees:[],sites:[],shifts:[]});
  assert.equal(p.created,1);assert.equal(p.skipped,1);
});
test("a foreign tenant identity cannot match the provided tenant snapshot",()=>{
  const p=planImport({kind:"shifts",rows:[{...shift,employeeNo:"foreign"}]},existing);
  assert.equal(p.accepted,0);assert.equal(p.unmatched,1);
});
test("unknown personnel number never falls back to matching name",()=>{
  const p=planImport({kind:"shifts",rows:[{...shift,employeeNo:"missing",displayName:employee.displayName}]},existing);
  assert.equal(p.accepted,0);
});
test("ambiguous names do not receive shifts",()=>{
  const p=planImport({kind:"shifts",rows:[{...shift,employeeNo:"",displayName:employee.displayName}]},{...existing,employees:[employee,{...other,displayName:employee.displayName}]});
  assert.equal(p.accepted,0);
});
test("shifts are assigned to the resolved employee",()=>{
  const p=planImport({kind:"shifts",rows:[shift]},existing);assert.equal(p.created,1);assert.equal(p.shifts[0].employeeId,"a");
});
test("exact duplicate shifts are skipped within file",()=>{
  const p=planImport({kind:"shifts",rows:[shift,{...shift,row:3}]},existing);assert.equal(p.created,1);assert.equal(p.skipped,1);
});
test("exact duplicate shifts are skipped against stored shifts",()=>{
  const p=planImport({kind:"shifts",rows:[shift]},{...existing,shifts:[{id:"s",siteId:"site",employeeId:"a",startsAt:shift.startsAt,endsAt:shift.endsAt,status:"planned"}]});
  assert.equal(p.created,0);assert.equal(p.skipped,1);
});
test("overlaps are rejected while adjacent shifts are allowed",()=>{
  const p=planImport({kind:"shifts",rows:[shift,{...shift,row:3,startsAt:"2026-10-10T17:00:00Z",endsAt:"2026-10-10T20:00:00Z"},{...shift,row:4,startsAt:"2026-10-10T18:00:00Z",endsAt:"2026-10-10T20:00:00Z"}]},existing);
  assert.equal(p.created,2);assert.equal(p.issues.length,1);
});
test("new sites are normalized and created once",()=>{
  const p=planImport({kind:"shifts",rows:[{...shift,siteName:"Neues Objekt"},{...shift,employeeNo:"002",siteName:" neues   objekt "}]},existing);
  assert.deepEqual(p.newSites,["Neues Objekt"]);assert.equal(p.created,2);
});
test("inactive employees and sites are not silently activated",()=>{
  assert.equal(planImport({kind:"shifts",rows:[shift]},{...existing,employees:[{...employee,active:false}]}).created,0);
  assert.equal(planImport({kind:"shifts",rows:[shift]},{...existing,sites:[{id:"site",name:"IKEA",active:false}]}).created,0);
});
test("canceled shifts do not block replacement",()=>{
  const p=planImport({kind:"shifts",rows:[shift]},{...existing,shifts:[{id:"s",siteId:"site",employeeId:"a",startsAt:shift.startsAt,endsAt:shift.endsAt,status:"canceled"}]});
  assert.equal(p.created,1);
});
test("invalid and reversed intervals are rejected",()=>{
  for(const patch of [{startsAt:"bad"},{endsAt:shift.startsAt},{endsAt:"2026-10-12T18:00:00Z"}]){
    assert.equal(planImport({kind:"shifts",rows:[{...shift,...patch}]},existing).accepted,0);
  }
});
