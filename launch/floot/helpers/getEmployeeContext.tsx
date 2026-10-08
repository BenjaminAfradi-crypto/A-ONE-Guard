import {db} from "./db";
import {requireSameOrigin} from "./requestSecurity";
import {selectedOrganization} from "./selectedOrganization";
import {getServerUserSession} from "./getServerUserSession";
export async function getEmployeeContext(request:Request){
  if(request.method!=="GET"&&request.method!=="HEAD")requireSameOrigin(request);
  const {user}=await getServerUserSession(request);
  let query=db.selectFrom("guardEmployees")
    .innerJoin("guardOrganizations","guardOrganizations.id","guardEmployees.orgId")
    .innerJoin("guardMemberships",join=>join.onRef("guardMemberships.orgId","=","guardEmployees.orgId").on("guardMemberships.userId","=",String(user.id)))
    .select(["guardEmployees.id as employeeId","guardEmployees.orgId","guardEmployees.displayName","guardOrganizations.name as orgName"])
    .where("guardEmployees.userId","=",String(user.id)).where("guardEmployees.active","=",true);
  const requested=selectedOrganization(request);
  if(requested)query=query.where("guardEmployees.orgId","=",requested);
  const rows=await query.execute();
  if(rows.length!==1)throw new Error(rows.length?"Bitte einen Mandanten auswählen.":"Kein aktives Mitarbeiterprofil gefunden.");
  return {user,...rows[0]};
}
