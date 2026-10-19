import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes,createRequire} from "node:module";
import {pathToFileURL} from "node:url";
import {makeXLSX} from "./xlsx-fixture.ts";
const require=createRequire(import.meta.url);
const berlin=readFileSync(new URL("../floot/helpers/berlinTime.tsx",import.meta.url),"utf8");
const berlinUrl="data:text/javascript;base64,"+Buffer.from(stripTypeScriptTypes(berlin,{mode:"transform"})).toString("base64");
const source=readFileSync(new URL("../floot/helpers/excelImport.tsx",import.meta.url),"utf8")
  .replace('import readExcelFile from "read-excel-file/browser";','import readExcelNode from '+JSON.stringify(pathToFileURL(require.resolve("read-excel-file/node")).href)+';const readExcelFile=(buffer)=>readExcelNode(Buffer.from(buffer));')
  .replace('"./berlinTime"',JSON.stringify(berlinUrl));
const {parseWorkbook,parseExcelFile,parseCSV}=await import("data:text/javascript;base64,"+Buffer.from(stripTypeScriptTypes(source,{mode:"transform"})).toString("base64"));
function workbook(grid:unknown[][],name="Liste"){return {SheetNames:[name],Sheets:{[name]:grid}};}
test("German employee headers and split names are parsed",()=>{
  const p=parseWorkbook(workbook([["Personalnummer","Vorname","Nachname","E-Mail","Telefon","Qualifikation"],["001","Ali","Afradi","ALI@example.test","0123","Sachkunde 34a"]]),"employees","liste.xlsx");
  assert.equal(p.rows[0].employeeNo,"001");assert.equal(p.rows[0].displayName,"Ali Afradi");assert.equal(p.rows[0].email,"ali@example.test");
});
test("blank rows keep actual Excel error row numbers",()=>{
  const p=parseWorkbook(workbook([["Name","Personalnummer"],[],["Ali",""]]),"employees","liste.xlsx");assert.equal(p.problems[0].row,3);
});
test("long-form shifts use Germany time and handle overnight shifts",()=>{
  const p=parseWorkbook(workbook([["Personalnummer","Objekt","Datum","Beginn","Ende"],["001","IKEA","07.10.2026","22:00","06:00"]]),"shifts","plan.xlsx");
  assert.equal(p.rows[0].startsAt,"2026-10-07T20:00:00.000Z");assert.equal(p.rows[0].endsAt,"2026-10-08T04:00:00.000Z");
});
test("Excel numeric dates and times are parsed",()=>{
  const p=parseWorkbook(workbook([["Personalnummer","Objekt","Datum","Beginn","Ende"],["001","IKEA",46302,0.5,20/24]]),"shifts","plan.xlsx");
  assert.equal(p.rows.length,1);assert.equal(p.rows[0].startsAt,"2026-10-07T10:00:00.000Z");
});
test("monthly matrices recognize dates, free days and unknown codes",()=>{
  const p=parseWorkbook(workbook([["Oktober 2026"],["Personalnummer","Objekt",7,8,9],["001","IKEA","12:00–20:00","frei","S1"]]),"shifts","matrix.xlsx");
  assert.equal(p.rows.length,1);assert.equal(p.problems.length,1);assert.match(p.problems[0].reason,/S1/);
});
test("ambiguous daylight saving times become a visible row error",()=>{
  const p=parseWorkbook(workbook([["Personalnummer","Objekt","Datum","Beginn","Ende"],["001","IKEA","25.10.2026","02:30","06:00"]]),"shifts","plan.xlsx");
  assert.equal(p.rows.length,0);assert.equal(p.problems.length,1);
});
test("actual XLSX file round-trip and upload guards",async()=>{
  assert.equal((await parseExcelFile(new File([await makeXLSX([["Name","Personalnummer"],["Ali","001"]])],"liste.xlsx"),"employees")).rows.length,1);
  await assert.rejects(()=>parseExcelFile(new File(["x"],"bad.txt"),"employees"),/XLSX/);
  await assert.rejects(()=>parseExcelFile(new File(["x"],"old.xls"),"employees"),/Alte XLS/);
  await assert.rejects(()=>parseExcelFile(new File([new Uint8Array(8*1024*1024+1)],"huge.xlsx"),"employees"),/groß/);
});
test("1904 date system is interpreted by the reader correctly",async()=>{
  const file=new File([await makeXLSX([["Personalnummer","Objekt","Datum","Beginn","Ende"],["001","IKEA",{excelDate:44840},"12:00","20:00"]],true)],"1904.xlsx");
  const p=await parseExcelFile(file,"shifts");assert.equal(p.rows[0].startsAt,"2026-10-07T10:00:00.000Z");
});
test("CSV parses quoted delimiters, line breaks, escaped quotes and BOM",()=>{
  const p=parseCSV('\uFEFFName;Personalnummer;Kommentar\r\n"Ali; Afradi";001;"A ""Zitat""\nB"');
  assert.equal(p[1][0],"Ali; Afradi");assert.equal(p[1][1],"001");assert.equal(p[1][2],'A "Zitat"\nB');
  assert.throws(()=>parseCSV('Name;Nr\n"offen'),/Anführungszeichen/);
});
