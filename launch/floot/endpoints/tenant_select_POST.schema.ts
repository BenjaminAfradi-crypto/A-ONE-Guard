import {z} from "zod";
import superjson from "superjson";
export const schema=z.object({orgId:z.string().uuid()});
export async function postTenantSelect(body:z.infer<typeof schema>):Promise<{ok:true}>{
  const response=await fetch("/_api/tenant_select",{method:"POST",headers:{"Content-Type":"application/json"},body:superjson.stringify(schema.parse(body))});
  const text=await response.text();if(!response.ok)throw new Error(superjson.parse<{error:string}>(text).error);return superjson.parse<{ok:true}>(text);
}
