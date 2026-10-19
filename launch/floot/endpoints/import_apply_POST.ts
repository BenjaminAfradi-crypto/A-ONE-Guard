import superjson from "superjson";
import {schema} from "./import_preview_POST.schema";
import {getPilotOrgContext} from "../helpers/getPilotOrgContext";
import {requireSameOrigin} from "../helpers/requestSecurity";
import {importService} from "../helpers/importService";
export async function handle(request:Request){
  try{
    requireSameOrigin(request);
    const context=await getPilotOrgContext(request);
    const text=await request.text();
    if(text.length>4*1024*1024)throw new Error("Importanfrage zu groß.");
    const input=schema.parse(superjson.parse(text));
    return new Response(superjson.stringify(await importService(context.orgId,String(context.user.id),input,true)),{headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
  }catch(error){
    return new Response(superjson.stringify({error:error instanceof Error?error.message:"Import fehlgeschlagen."}),{status:400});
  }
}
