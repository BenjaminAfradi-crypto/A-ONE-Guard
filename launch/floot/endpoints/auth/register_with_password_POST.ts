import {randomBytes} from "crypto";
import {sql} from "kysely";
import superjson from "superjson";
import {db} from "../../helpers/db";
import {schema} from "./register_with_password_POST.schema";
import {generatePasswordHash} from "../../helpers/generatePasswordHash";
import {setServerSession,SessionExpirationSeconds} from "../../helpers/getSetServerSession";
import {requireSameOrigin} from "../../helpers/requestSecurity";
import {invitationHash} from "../../helpers/invitationToken";

type Invitation={id:string;org_id:string;employee_id:string;email:string};
export async function handle(request:Request){
  try{
    requireSameOrigin(request);
    const input=schema.parse(superjson.parse(await request.text()));
    if(Buffer.byteLength(input.password,"utf8")>72)throw new Error("Passwort überschreitet 72 UTF-8-Bytes.");
    const passwordHash=await generatePasswordHash(input.password);
    const now=new Date(),sessionId=randomBytes(32).toString("hex");
    const user=await db.transaction().execute(async trx=>{
      const invited=await sql<Invitation>`select id,org_id,employee_id,email from guard_employee_invitations
        where token_hash=${invitationHash(input.token)} and consumed_at is null and expires_at>now() for update`.execute(trx);
      const invite=invited.rows[0];
      if(!invite||invite.email!==input.email)throw new Error("Einladung ungültig, abgelaufen oder E-Mail stimmt nicht überein.");
      const employee=await trx.selectFrom("guardEmployees").select(["id","email","active","userId","displayName"])
        .where("id","=",invite.employee_id).where("orgId","=",invite.org_id).forUpdate().executeTakeFirst();
      if(!employee?.active||employee.userId||employee.email?.trim().toLowerCase()!==input.email)throw new Error("Einladung nicht mehr gültig.");
      await sql`select pg_advisory_xact_lock(hashtextextended(${"guard-register:"+input.email},0))`.execute(trx);
      const existing=await trx.selectFrom("users").select("id").where(sql<boolean>`lower(email)=${input.email}`).executeTakeFirst();
      if(existing)throw new Error("Für diese E-Mail existiert bereits ein Konto. Bitte anmelden und Einladung dort annehmen.");
      const created=await trx.insertInto("users").values({email:input.email,displayName:employee.displayName,role:"user"})
        .returning(["id","email","displayName","createdAt"]).executeTakeFirstOrThrow();
      await trx.insertInto("userPasswords").values({userId:created.id,passwordHash}).execute();
      await trx.insertInto("guardMemberships").values({orgId:invite.org_id,userId:created.id,role:"employee"}).execute();
      await trx.updateTable("guardEmployees").set({userId:String(created.id)}).where("id","=",employee.id).where("orgId","=",invite.org_id).execute();
      await sql`update guard_employee_invitations set consumed_at=now() where org_id=${invite.org_id}::uuid and employee_id=${employee.id}::uuid and consumed_at is null`.execute(trx);
      await trx.insertInto("guardAuditLog").values({orgId:invite.org_id,actorUserId:String(created.id),action:"employee.invitation_accepted",entityType:"employee",entityId:employee.id,metadata:{}}).execute();
      await trx.insertInto("sessions").values({id:sessionId,userId:created.id,createdAt:now,lastAccessed:now,expiresAt:new Date(now.getTime()+SessionExpirationSeconds*1000)}).execute();
      return {...created,role:"user" as const};
    });
    const response=new Response(superjson.stringify({user}),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
    await setServerSession(response,{id:sessionId,createdAt:now.getTime(),lastAccessed:now.getTime()});
    return response;
  }catch(error){
    return new Response(superjson.stringify({message:error instanceof Error?error.message:"Registrierung fehlgeschlagen."}),{status:400});
  }
}
