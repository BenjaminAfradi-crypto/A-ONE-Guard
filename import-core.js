const AONE_IMPORT=(()=>{
  const clean=v=>String(v??'').trim();
  const norm=v=>clean(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,'');
  const aliases={
    employeeNo:['personalnummer','personalnr','persnr','mitarbeiternummer','mitarbeiternr','mitarbeiterid','personalid','employeeid','employeenumber','staffid','ma nr','manr','nummer'],
    displayName:['name','vollstandigername','mitarbeiter','mitarbeitername','vorundnachname','fullname','employeename','personal','nachnamevorname'],
    firstName:['vorname','firstname','first name'],
    lastName:['nachname','lastname','surname'],
    email:['email','emailadresse','mail','e mail','e-mail','emailaddress'],
    phone:['telefon','handy','mobil','mobilnummer','telefonnummer','phone','mobile'],
    qualification:['qualifikation','sachkunde','nachweis','qualification','§34a','34a','ausbildung'],
    bewacherId:['bewacherid','bewacher-id','bewacher id','bewacherregister','bwr id'],
    birthDate:['geburtsdatum','geburtstag','birthdate','dateofbirth'],
    employmentStart:['eintrittsdatum','eintritt','beschaftigungsbeginn','beschäftigungsbeginn','startdatum','employmentstart'],
    street:['strasse','straße','adresse','anschrift','street','address'],
    postalCode:['plz','postleitzahl','postalcode','zipcode'],
    city:['ort','stadt','city'],
    hourlyRate:['stundenlohn','stundenlohn eur','lohn pro stunde','hourlyrate','hourly rate'],
    vacationDays:['urlaubstage','urlaubstage jahr','jahresurlaub','vacationdays'],
    weeklyHours:['stunden','wochenstunden','vertragsstunden','stunden woche','weeklyhours','hoursperweek'],
    date:['datum','date','diensttag','einsatztag','tag'],
    start:['beginn','start','dienstbeginn','von','startzeit','starttime','schichtbeginn','uhrzeitvon'],
    end:['ende','bis','endzeit','endtime','dienstende','schichtende','uhrzeitbis'],
    siteName:['objekt','objektname','einsatzort','standort','filiale','kunde','location','site','site name'],
    title:['tatigkeit','taetigkeit','dienst','funktion','position','schichtart','role','shift','posten']
  };
  const field=header=>{
    const n=norm(header); if(!n)return null;
    for(const [key,values] of Object.entries(aliases)) if(values.some(v=>norm(v)===n)) return key;
    return null;
  };
  function detectHeader(grid,kind){
    let best=null;
    for(let i=0;i<Math.min(grid.length,18);i++){
      const columns={};
      (grid[i]||[]).forEach((cell,j)=>{const match=field(cell);if(match&&columns[match]===undefined)columns[match]=j});
      let score=Object.keys(columns).length+(columns.employeeNo!==undefined?2:0)+(columns.displayName!==undefined?2:0)+(columns.date!==undefined?2:0);
      const headers=(grid[i]||[]).map(clean),density=headers.filter(Boolean).length;
      if(!best||score>best.score||(score===best.score&&density>best.density))best={index:i,columns,score,density,headers};
    }
    return best;
  }
  function applyMapping(header,mapping={}){
    const out={...header.columns};
    for(const [key,label] of Object.entries(mapping||{})){
      if(!label){delete out[key];continue}
      const idx=header.headers.findIndex(h=>h===label);
      if(idx>=0)out[key]=idx;
    }
    return out;
  }
  const at=(row,index)=>index===undefined?'':clean(row[index]);
  function numberValue(value){
    if(value===null||value===undefined||value==='')return null;
    if(typeof value==='number')return Number.isFinite(value)?value:null;
    let text=clean(value).replace(/[€\s]/g,'');
    if(!text)return null;
    if(/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(text))text=text.replace(/\./g,'').replace(',','.');
    else if(text.includes(','))text=text.replace(/\./g,'').replace(',','.');
    const n=Number(text);return Number.isFinite(n)?n:null;
  }
  function validDate(year,month,day){const d=new Date(Date.UTC(year,month-1,day));return d.getUTCFullYear()===year&&d.getUTCMonth()+1===month&&d.getUTCDate()===day?{year,month,day}:null}
  function datePart(value){
    if(value instanceof Date&&!Number.isNaN(value.getTime()))return validDate(value.getUTCFullYear(),value.getUTCMonth()+1,value.getUTCDate());
    if(typeof value==='number'&&value>20000&&value<100000){const d=new Date(Date.UTC(1899,11,30)+Math.floor(value)*86400000);return validDate(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate())}
    const text=clean(value);let m=text.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
    if(m){const y=Number(m[3])<100?2000+Number(m[3]):Number(m[3]);return validDate(y,Number(m[2]),Number(m[1]))}
    m=text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);return m?validDate(Number(m[1]),Number(m[2]),Number(m[3])):null;
  }
  function dateIso(value){const p=datePart(value);return p?`${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`:''}
  function timePart(value){
    if(value instanceof Date&&!Number.isNaN(value.getTime()))return {hour:value.getUTCHours(),minute:value.getUTCMinutes()};
    if(typeof value==='number'&&value>=0&&value<1){const mins=Math.round(value*1440)%1440;return {hour:Math.floor(mins/60),minute:mins%60}}
    const text=clean(value).replace(/\s*Uhr\s*/i,'').trim(); if(/^\d{1,2}$/.test(text)){const h=Number(text);return h<=23?{hour:h,minute:0}:null}
    const m=text.match(/^(\d{1,2})[:.](\d{1,2})(?::\d{1,2})?$/);if(!m)return null;const h=Number(m[1]),minute=Number(m[2]);return h<=23&&minute<=59?{hour:h,minute}:null;
  }
  const berlinFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const berlinParts=d=>Object.fromEntries(berlinFormatter.formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  function berlinStamp(date,time){
    const naive=Date.UTC(date.year,date.month-1,date.day,time.hour,time.minute);
    const candidates=[naive-3600000,naive-7200000].filter(ms=>{const p=berlinParts(new Date(ms));return p.year===date.year&&p.month===date.month&&p.day===date.day&&p.hour===time.hour&&p.minute===time.minute});
    if(!candidates.length)throw new Error('Uhrzeit existiert wegen der Sommerzeitumstellung nicht.');
    if(candidates.length>1)throw new Error('Uhrzeit ist bei der Winterzeitumstellung doppeldeutig. Bitte manuell planen.');
    return new Date(candidates[0]);
  }
  function range(date,start,end){
    const a=timePart(start),b=timePart(end);if(!a||!b)return null;
    try{
      const from=berlinStamp(date,a);let endDate=date;
      if(b.hour*60+b.minute<=a.hour*60+a.minute){const n=new Date(Date.UTC(date.year,date.month-1,date.day+1));endDate={year:n.getUTCFullYear(),month:n.getUTCMonth()+1,day:n.getUTCDate()}}
      const to=berlinStamp(endDate,b),hours=(to-from)/3600000;if(hours<=0||hours>24)return null;
      return {startsAt:from.toISOString(),endsAt:to.toISOString()};
    }catch{return null}
  }
  function matrixTime(value){
    const raw=clean(value);if(!raw||/^(frei|urlaub|u|f|krank|k|off|x|-|0|---)$/i.test(raw))return null;
    const m=raw.match(/(\d{1,2}(?:[:.]\d{1,2})?)\s*(?:-|–|—|bis|to)\s*(\d{1,2}(?:[:.]\d{1,2})?)/i);if(!m)return null;
    const suffix=raw.slice((m.index||0)+m[0].length).replace(/^[\s@:,;()\-]+/,'').trim();return {start:m[1],end:m[2],siteName:suffix||''};
  }
  function sniffMonthYear(grid){
    const names=['januar','februar','marz','april','mai','juni','juli','august','september','oktober','november','dezember'];
    const prefix=['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','dez'];
    for(const row of grid.slice(0,6))for(const cell of row||[]){const t=clean(cell).toLowerCase().replace('ä','a');const m=t.match(/(januar|februar|marz|april|mai|juni|juli|august|september|oktober|november|dezember|jan|feb|mar|apr|jun|jul|aug|sep|okt|nov|dez)\s*[,./ -]*\s*(20\d\d)/);if(m){const month=names.indexOf(m[1])>=0?names.indexOf(m[1])+1:prefix.indexOf(m[1].slice(0,3))+1;if(month>0)return {year:Number(m[2]),month}}}return null;
  }
  function matrixHeaderDate(value,ym){
    const explicit=datePart(value);if(explicit)return explicit;const m=clean(value).match(/^(?:[A-Za-zÄÖÜäöü]{2,12}[ ,]*)?(\d{1,2})\.?$/);return m&&ym?validDate(ym.year,ym.month,Number(m[1])):null;
  }
  const normalizeQualification=v=>{const n=norm(v);return n.includes('sachkund')?'sachkunde':n.includes('unterricht')?'unterrichtung':'none'};
  function parseWorkbook(book,kind,mapping={}){
    const rows=[],problems=[],headers=new Set();let sourceRows=0;
    for(const sheet of book.SheetNames){
      const grid=book.Sheets[sheet]||[];if(!grid.length)continue;const h=detectHeader(grid,kind);
      if(!h){problems.push({sheet,row:1,reason:'Keine Spaltenüberschriften gefunden.'});continue}
      h.headers.filter(Boolean).forEach(x=>headers.add(x));
      const hasManual=Object.values(mapping||{}).some(Boolean);
      if(h.score<2&&!hasManual){problems.push({sheet,row:h.index+1,reason:'Spalten nicht sicher erkannt. Bitte die Zuordnung oben manuell festlegen.'});continue}
      const c=applyMapping(h,mapping);
      if(kind==='employees'&&c.displayName===undefined&&c.firstName===undefined&&c.employeeNo===undefined&&!hasManual){problems.push({sheet,row:h.index+1,reason:'Name oder Personalnummer konnte nicht erkannt werden.'});continue}
      const nameOf=row=>at(row,c.displayName)||[at(row,c.firstName),at(row,c.lastName)].filter(Boolean).join(' ');
      if(kind==='employees'){
        for(let i=h.index+1;i<grid.length;i++){const row=grid[i]||[];if(row.every(v=>!clean(v)))continue;sourceRows++;
          const birthRaw=at(row,c.birthDate),startRaw=at(row,c.employmentStart),rateRaw=at(row,c.hourlyRate),vacationRaw=at(row,c.vacationDays),weeklyRaw=at(row,c.weeklyHours);
          const birthDate=birthRaw?dateIso(row[c.birthDate]):'',employmentStart=startRaw?dateIso(row[c.employmentStart]):'';
          const hourlyRate=rateRaw?numberValue(row[c.hourlyRate]):null,vacationDays=vacationRaw?numberValue(row[c.vacationDays]):null,weeklyHours=weeklyRaw?numberValue(row[c.weeklyHours]):null;
          const item={
            sheet,row:i+1,employee_no:at(row,c.employeeNo),display_name:nameOf(row),email:at(row,c.email).toLowerCase(),
            phone:at(row,c.phone),bewacher_id:at(row,c.bewacherId),qualification_level:normalizeQualification(at(row,c.qualification)),
            hourly_rate_cents:hourlyRate==null?null:Math.round(hourlyRate*100),vacation_days_annual:vacationDays,
            private:{
              birth_date:birthDate||null,employment_start_date:employmentStart||null,street:at(row,c.street)||null,
              postal_code:at(row,c.postalCode)||null,city:at(row,c.city)||null,
              extra_fields:weeklyHours==null?{}:{weekly_hours:weeklyHours}
            }
          };
          if(!item.display_name){problems.push({sheet,row:i+1,reason:'Name fehlt.'});continue}
          if(!item.employee_no&&!item.email){problems.push({sheet,row:i+1,reason:'Personalnummer oder E-Mail fehlt.'});continue}
          if(item.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)){problems.push({sheet,row:i+1,reason:'E-Mail ist ungültig.'});continue}
          if(birthRaw&&!birthDate){problems.push({sheet,row:i+1,reason:'Geburtsdatum ist ungültig.'});continue}
          if(startRaw&&!employmentStart){problems.push({sheet,row:i+1,reason:'Eintrittsdatum ist ungültig.'});continue}
          if(rateRaw&&hourlyRate==null){problems.push({sheet,row:i+1,reason:'Stundenlohn ist ungültig.'});continue}
          if(vacationRaw&&vacationDays==null){problems.push({sheet,row:i+1,reason:'Urlaubstage sind ungültig.'});continue}
          if(weeklyRaw&&weeklyHours==null){problems.push({sheet,row:i+1,reason:'Wochenstunden sind ungültig.'});continue}
          rows.push(item);
        }continue;
      }
      const longForm=c.date!==undefined&&c.start!==undefined&&c.end!==undefined;
      if(longForm){
        for(let i=h.index+1;i<grid.length;i++){const row=grid[i]||[];if(row.every(v=>!clean(v)))continue;sourceRows++;const date=datePart(row[c.date]);const times=date?range(date,row[c.start],row[c.end]):null;
          const item={sheet,row:i+1,employee_no:at(row,c.employeeNo),display_name:nameOf(row),email:at(row,c.email).toLowerCase(),site_name:at(row,c.siteName),title:at(row,c.title)||'Sicherheitsdienst',starts_at:times?.startsAt||'',ends_at:times?.endsAt||''};
          if(!item.employee_no&&!item.email&&!item.display_name){problems.push({sheet,row:i+1,reason:'Mitarbeiterkennung fehlt.'});continue}
          if(!item.site_name){problems.push({sheet,row:i+1,reason:'Objekt fehlt.'});continue}
          if(!times){problems.push({sheet,row:i+1,reason:'Datum oder Uhrzeiten ungültig.'});continue}
          rows.push(item);
        }continue;
      }
      const ym=sniffMonthYear(grid),dateRows=[];
      for(let i=0;i<Math.min(grid.length,20);i++){const dates=(grid[i]||[]).map((cell,j)=>({column:j,date:matrixHeaderDate(cell,ym)})).filter(x=>x.date);if(dates.length>=2)dateRows.push({index:i,dates})}
      const dateHeader=dateRows.sort((a,b)=>b.dates.length-a.dates.length)[0];
      if(!dateHeader){problems.push({sheet,row:h.index+1,reason:'Dienstplanformat nicht erkannt. Datum/Beginn/Ende oder Monatsmatrix erforderlich.'});continue}
      const first=Math.max(h.index,dateHeader.index)+1;
      for(let i=first;i<grid.length;i++){const row=grid[i]||[];const identity={employee_no:at(row,c.employeeNo),email:at(row,c.email).toLowerCase(),display_name:nameOf(row)};if(!identity.employee_no&&!identity.email&&!identity.display_name)continue;
        for(const d of dateHeader.dates){const raw=clean(row[d.column]);if(!raw||/^(frei|urlaub|u|f|krank|k|off|x|-|0|---)$/i.test(raw))continue;sourceRows++;const p=matrixTime(raw);
          if(!p){problems.push({sheet,row:i+1,reason:'Schichtcode „'+raw+'“ am '+d.date.day+'.'+d.date.month+' nicht eindeutig.'});continue}
          const times=range(d.date,p.start,p.end),site=p.siteName||at(row,c.siteName);if(!site||!times){problems.push({sheet,row:i+1,reason:!site?'Objektzuordnung für Matrixschicht fehlt.':'Schichtzeit ungültig.'});continue}
          rows.push({sheet,row:i+1,...identity,site_name:site,title:at(row,c.title)||'Sicherheitsdienst',starts_at:times.startsAt,ends_at:times.endsAt});
        }
      }
    }
    return {kind,rows,problems,sourceRows,headers:[...headers]};
  }
  const keyName=v=>clean(v).normalize('NFKC').toLocaleLowerCase('de-DE').replace(/\s+/g,' ');
  const keyMail=v=>clean(v).toLowerCase(),keyNo=v=>clean(v);
  function planEmployees(rows,employees=[]){
    const accepted=[],issues=[],seen=new Set();let created=0,updated=0,skipped=0;
    const issue=(r,reason)=>{issues.push({sheet:r.sheet,row:r.row,reason});skipped++};
    for(const row of rows){
      const byNo=row.employee_no?employees.filter(e=>keyNo(e.employee_no)===keyNo(row.employee_no)):[];
      const byEmail=row.email?employees.filter(e=>keyMail(e.email)===keyMail(row.email)):[];
      const matches=[...new Map([...byNo,...byEmail].map(e=>[e.id,e])).values()];
      if(byNo.length>1||byEmail.length>1||matches.length>1){issue(row,'Personalnummer/E-Mail ist nicht eindeutig.');continue}
      const match=matches[0];if(match?.status==='inactive'){issue(row,'Mitarbeiter ist deaktiviert und wird nicht automatisch reaktiviert.');continue}
      if(match?.user_id&&row.email&&keyMail(match.email)!==keyMail(row.email)){issue(row,'E-Mail eines verbundenen Benutzerkontos darf nicht per Import geändert werden.');continue}
      const identity=match?.id||(row.employee_no?'no:'+keyNo(row.employee_no):'mail:'+keyMail(row.email));if(seen.has(identity)){issue(row,'Mitarbeiter kommt mehrfach in der Datei vor.');continue}seen.add(identity);
      const privateValues=row.private?Object.entries(row.private).filter(([k])=>k!=='extra_fields').some(([,v])=>clean(v)!=='')||Object.keys(row.private.extra_fields||{}).length>0:false;
      const changed=!match||privateValues||['employee_no','display_name','email','phone','bewacher_id','qualification_level','hourly_rate_cents','vacation_days_annual'].some(k=>clean(match[k])!==clean(row[k]));
      if(!changed){skipped++;continue}accepted.push({...row,existing_id:match?.id||null});if(match)updated++;else created++;
    }
    return {accepted,issues,created,updated,skipped,total:rows.length};
  }
  function planShifts(rows,{employees=[],sites=[],shifts=[],restMinutes=660,createMissingSites=true}={}){
    const accepted=[],issues=[],newSites=new Set(),intervals=shifts.filter(s=>s.status!=='canceled').map(s=>({employee_id:s.employee_id,site_id:s.site_id,start:+new Date(s.starts_at),end:+new Date(s.ends_at)}));let skipped=0;
    const issue=(r,reason)=>{issues.push({sheet:r.sheet,row:r.row,reason});skipped++};
    for(const row of rows){
      let matches=[];if(row.employee_no)matches=employees.filter(e=>keyNo(e.employee_no)===keyNo(row.employee_no));else if(row.email)matches=employees.filter(e=>keyMail(e.email)===keyMail(row.email));else if(row.display_name)matches=employees.filter(e=>keyName(e.display_name)===keyName(row.display_name));
      if(matches.length!==1){issue(row,'Mitarbeiter fehlt oder ist nicht eindeutig. Zuerst Mitarbeiterliste importieren.');continue}
      const emp=matches[0];if(emp.status!=='active'){issue(row,'Mitarbeiter ist nicht aktiv.');continue}
      const siteMatches=sites.filter(s=>keyName(s.name)===keyName(row.site_name));if(siteMatches.length>1){issue(row,'Objektname ist nicht eindeutig.');continue}
      const site=siteMatches[0];if(site&&!site.active){issue(row,'Objekt ist deaktiviert.');continue}if(!site&&!createMissingSites){issue(row,'Objekt existiert nicht.');continue}
      const start=+new Date(row.starts_at),end=+new Date(row.ends_at);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>86400000){issue(row,'Schichtzeit ist ungültig.');continue}
      const siteId=site?.id||'new:'+keyName(row.site_name);const exact=intervals.some(s=>s.employee_id===emp.id&&s.site_id===siteId&&s.start===start&&s.end===end);if(exact){skipped++;continue}
      const conflict=intervals.find(s=>s.employee_id===emp.id&&s.start<end+restMinutes*60000&&s.end>start-restMinutes*60000);
      if(conflict){issue(row,conflict.start<end&&conflict.end>start?'Schicht überschneidet sich mit einem bestehenden/importierten Dienst.':'Mindestruhezeit wird unterschritten.');continue}
      if(!site)newSites.add(row.site_name);accepted.push({...row,employee_id:emp.id,site_id:site?.id||null});intervals.push({employee_id:emp.id,site_id:siteId,start,end});
    }
    return {accepted,issues,newSites:[...newSites],created:accepted.length,skipped,total:rows.length};
  }
  return {clean,norm,parseWorkbook,planEmployees,planShifts};
})();