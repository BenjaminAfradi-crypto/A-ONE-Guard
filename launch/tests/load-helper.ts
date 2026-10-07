import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
export async function loadHelper(name:string){
  const content=readFileSync(new URL("../floot/helpers/"+name+".tsx",import.meta.url),"utf8");
  const js=stripTypeScriptTypes(content,{mode:"transform"});
  return import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));
}
