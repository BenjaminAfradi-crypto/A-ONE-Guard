import {z} from "zod";
import superjson from "superjson";
export const schema=z.object({employeeId:z.string().uuid()});
export type OutputType={token:string;email:string;expiresAt:Date};
export async function postEmployeeInvite(body:z.infer<typeof schema>):Promise<OutputType>{
  const response=await fetch("/_api/employee_invite",{method:"POST",headers:{"Content-Type":"application/json"},body:superjson.stringify(schema.parse(body))});
  const text=await response.text();
  if(!response.ok)throw new Error(superjson.parse<{error:string}>(text).error);
  return superjson.parse<OutputType>(text);
}
