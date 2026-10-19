type CalendarDate={year:number;month:number;day:number};
type ClockTime={hour:number;minute:number};
const formatter=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
const parts=(d:Date)=>Object.fromEntries(formatter.formatToParts(d).map(p=>[p.type,Number(p.value)]));
export function berlinStamp(date:CalendarDate,time:ClockTime):Date {
  const naive=Date.UTC(date.year,date.month-1,date.day,time.hour,time.minute);
  const candidates=[naive-3600000,naive-7200000].filter(ms=>{
    const p=parts(new Date(ms));
    return p.year===date.year&&p.month===date.month&&p.day===date.day&&p.hour===time.hour&&p.minute===time.minute;
  });
  if(candidates.length===0)throw new Error("Uhrzeit liegt in der Sommerzeitumstellung und existiert nicht.");
  if(candidates.length>1)throw new Error("Uhrzeit ist bei der Winterzeitumstellung doppeldeutig. Bitte manuell planen.");
  return new Date(candidates[0]);
}
export function berlinRange(date:CalendarDate,a:ClockTime,b:ClockTime){
  const from=berlinStamp(date,a);
  let endDate=date;
  if(b.hour*60+b.minute<=a.hour*60+a.minute){
    const next=new Date(Date.UTC(date.year,date.month-1,date.day+1));
    endDate={year:next.getUTCFullYear(),month:next.getUTCMonth()+1,day:next.getUTCDate()};
  }
  const to=berlinStamp(endDate,b);
  const hours=(to.getTime()-from.getTime())/3600000;
  if(hours<=0||hours>24)throw new Error("Schicht muss länger als 0 und höchstens 24 Stunden sein.");
  return {startsAt:from.toISOString(),endsAt:to.toISOString()};
}
