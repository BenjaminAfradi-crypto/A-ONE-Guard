import superjson from "superjson";
import {db} from "../helpers/db";
import {getEmployeeContext} from "../helpers/getEmployeeContext";
import type {OutputType} from "./employee_home_GET.schema";
export async function handle(request:Request){
  try{
    const context=await getEmployeeContext(request);
    const from=new Date(Date.now()-24*3600000),to=new Date(Date.now()+93*24*3600000);
    const [shifts,entries]=await Promise.all([
      db.selectFrom("guardShifts").innerJoin("guardSites","guardSites.id","guardShifts.siteId")
        .select(["guardShifts.id","guardShifts.startsAt","guardShifts.endsAt","guardShifts.title","guardShifts.status","guardSites.name as siteName","guardSites.address"])
        .where("guardShifts.orgId","=",context.orgId).where("guardShifts.employeeId","=",context.employeeId)
        .where("guardShifts.endsAt",">=",from).where("guardShifts.startsAt","<=",to).where("guardShifts.status","!=","canceled").orderBy("guardShifts.startsAt","asc").execute(),
      db.selectFrom("guardTimeEntries").leftJoin("guardSites","guardSites.id","guardTimeEntries.siteId")
        .select(["guardTimeEntries.id","guardTimeEntries.action","guardTimeEntries.occurredAt","guardTimeEntries.source","guardSites.name as siteName"])
        .where("guardTimeEntries.orgId","=",context.orgId).where("guardTimeEntries.employeeId","=",context.employeeId).orderBy("guardTimeEntries.occurredAt","desc").limit(20).execute()
    ]);
    const output:OutputType={employee:{id:context.employeeId,displayName:context.displayName,orgName:context.orgName},shifts,entries};
    return new Response(superjson.stringify(output),{headers:{"Cache-Control":"no-store"}});
  }catch(error){return new Response(superjson.stringify({error:error instanceof Error?error.message:"Fehler"}),{status:401});}
}
