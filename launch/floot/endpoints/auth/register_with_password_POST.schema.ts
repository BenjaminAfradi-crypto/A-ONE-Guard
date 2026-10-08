import {z} from "zod";
import superjson from "superjson";
export const schema=z.object({
  email:z.string().trim().email().max(255).transform(v=>v.toLowerCase()),
  password:z.string().min(12,"Mindestens 12 Zeichen erforderlich.").max(72),
  displayName:z.string().trim().min(1).max(180),
  token:z.string().regex(/^[a-f0-9]{64}$/,"Gültiger Einladungslink erforderlich.")
});
export type InputType=z.infer<typeof schema>;
export type OutputType={user:{id:number;email:string;displayName:string;role:"user";createdAt:Date|null}};
export async function postRegisterWithPassword(body:InputType,init?:RequestInit):Promise<OutputType>{
  const response=await fetch("/_api/auth/register_with_password",{...init,method:"POST",body:superjson.stringify(schema.parse(body)),headers:{"Content-Type":"application/json",...(init?.headers??{})}});
  const text=await response.text();
  if(!response.ok)throw new Error(superjson.parse<{message?:string}>(text).message||"Registrierung fehlgeschlagen.");
  return superjson.parse<OutputType>(text);
}
