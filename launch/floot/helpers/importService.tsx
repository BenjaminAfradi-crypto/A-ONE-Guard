import {sql,type Transaction} from "kysely";
import {createHash} from "crypto";
import {db} from "./db";
import type {DB} from "./schema";
import {planImport} from "./importPlan";
import type {ImportInput,OutputType} from "../endpoints/import_preview_POST.schema";

async function build(trx:Transaction<DB>,orgId:string,input:ImportInput){
  const [employees,sites,shifts]=await Promise.all([
    trx.selectFrom("guardEmployees").selectAll().where("orgId","=",orgId).execute(),
    trx.selectFrom("guardSites").select(["id","name","active"]).where("orgId","=",orgId).execute(),
    trx.selectFrom("guardShifts").select(["id","employeeId","siteId","startsAt","endsAt","status"]).where("orgId","=",orgId).where("status","!=","canceled").execute()
  ]);
  return {plan:planImport(input,{employees,sites,shifts}),sites};
}
function output(plan:ReturnType<typeof planImport>):OutputType{
  const {employees,shifts,...summary}=plan;return summary;
}
export async function importService(orgId:string,userId:string,input:ImportInput,apply:boolean){
  return db.transaction().execute(async trx=>{
    // Preview and apply always plan from current state; serialize imports per tenant.
    await sql`select pg_advisory_xact_lock(hashtextextended(${"guard-import:"+orgId},0))`.execute(trx);
    const {plan,sites}=await build(trx,orgId,input);
    if(!apply)return output(plan);
    if(plan.accepted===0)throw new Error("Keine neuen oder geänderten Datensätze importierbar.");
    for(const item of plan.employees){
      const row=item.row;
      const values={employeeNo:row.employeeNo||null,displayName:row.displayName,email:row.email||null,phone:row.phone||null,qualification:row.qualification||null};
      if(item.id)await trx.updateTable("guardEmployees").set(values).where("id","=",item.id).where("orgId","=",orgId).execute();
      else await trx.insertInto("guardEmployees").values({orgId,...values}).execute();
    }
    const siteMap=new Map(sites.map(s=>[s.name,s.id]));
    for(const name of plan.newSites){
      const site=await trx.insertInto("guardSites").values({orgId,name}).returning("id").executeTakeFirstOrThrow();siteMap.set(name,site.id);
    }
    for(const item of plan.shifts){
      const siteId=siteMap.get(item.siteName);
      if(!siteId)throw new Error("Objektzuordnung konnte nicht gespeichert werden.");
      const importKey=createHash("sha256").update([orgId,item.employeeId,siteId,item.row.startsAt,item.row.endsAt].join("|")).digest("hex");
      await trx.insertInto("guardShifts").values({
        orgId,siteId,employeeId:item.employeeId,title:item.row.title,startsAt:item.row.startsAt,endsAt:item.row.endsAt,status:"planned",importKey,createdBy:userId
      }).execute();
    }
    const batch=await trx.insertInto("guardImportBatches").values({
      orgId,createdBy:userId,fileName:input.fileName,importType:input.kind,totalRows:plan.total,importedRows:plan.accepted,skippedRows:plan.skipped,
      status:plan.skipped?"completed_with_skips":"completed",errors:plan.issues,finishedAt:new Date()
    }).returning("id").executeTakeFirstOrThrow();
    await trx.insertInto("guardAuditLog").values({orgId,actorUserId:userId,action:"import.applied",entityType:"import_batch",entityId:batch.id,
      metadata:{kind:input.kind,accepted:plan.accepted,skipped:plan.skipped,created:plan.created,updated:plan.updated}}).execute();
    return {...output(plan),batchId:batch.id};
  });
}
