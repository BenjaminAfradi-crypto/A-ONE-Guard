import {z} from "zod";
import superjson from "superjson";
export const schema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/)});
export async function postEmployeeInviteAccept(body:z.infer<typeof schema>):Promise<{ok:true}>{
  const response=await fetch("/_api/employee_invite_accept",{method:"POST",headers:{"Content-Type":"application/json"},body:superjson.stringify(schema.parse(body))});
  const text=await response.text();if(!response.ok)throw new Error(superjson.parse<{error:string}>(text).error);
  return superjson.parse<{ok:true}>(text);
}
