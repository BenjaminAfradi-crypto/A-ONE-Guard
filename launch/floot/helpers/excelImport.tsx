import readExcelFile from "read-excel-file/browser";
import {berlinRange} from "./berlinTime";

export type ImportKind = "employees" | "shifts";
export type EmployeeImportRow = {
  row: number; sheet: string; employeeNo: string; displayName: string; email: string;
  phone: string; qualification: string;
};
export type ShiftImportRow = {
  row: number; sheet: string; employeeNo: string; email: string; displayName: string;
  siteName: string; title: string; startsAt: string; endsAt: string;
};
export type ImportProblem = { sheet: string; row: number; reason: string };
export type ParsedImport = {
  kind: ImportKind; fileName: string; rows: EmployeeImportRow[] | ShiftImportRow[];
  problems: ImportProblem[]; sourceRows: number; sheets: string[];
};

type Cell = unknown;
type Grid = Cell[][];
const normalize = (input: unknown) => String(input ?? "").trim();
const norm = (input: unknown) => normalize(input).toLowerCase().normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[ä]/g,"a")
  .replace(/[^a-z0-9]/g, "");
const aliases: Record<string, string[]> = {
  employeeNo: ["personalnummer","personalnr","persnr","mitarbeiternummer","mitarbeiternr","mitarbeiterid","personalid","employeeid","employeenumber","staffid","ma nr","manr","nummer"],
  displayName: ["name","vollstandigername","mitarbeiter","mitarbeitername","vorundnachname","fullname","employeename","personal","nachnamevorname"],
  firstName: ["vorname","firstname","first name"],
  lastName: ["nachname","lastname","surname"],
  email: ["email","emailadresse","mail","e mail","e-mail","emailaddress"],
  phone: ["telefon","handy","mobil","mobilnummer","telefonnummer","phone","mobile"],
  qualification: ["qualifikation","sachkunde","nachweis","qualification","§34a","34a","ausbildung"],
  date: ["datum","date","diensttag","einsatztag","tag"],
  start: ["beginn","start","dienstbeginn","von","startzeit","starttime","schichtbeginn","uhrzeitvon"],
  end: ["ende","bis","endzeit","endtime","dienstende","schichtende","uhrzeitbis"],
  siteName: ["objekt","objektname","einsatzort","standort","filiale","kunde","location","site","site name"],
  title: ["tatigkeit","dienst","funktion","position","schichtart","role","shift","posten"],
};
function field(header: Cell): string | undefined {
  const n = norm(header);
  if (!n) return undefined;
  for (const [key, values] of Object.entries(aliases)) {
    if (values.some(value => norm(value) === n)) return key;
  }
  return undefined;
}
function headers(grid: Grid, kind: ImportKind): { index: number; columns: Record<string, number> } | null {
  let candidate: {index: number; columns: Record<string, number>; score: number} | null = null;
  for (let i=0;i<Math.min(grid.length,18);i++) {
    const columns: Record<string,number> = {};
    grid[i].forEach((cell,j) => { const match=field(cell); if(match && columns[match]===undefined) columns[match]=j; });
    const score = Object.keys(columns).length + (columns.employeeNo!==undefined?2:0)
      + (columns.date!==undefined?2:0) + (columns.displayName!==undefined?2:0);
    if (!candidate || score>candidate.score) candidate={index:i,columns,score};
  }
  if (!candidate || candidate.score<2) return null;
  if (kind==="employees" && candidate.columns.displayName===undefined && candidate.columns.employeeNo===undefined && candidate.columns.firstName===undefined) return null;
  return candidate;
}
const at = (row: Cell[], column: number | undefined) => column===undefined ? "" : normalize(row[column]);
const pad = (n: number) => String(n).padStart(2,"0");
function datePart(value: Cell): { year: number; month: number; day: number } | null {
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return {year:value.getUTCFullYear(),month:value.getUTCMonth()+1,day:value.getUTCDate()};
  if (typeof value==="number" && value>20000 && value<100000) {
    const d=new Date(Date.UTC(1899,11,30)+Math.floor(value)*86400000);
    return validDate(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());
  }
  const text=normalize(value);
  let m=text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if(m) return validDate(Number(m[3]),Number(m[2]),Number(m[1]));
  m=text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if(m) return validDate(Number(m[1]),Number(m[2]),Number(m[3]));
  return null;
}
function validDate(year: number,month: number,day: number) {
  const d=new Date(year,month-1,day);
  return d.getFullYear()===year && d.getMonth()===month-1 && d.getDate()===day
    ? {year,month,day} : null;
}
function timePart(value: Cell): {hour:number;minute:number} | null {
  if(value instanceof Date && !Number.isNaN(value.getTime())) return {hour:value.getUTCHours(),minute:value.getUTCMinutes()};
  if(typeof value==="number" && value>=0 && value<1) {
    const mins=Math.round(value*1440)%1440;
    return {hour:Math.floor(mins/60),minute:mins%60};
  }
  const text=normalize(value).replace(/\s*Uhr\s*/i,"").trim();
  if (/^\d{1,2}$/.test(text)) {
    const h=Number(text); return h<=23?{hour:h,minute:0}:null;
  }
  const m=text.match(/^(\d{1,2})[:.](\d{1,2})(?::\d{1,2})?$/);
  if(!m) return null;
  const h=Number(m[1]),min=Number(m[2]);
  return h<=23 && min<=59?{hour:h,minute:min}:null;
}
function range(date: {year:number;month:number;day:number}, start:Cell,end:Cell): {startsAt:string;endsAt:string}|null {
  const a=timePart(start),b=timePart(end);
  if(!a||!b)return null;
  try{return berlinRange(date,a,b);}catch{return null;}
}
function matrixTime(value: Cell): {start:string;end:string;siteName?:string}|null {
  const raw=normalize(value);
  if(!raw || /^(frei|urlaub|u|f|krank|k|off|x|-|0|---)$/i.test(raw)) return null;
  const m=raw.match(/(\d{1,2}(?:[:.]\d{1,2})?)\s*(?:-|–|—|bis|to)\s*(\d{1,2}(?:[:.]\d{1,2})?)/i);
  if(!m) return null;
  const suffix=raw.slice((m.index??0)+m[0].length).replace(/^[\s@:,;()\-]+/,"").trim();
  return {start:m[1],end:m[2],siteName:suffix||undefined};
}
function matrixHeaderDate(value:Cell, year:number|null, month:number|null) {
  const explicit=datePart(value);
  if(explicit) return explicit;
  const text=normalize(value);
  const m=text.match(/^(?:[A-Za-zÄÖÜäöü]{2,12}[ ,]*)?(\d{1,2})\.?$/);
  if(m && year && month) return validDate(year,month,Number(m[1]));
  return null;
}
function sniffMonthYear(grid: Grid): {year:number;month:number}|null {
  for(const row of grid.slice(0,5)) for(const cell of row) {
    const t=normalize(cell).toLowerCase();
    const match=t.match(/(januar|februar|marz|märz|april|mai|juni|juli|august|september|oktober|november|dezember|jan|feb|mar|apr|jun|jul|aug|sep|okt|nov|dez)\s*[,./ -]*\s*(20\d\d)/);
    if(match) {
      const names=["januar","februar","marz","april","mai","juni","juli","august","september","oktober","november","dezember"];
      const prefixes=["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","dez"];
      const n=match[1].replace("ä","a");
      const month=names.indexOf(n)>=0?names.indexOf(n)+1:prefixes.indexOf(n.slice(0,3))+1;
      if(month>0) return {year:Number(match[2]),month};
    }
  }
  return null;
}

