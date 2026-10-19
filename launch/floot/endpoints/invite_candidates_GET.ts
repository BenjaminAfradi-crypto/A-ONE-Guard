import superjson from "superjson";
import {db} from "../helpers/db";
import {getPilotOrgContext} from "../helpers/getPilotOrgContext";
export async function handle(request:Request){
  try{
    const context=await getPilotOrgContext(request);
    const rows=await db.selectFrom("guardEmployees").select(["id","displayName","email","userId"]).where("orgId","=",context.orgId).where("active","=",true).orderBy("displayName").execute();
    return new Response(superjson.stringify({employees:rows.map(({userId,...employee})=>({...employee,linked:Boolean(userId)}))}),{headers:{"Cache-Control":"no-store"}});
  }catch(error){return new Response(superjson.stringify({error:error instanceof Error?error.message:"Keine Berechtigung."}),{status:403});}
}
