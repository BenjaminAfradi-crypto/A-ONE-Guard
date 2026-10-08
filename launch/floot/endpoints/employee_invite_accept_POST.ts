import {sql} from "kysely";
import superjson from "superjson";
import {db} from "../helpers/db";
import {getServerUserSession} from "../helpers/getServerUserSession";
import {requireSameOrigin} from "../helpers/requestSecurity";
import {invitationHash} from "../helpers/invitationToken";
import {schema} from "./employee_invite_accept_POST.schema";
export async function handle(request:Request){
  try{
    requireSameOrigin(request);
    const {user}=await getServerUserSession(request);
    const input=schema.parse(superjson.parse(await request.text()));
    await db.transaction().execute(async trx=>{
      const result=await sql<{id:string;org_id:string;employee_id:string;email:string}>`select id,org_id,employee_id,email from guard_employee_invitations
        where token_hash=${invitationHash(input.token)} and consumed_at is null and expires_at>now() for update`.execute(trx);
      const invite=result.rows[0];
      if(!invite||invite.email!==user.email.trim().toLowerCase())throw new Error("Einladung ungültig oder für eine andere E-Mail-Adresse.");
      const employee=await trx.selectFrom("guardEmployees").select(["id","userId","active","email"]).where("id","=",invite.employee_id).where("orgId","=",invite.org_id).forUpdate().executeTakeFirst();
      if(!employee?.active||employee.userId||employee.email?.trim().toLowerCase()!==invite.email)throw new Error("Einladung nicht mehr gültig.");
      const linked=await trx.selectFrom("guardEmployees").select("id").where("orgId","=",invite.org_id).where("userId","=",String(user.id)).executeTakeFirst();
      if(linked)throw new Error("Konto ist bereits mit einem Mitarbeiter dieses Mandanten verbunden.");
      const membership=await trx.selectFrom("guardMemberships").select("id").where("orgId","=",invite.org_id).where("userId","=",String(user.id)).executeTakeFirst();
      if(!membership)await trx.insertInto("guardMemberships").values({orgId:invite.org_id,userId:user.id,role:"employee"}).execute();
      await trx.updateTable("guardEmployees").set({userId:String(user.id)}).where("id","=",employee.id).where("orgId","=",invite.org_id).execute();
      await sql`update guard_employee_invitations set consumed_at=now() where org_id=${invite.org_id}::uuid and employee_id=${employee.id}::uuid and consumed_at is null`.execute(trx);
      await trx.insertInto("guardAuditLog").values({orgId:invite.org_id,actorUserId:String(user.id),action:"employee.invitation_accepted",entityType:"employee",entityId:employee.id,metadata:{}}).execute();
    });
    return new Response(superjson.stringify({ok:true}),{headers:{"Cache-Control":"no-store"}});
  }catch(error){return new Response(superjson.stringify({error:error instanceof Error?error.message:"Einladung fehlgeschlagen."}),{status:400});}
}