export function parseWorkbook(workbook: {SheetNames:string[];Sheets:Record<string,Grid>}, kind: ImportKind, fileName: string): ParsedImport {
  const employees: EmployeeImportRow[]=[];
  const shifts: ShiftImportRow[]=[];
  const problems: ImportProblem[]=[];
  let sourceRows=0;
  for (const sheet of workbook.SheetNames) {
    const grid=workbook.Sheets[sheet];
    if(grid.length===0) continue;
    const h=headers(grid,kind);
    if(!h) {problems.push({sheet,row:1,reason:"Keine erkennbaren Spaltenüberschriften."});continue;}
    const c=h.columns;
    const cellName=(row:Cell[])=>at(row,c.displayName)||[at(row,c.firstName),at(row,c.lastName)].filter(Boolean).join(" ");
    if(kind==="employees") {
      for(let i=h.index+1;i<grid.length;i++) {
        const row=grid[i];
        if(row.every(value=>!normalize(value))) continue;
        sourceRows++;
        const item:EmployeeImportRow={
          row:i+1,sheet,employeeNo:at(row,c.employeeNo),displayName:cellName(row),
          email:at(row,c.email).toLowerCase(),phone:at(row,c.phone),qualification:at(row,c.qualification)
        };
        if(!item.displayName) {problems.push({sheet,row:i+1,reason:"Name fehlt."});continue;}
        if(!item.employeeNo && !item.email) {problems.push({sheet,row:i+1,reason:"Personalnummer oder E-Mail ist für eine sichere Zuordnung erforderlich."});continue;}
        if(item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {problems.push({sheet,row:i+1,reason:"Ungültige E-Mail-Adresse."});continue;}
        employees.push(item);
      }
      continue;
    }
    // Long format: one row per shift, or a horizontal monthly matrix with dates in the header.
    const longForm=c.date!==undefined && c.start!==undefined && c.end!==undefined;
    if(longForm) {
      for(let i=h.index+1;i<grid.length;i++) {
        const row=grid[i];
        if(row.every(value=>!normalize(value))) continue;
        sourceRows++;
        const date=datePart(row[c.date]);
        const times=date?range(date,row[c.start],row[c.end]):null;
        const item={row:i+1,sheet,employeeNo:at(row,c.employeeNo),email:at(row,c.email).toLowerCase(),
          displayName:cellName(row),siteName:at(row,c.siteName),title:at(row,c.title)||"Sicherheitsdienst",
          startsAt:times?.startsAt||"",endsAt:times?.endsAt||""};
        if(!item.employeeNo && !item.email && !item.displayName) {problems.push({sheet,row:i+1,reason:"Mitarbeiterkennung fehlt."});continue;}
        if(!item.siteName) {problems.push({sheet,row:i+1,reason:"Objekt fehlt."});continue;}
        if(!times) {problems.push({sheet,row:i+1,reason:"Datum oder Uhrzeiten ungültig."});continue;}
        shifts.push(item);
      }
      continue;
    }
    const month=sniffMonthYear(grid);
    // Determine the matrix date header (can be a row above employee column headings).
    const dateRows: {index:number;dates:{column:number; date:{year:number;month:number;day:number}}[]}[]=[];
    for(let i=0;i<Math.min(grid.length,20);i++) {
      const dates=grid[i].map((cell,j)=>({column:j,date:matrixHeaderDate(cell,month?.year??null,month?.month??null)}))
        .filter((d):d is {column:number;date:{year:number;month:number;day:number}}=>Boolean(d.date));
      if(dates.length>=2) dateRows.push({index:i,dates});
    }
    const dateHeader=dateRows.sort((a,b)=>b.dates.length-a.dates.length)[0];
    if(!dateHeader) {
      problems.push({sheet,row:h.index+1,reason:"Datum/Beginn/Ende fehlen oder Monatsmatrix nicht erkannt."});
      continue;
    }
    const firstData=Math.max(h.index,dateHeader.index)+1;
    for(let i=firstData;i<grid.length;i++) {
      const row=grid[i];
      const identity={employeeNo:at(row,c.employeeNo),email:at(row,c.email).toLowerCase(),displayName:cellName(row)};
      if(!identity.employeeNo && !identity.email && !identity.displayName) continue;
      for(const column of dateHeader.dates) {
        const raw=normalize(row[column.column]);
        if(!raw || /^(frei|urlaub|u|f|krank|k|off|x|-|0|---)$/i.test(raw)) continue;
        sourceRows++;
        const parsed=matrixTime(row[column.column]);
        if(!parsed) {problems.push({sheet,row:i+1,reason:"Schichtcode '"+raw+"' unter "+column.date.day+"."+column.date.month+" nicht eindeutig. Bitte Uhrzeit verwenden."});continue;}
        const times=range(column.date,parsed.start,parsed.end);
        const siteName=parsed.siteName||at(row,c.siteName);
        if(!siteName||!times) {problems.push({sheet,row:i+1,reason:!siteName?"Objektzuordnung für Matrixschicht fehlt.":"Schichtzeit ungültig."});continue;}
        shifts.push({row:i+1,sheet,...identity,siteName,title:at(row,c.title)||"Sicherheitsdienst",...times});
      }
    }
  }
  return {kind,fileName,rows:kind==="employees"?employees:shifts,problems,sourceRows,sheets:workbook.SheetNames};
}
export function parseCSV(text:string): Grid {
  const first=text.replace(/^\uFEFF/,"").split(/\r?\n/,1)[0];
  const delimiter=[";",",","\t"].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
  const rows:Grid=[],row:string[]=[];
  let cell="",quoted=false;
  const pushCell=()=>{row.push(cell);cell="";if(row.length>400)throw new Error("Zu viele Spalten.");};
  const pushRow=()=>{pushCell();rows.push([...row]);row.length=0;if(rows.length>20000)throw new Error("Zu viele Zeilen.");};
  text=text.replace(/^\uFEFF/,"");
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(char==='"'){
      if(quoted&&text[i+1]==='"'){cell+='"';i++;}
      else if(quoted||cell.length===0)quoted=!quoted;
      else cell+=char;
    }else if(!quoted&&char===delimiter)pushCell();
    else if(!quoted&&(char==="\n"||char==="\r")){if(char==="\r"&&text[i+1]==="\n")i++;pushRow();}
    else cell+=char;
  }
  if(quoted)throw new Error("CSV enthält ein nicht geschlossenes Anführungszeichen.");
  if(cell||row.length)pushRow();
  return rows;
}
export async function parseExcelFile(file:File,kind:ImportKind):Promise<ParsedImport>{
  if(file.size>8*1024*1024)throw new Error("Datei zu groß (maximal 8 MB).");
  if(!/\.(xlsx|csv)$/i.test(file.name))throw new Error("Bitte eine XLSX- oder CSV-Datei auswählen. Alte XLS-Dateien zuerst als XLSX speichern.");
  const sheets=/\.csv$/i.test(file.name)?[{sheet:"CSV",data:parseCSV(await file.text())}]:await readExcelFile(await file.arrayBuffer());
  if(sheets.length>50)throw new Error("Maximal 50 Arbeitsblätter erlaubt.");
  for(const sheet of sheets){
    if(sheet.data.length>20000||sheet.data.some(row=>row.length>400))throw new Error("Arbeitsblatt zu groß. Bitte nur die relevanten Daten exportieren.");
  }
  return parseWorkbook({SheetNames:sheets.map(s=>s.sheet),Sheets:Object.fromEntries(sheets.map(s=>[s.sheet,s.data]))},kind,file.name);
}
