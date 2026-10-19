import superjson from "superjson";
export type OutputType={memberships:{orgId:string;orgName:string;role:string}[];selectedOrgId:string|null};
export async function getTenantContext():Promise<OutputType>{
  const response=await fetch("/_api/tenant_context");const text=await response.text();
  if(!response.ok)throw new Error(superjson.parse<{error:string}>(text).error);return superjson.parse<OutputType>(text);
}
