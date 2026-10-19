import superjson from "superjson";
import {db} from "../helpers/db";
import {getServerUserSession} from "../helpers/getServerUserSession";
import {requireSameOrigin} from "../helpers/requestSecurity";
import {schema} from "./tenant_select_POST.schema";
export async function handle(request:Request){
  try{
    requireSameOrigin(request);const {user}=await getServerUserSession(request);
    const input=schema.parse(superjson.parse(await request.text()));
    const membership=await db.selectFrom("guardMemberships").select("id").where("orgId","=",input.orgId).where("userId","=",String(user.id)).executeTakeFirst();
    if(!membership)return new Response(superjson.stringify({error:"Kein Zugriff auf diesen Mandanten."}),{status:403});
    return new Response(superjson.stringify({ok:true}),{headers:{"Cache-Control":"no-store","Set-Cookie":"guard_org="+input.orgId+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000"}});
  }catch(error){return new Response(superjson.stringify({error:error instanceof Error?error.message:"Mandantenauswahl fehlgeschlagen."}),{status:400});}
}
