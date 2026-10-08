import superjson from "superjson";
import {db} from "../helpers/db";
import {getServerUserSession} from "../helpers/getServerUserSession";
import {selectedOrganization} from "../helpers/selectedOrganization";
export async function handle(request:Request){
  try{
    const {user}=await getServerUserSession(request);
    const memberships=await db.selectFrom("guardMemberships")
      .innerJoin("guardOrganizations","guardOrganizations.id","guardMemberships.orgId")
      .select(["guardMemberships.orgId","guardOrganizations.name as orgName","guardMemberships.role"])
      .where("guardMemberships.userId","=",String(user.id)).execute();
    const requested=selectedOrganization(request);
    const selectedOrgId=memberships.find(m=>m.orgId===requested)?.orgId??(memberships.length===1?memberships[0].orgId:null);
    return new Response(superjson.stringify({memberships,selectedOrgId}),{headers:{"Cache-Control":"no-store"}});
  }catch(error){return new Response(superjson.stringify({error:"Bitte anmelden."}),{status:401});}
}
