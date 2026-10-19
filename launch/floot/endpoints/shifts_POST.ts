import superjson from "superjson";
import {sql} from "kysely";
import {db} from "../helpers/db";
import {getPilotOrgContext} from "../helpers/getPilotOrgContext";
import {requireSameOrigin} from "../helpers/requestSecurity";
import {schema,type OutputType} from "./shifts_POST.schema";
export async function handle(request:Request){
  try{
    requireSameOrigin(request);
    const context=await getPilotOrgContext(request);
    const input=schema.parse(superjson.parse(await request.text()));
    const start=new Date(input.startsAt).getTime(),end=new Date(input.endsAt).getTime();
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>24*3600000)throw new Error("Schichtzeit ungültig (maximal 24 Stunden).");
    const shift=await db.transaction().execute(async trx=>{
      await sql`select pg_advisory_xact_lock(hashtextextended(${"guard-import:"+context.orgId},0))`.execute(trx);
      const site=await trx.selectFrom("guardSites").select("id").where("id","=",input.siteId).where("orgId","=",context.orgId).where("active","=",true).executeTakeFirst();
      if(!site)throw new Error("Kein aktives Objekt dieses Mandanten.");
      if(input.employeeId){
        const employee=await trx.selectFrom("guardEmployees").select("id").where("id","=",input.employeeId).where("orgId","=",context.orgId).where("active","=",true).executeTakeFirst();
        if(!employee)throw new Error("Kein aktiver Mitarbeiter dieses Mandanten.");
        const overlap=await trx.selectFrom("guardShifts").select("id").where("orgId","=",context.orgId).where("employeeId","=",input.employeeId)
          .where("status","!=","canceled").where("startsAt","<",input.endsAt).where("endsAt",">",input.startsAt).executeTakeFirst();
        if(overlap)throw new Error("Mitarbeiter hat bereits einen überschneidenden Dienst.");
      }
      const created=await trx.insertInto("guardShifts").values({
        orgId:context.orgId,siteId:input.siteId,employeeId:input.employeeId||null,title:input.title,
        startsAt:input.startsAt,endsAt:input.endsAt,requiredQualification:input.requiredQualification||null,
        notes:input.notes||null,status:"planned",createdBy:String(context.user.id)
      }).returning("id").executeTakeFirstOrThrow();
      await trx.insertInto("guardAuditLog").values({orgId:context.orgId,actorUserId:String(context.user.id),action:"shift.created",entityType:"shift",entityId:created.id,metadata:{siteId:input.siteId,employeeId:input.employeeId??null}}).execute();
      return created;
    });
    return new Response(superjson.stringify(shift satisfies OutputType));
  }catch(error){return new Response(superjson.stringify({error:error instanceof Error?error.message:"Schicht konnte nicht angelegt werden."}),{status:400});}
}
