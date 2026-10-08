import {readdirSync,readFileSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(join(dir,d.name)):[join(dir,d.name)]);}
const files=walk(root+"floot").sort((a,b)=>{
  const rank=p=>p.includes("/helpers/")?0:p.endsWith(".schema.ts")?1:p.includes("/endpoints/")?2:p.includes("/components/")?3:4;
  return rank(a)-rank(b)||a.localeCompare(b);
});
const dest=root+"patches";rmSync(dest,{recursive:true,force:true});mkdirSync(dest);
const manifest=[];
for(const [i,file] of files.entries()){
  const path=file.slice((root+"floot/").length),text=readFileSync(file,"utf8").replace(/\n$/,"");
  const patch="*** Begin Patch\n*** Add File: "+path+"\n"+text.split("\n").map(l=>"+"+l).join("\n")+"\n*** End Patch\n";
  const name=String(i+1).padStart(3,"0")+"-"+path.replaceAll("/","__")+".patch";
  writeFileSync(join(dest,name),patch);
  manifest.push({path,patch:name,sha256:createHash("sha256").update(readFileSync(file)).digest("hex"),lines:text.split("\n").length});
}
writeFileSync(join(dest,"manifest.json"),JSON.stringify({projectId:"836242b9-0ade-4b74-bf3a-422018334f39",inspectedVersion:1791364802566,requiresFreshRead:true,files:manifest},null,2));
console.log("Prepared "+files.length+" small patches. Read TRANSFER.md before applying.");
