import {db} from "./db";
import {requireSameOrigin} from "./requestSecurity";
import {selectedOrganization} from "./selectedOrganization";
import {getServerUserSession} from "./getServerUserSession";

// The historical name is kept so all existing endpoints use the hardened context.
export async function getPilotOrgContext(request:Request){
  if(request.method!=="GET"&&request.method!=="HEAD")requireSameOrigin(request);
  const {user}=await getServerUserSession(request);
  let query=db.selectFrom("guardMemberships")
    .innerJoin("guardOrganizations","guardOrganizations.id","guardMemberships.orgId")
    .select(["guardMemberships.orgId","guardMemberships.role","guardOrganizations.name as orgName","guardOrganizations.subscriptionStatus"])
    .where("guardMemberships.userId","=",String(user.id));
  const requested=selectedOrganization(request);
  if(requested)query=query.where("guardMemberships.orgId","=",requested);
  const memberships=await query.execute();
  if(memberships.length!==1)throw new Error(memberships.length?"Bitte einen Mandanten auswählen.":"Kein Zugriff auf diesen Mandanten.");
  const membership=memberships[0];
  if(!["owner","admin","dispatcher"].includes(membership.role))throw new Error("Keine Berechtigung für die Verwaltung.");
  return {user,...membership};
}
