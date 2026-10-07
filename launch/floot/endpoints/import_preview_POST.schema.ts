import { z } from "zod";
import superjson from "superjson";

export const employeeRow = z.object({
  row:z.number().int().min(1),sheet:z.string().max(100),
  employeeNo:z.string().max(60),displayName:z.string().min(1).max(180),
  email:z.string().max(255),phone:z.string().max(80),qualification:z.string().max(180)
});
export const shiftRow = z.object({
  row:z.number().int().min(1),sheet:z.string().max(100),
  employeeNo:z.string().max(60),email:z.string().max(255),
  displayName:z.string().max(180),siteName:z.string().min(1).max(180),
  title:z.string().min(1).max(180),
  startsAt:z.string().datetime({offset:true}),endsAt:z.string().datetime({offset:true})
});
export const schema = z.discriminatedUnion("kind",[
  z.object({kind:z.literal("employees"),fileName:z.string().min(1).max(180),rows:z.array(employeeRow).min(1).max(2000)}),
  z.object({kind:z.literal("shifts"),fileName:z.string().min(1).max(180),rows:z.array(shiftRow).min(1).max(2000)})
]);
export type ImportInput=z.infer<typeof schema>;
export type ImportIssue={sheet:string;row:number;reason:string};
export type OutputType={
  kind:"employees"|"shifts";total:number;accepted:number;created:number;updated:number;
  skipped:number;newSites:string[];unmatched:number;issues:ImportIssue[];
};
export async function postImportPreview(body:ImportInput,init?:RequestInit):Promise<OutputType>{
  const response=await fetch("/_api/import_preview",{method:"POST",body:superjson.stringify(schema.parse(body)),...init,
    headers:{"Content-Type":"application/json",...(init?.headers??{})}});
  const text=await response.text();
  if(!response.ok) throw new Error(superjson.parse<{error?:string}>(text).error||"Vorschau fehlgeschlagen.");
  return superjson.parse<OutputType>(text);
}

