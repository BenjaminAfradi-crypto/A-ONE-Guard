import {sql} from "kysely";
import superjson from "superjson";
import {db} from "../helpers/db";
import {getPilotOrgContext} from "../helpers/getPilotOrgContext";
import {requireSameOrigin} from "../helpers/requestSecurity";
import {newInvitationToken,invitationHash} from "../helpers/invitationToken";
import {schema} from "./employee_invite_POST.schema";
export async function handle(request:Request){
  try{
    requireSameOrigin(request);
    const context=await getPilotOrgContext(request);
    const input=schema.parse(superjson.parse(await request.text()));
    const result=await db.transaction().execute(async trx=>{
      const employee=await trx.selectFrom("guardEmployees").select(["id","email","userId","active"])
        .where("id","=",input.employeeId).where("orgId","=",context.orgId).forUpdate().executeTakeFirst();
      if(!employee?.active||!employee.email)throw new Error("Aktiver Mitarbeiter mit E-Mail erforderlich.");
      if(employee.userId)throw new Error("Mitarbeiter hat bereits ein Benutzerkonto.");
      const token=newInvitationToken(),email=employee.email.trim().toLowerCase(),expiresAt=new Date(Date.now()+48*3600000);
      await sql`update guard_employee_invitations set consumed_at=now() where org_id=${context.orgId}::uuid and employee_id=${employee.id}::uuid and consumed_at is null`.execute(trx);
      await sql`insert into guard_employee_invitations(org_id,employee_id,email,token_hash,created_by,expires_at)
        values(${context.orgId}::uuid,${employee.id}::uuid,${email},${invitationHash(token)},${String(context.user.id)}::bigint,${expiresAt})`.execute(trx);
      await trx.insertInto("guardAuditLog").values({orgId:context.orgId,actorUserId:String(context.user.id),action:"employee.invited",entityType:"employee",entityId:employee.id,metadata:{expiresAt:expiresAt.toISOString()}}).execute();
      return {token,email,expiresAt};
    });
    return new Response(superjson.stringify(result),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }catch(error){return new Response(superjson.stringify({error:error instanceof Error?error.message:"Einladung fehlgeschlagen."}),{status:400});}
}
