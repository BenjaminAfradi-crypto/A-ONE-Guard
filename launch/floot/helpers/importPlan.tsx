export type EmployeeRow = {row:number;sheet:string;employeeNo:string;displayName:string;email:string;phone:string;qualification:string};
export type ShiftRow = {row:number;sheet:string;employeeNo:string;displayName:string;email:string;siteName:string;title:string;startsAt:string;endsAt:string};
export type Employee = {id:string;employeeNo:string|null;displayName:string;email:string|null;phone:string|null;qualification:string|null;active:boolean;userId:string|null};
export type Site = {id:string;name:string;active:boolean};
export type ExistingShift = {id:string;employeeId:string|null;siteId:string;startsAt:Date|string;endsAt:Date|string;status:string};
export type ImportIssue = {sheet:string;row:number;reason:string};
export type Plan = {
  kind:"employees"|"shifts";total:number;accepted:number;created:number;updated:number;skipped:number;unmatched:number;
  newSites:string[];issues:ImportIssue[];
  employees:{id:string|null;row:EmployeeRow}[];
  shifts:{employeeId:string;siteName:string;row:ShiftRow}[];
};
const nameKey=(v:string)=>v.trim().normalize("NFKC").toLocaleLowerCase("de-DE").replace(/\s+/g," ");
const emailKey=(v:string|null)=>String(v??"").trim().toLowerCase();
const numberKey=(v:string|null)=>String(v??"").trim();
const validEmail=(v:string)=>!v||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function planImport(
  input:{kind:"employees";rows:EmployeeRow[]}|{kind:"shifts";rows:ShiftRow[]},
  existing:{employees:Employee[];sites:Site[];shifts:ExistingShift[]}
):Plan {
  const plan:Plan={kind:input.kind,total:input.rows.length,accepted:0,created:0,updated:0,skipped:0,unmatched:0,newSites:[],issues:[],employees:[],shifts:[]};
  const employees=existing.employees.map(e=>({...e}));
  const issue=(r:{sheet:string;row:number},reason:string,unmatched=false)=>{
    plan.issues.push({sheet:r.sheet,row:r.row,reason});plan.skipped++;if(unmatched)plan.unmatched++;
  };
  if(input.kind==="employees"){
    const seen=new Set<string>();
    for(const raw of input.rows){
      const row={...raw,employeeNo:numberKey(raw.employeeNo),email:emailKey(raw.email),displayName:raw.displayName.trim(),phone:raw.phone.trim(),qualification:raw.qualification.trim()};
      if(!row.displayName||(!row.employeeNo&&!row.email)){issue(row,"Name und Personalnummer oder E-Mail erforderlich.");continue;}
      if(!validEmail(row.email)){issue(row,"Ungültige E-Mail-Adresse.");continue;}
      const byNo=row.employeeNo?employees.filter(e=>numberKey(e.employeeNo)===row.employeeNo):[];
      const byEmail=row.email?employees.filter(e=>emailKey(e.email)===row.email):[];
      const matches=[...new Map([...byNo,...byEmail].map(e=>[e.id,e])).values()];
      if(byNo.length>1||byEmail.length>1||matches.length>1){issue(row,"Personalnummer und E-Mail sind nicht eindeutig oder verweisen auf verschiedene Mitarbeiter.");continue;}
      const match=matches[0];
      if(match&&!match.active){issue(row,"Mitarbeiter ist deaktiviert. Zuerst ausdrücklich reaktivieren.");continue;}
      if(match&&row.employeeNo&&match.employeeNo&&numberKey(match.employeeNo)!==row.employeeNo){issue(row,"Personalnummer stimmt nicht mit dem bestehenden Mitarbeiter überein.");continue;}
      if(match?.userId&&row.email&&emailKey(match.email)!==row.email){issue(row,"E-Mail eines verbundenen Benutzerkontos darf nicht per Import geändert werden.");continue;}
      const identity=match?.id??(row.employeeNo?"no:"+row.employeeNo:"email:"+row.email);
      if(seen.has(identity)){issue(row,"Mitarbeiter kommt mehrfach in dieser Datei vor.");continue;}
      seen.add(identity);
      const merged={...row,email:row.email||match?.email||"",phone:row.phone||match?.phone||"",qualification:row.qualification||match?.qualification||"",employeeNo:row.employeeNo||match?.employeeNo||""};
      if(match&&["employeeNo","displayName","email","phone","qualification"].every(k=>String(match[k as keyof Employee]??"")===String(merged[k as keyof EmployeeRow]??""))){plan.skipped++;continue;}
      plan.employees.push({id:match?.id??null,row:merged});plan.accepted++;if(match)plan.updated++;else plan.created++;
      if(match)Object.assign(match,merged);else employees.push({...merged,id:"pending:"+identity,active:true,userId:null});
    }
    return plan;
  }
  const intervals=existing.shifts.filter(s=>s.status!=="canceled").map(s=>({...s,start:new Date(s.startsAt).getTime(),end:new Date(s.endsAt).getTime()}));
  const sites=existing.sites.map(s=>({...s}));
  for(const row of input.rows){
    let matches:Employee[]=[];
    if(row.employeeNo.trim())matches=employees.filter(e=>numberKey(e.employeeNo)===numberKey(row.employeeNo));
    else if(row.email.trim())matches=employees.filter(e=>emailKey(e.email)===emailKey(row.email));
    else if(row.displayName.trim())matches=employees.filter(e=>nameKey(e.displayName)===nameKey(row.displayName));
    if(matches.length!==1){issue(row,"Mitarbeiter fehlt oder ist nicht eindeutig. Zuerst Mitarbeiterliste importieren.",true);continue;}
    const employee=matches[0];
    if(!employee.active){issue(row,"Mitarbeiter ist deaktiviert.");continue;}
    if(row.email&&emailKey(row.email)!==emailKey(employee.email)){issue(row,"E-Mail widerspricht der Mitarbeiterzuordnung.");continue;}
    const start=new Date(row.startsAt).getTime(),end=new Date(row.endsAt).getTime();
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>24*3600000){issue(row,"Schichtzeit ungültig (maximal 24 Stunden).");continue;}
    const siteName=row.siteName.trim();
    if(!siteName){issue(row,"Objekt fehlt.");continue;}
    let siteMatches=sites.filter(s=>nameKey(s.name)===nameKey(siteName));
    if(siteMatches.length>1){issue(row,"Objektname ist nicht eindeutig.");continue;}
    let site=siteMatches[0];
    if(site&&!site.active){issue(row,"Objekt ist deaktiviert.");continue;}
    const siteId=site?.id??"pending:"+nameKey(siteName);
    if(intervals.some(s=>s.employeeId===employee.id&&s.siteId===siteId&&s.start===start&&s.end===end)){plan.skipped++;continue;}
    if(intervals.some(s=>s.employeeId===employee.id&&s.start<end&&s.end>start)){issue(row,"Schicht überschneidet sich mit einem bestehenden oder importierten Dienst.");continue;}
    if(!site){site={id:siteId,name:siteName,active:true};sites.push(site);plan.newSites.push(siteName);}
    plan.shifts.push({employeeId:employee.id,siteName:site.name,row:{...row,siteName:site.name}});
    intervals.push({id:"pending",employeeId:employee.id,siteId:site.id,startsAt:row.startsAt,endsAt:row.endsAt,status:"planned",start,end});
    plan.accepted++;plan.created++;
  }
  return plan;
}
