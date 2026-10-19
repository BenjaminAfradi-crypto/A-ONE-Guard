import superjson from "superjson";
import { schema, type ImportInput, type OutputType } from "./import_preview_POST.schema";
export type ApplyOutputType=OutputType & {batchId:string};
export async function postImportApply(body:ImportInput,init?:RequestInit):Promise<ApplyOutputType>{
  const response=await fetch("/_api/import_apply",{method:"POST",body:superjson.stringify(schema.parse(body)),...init,
    headers:{"Content-Type":"application/json",...(init?.headers??{})}});
  const text=await response.text();
  if(!response.ok) throw new Error(superjson.parse<{error?:string}>(text).error||"Import fehlgeschlagen.");
  return superjson.parse<ApplyOutputType>(text);
}


export {schema};
