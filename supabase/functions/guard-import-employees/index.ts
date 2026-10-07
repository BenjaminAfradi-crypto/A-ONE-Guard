import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const clean=(v:unknown)=>String(v??"").trim();
const norm=(v:unknown)=>clean(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/[^a-z0-9]/g,"");
const emailOk=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function pick(row:Record<string,unknown>,aliases:string[]){const keys=Object.keys(row);for(const a of aliases){const wanted=norm(a),k=keys.find(x=>norm(x)===wanted);if(k&&clean(row[k]))return clean(row[k]);}return "";}
function num(v:string){if(!v)return null;const x=Number(v.replace(/\./g,"").replace(",","."));return Number.isFinite(x)?x:null;}
function dateOnly(v:string){if(!v)return null;const m=v.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);if(m){const y=Number(m[3])<100?2000+Number(m[3]):Number(m[3]);return `${y}-${String(Number(m[2])).padStart(2,"0")}-${String(Number(m[1])).padStart(2,"0")}`;}const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10);}
function qualification(v:string){const x=norm(v);if(x.includes("sachkund"))return "sachkunde";if(x.includes("unterrichtung"))return "unterrichtung";return "none";}
function status(v:string){const x=norm(v);if(["inaktiv","inactive","ausgeschieden","beendet"].includes(x))return "inactive";return "active";}
function makePassword(){const alpha="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";const b=crypto.getRandomValues(new Uint8Array(18));let s="A1!a";for(const x of b)s+=alpha[x%alpha.length];return s;}
async function sha256(bytes:Uint8Array){const h=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function normalizeRow(row:Record<string,unknown>,index:number){
  const first=pick(row,["Vorname","First Name","Firstname"]), last=pick(row,["Nachname","Familienname","Surname","Last Name","Lastname"]), full=pick(row,["Name","Vollständiger Name","Mitarbeiter","Mitarbeitername"]);
  const display_name=clean(full||[first,last].filter(Boolean).join(" "));
  const email=pick(row,["E-Mail","Email","Mail","E Mail"]).toLowerCase();
  const hourly=num(pick(row,["Stundenlohn","Stundenlohn EUR","Lohn pro Stunde","Hourly Rate"]));
  const vacation=num(pick(row,["Urlaubstage","Urlaubstage/Jahr","Jahresurlaub"]));
  const knownAliases=["Vorname","First Name","Firstname","Nachname","Familienname","Surname","Last Name","Lastname","Name","Vollständiger Name","Mitarbeiter","Mitarbeitername","E-Mail","Email","Mail","E Mail","Telefon","Handy","Mobil","Mobilnummer","Mitarbeiternummer","Mitarbeiter-Nr","Personalnummer","Personal-Nr","MA-Nr","Bewacher-ID","Bewacher ID","Bewacherregister","Qualifikation","34a","Sachkunde","Geburtsdatum","Geburtstag","Straße","Strasse","Adresse","Hausnummer","Nr","PLZ","Postleitzahl","Ort","Stadt","Land","Steuer-ID","Steuer ID","Steueridentifikationsnummer","IdNr","Sozialversicherungsnummer","SV-Nummer","Rentenversicherungsnummer","Krankenkasse","Krankenversicherung","IBAN","BIC","Nationalität","Staatsangehörigkeit","Steuerklasse","Eintrittsdatum","Beschäftigungsbeginn","Austrittsdatum","Beschäftigungsende","Notfallkontakt","Notfall Telefon","Notfalltelefon","Stundenlohn","Stundenlohn EUR","Lohn pro Stunde","Hourly Rate","Urlaubstage","Urlaubstage/Jahr","Jahresurlaub","Status"];
  const known=new Set(knownAliases.map(norm));const extra:Record<string,unknown>={};for(const [k,v] of Object.entries(row)){if(!known.has(norm(k))&&clean(v)!=="")extra[k]=v;}
  return {row_no:index+2,display_name,email,employee_no:pick(row,["Mitarbeiternummer","Mitarbeiter-Nr","Personalnummer","Personal-Nr","MA-Nr"]),phone:pick(row,["Telefon","Handy","Mobil","Mobilnummer"]),bewacher_id:pick(row,["Bewacher-ID","Bewacher ID","Bewacherregister"]),qualification_level:qualification(pick(row,["Qualifikation","34a","Sachkunde"])),status:status(pick(row,["Status"])),hourly_rate_cents:hourly==null?null:Math.round(hourly*100),vacation_days_annual:vacation,private:{birth_date:dateOnly(pick(row,["Geburtsdatum","Geburtstag"])),street:pick(row,["Straße","Strasse","Adresse"]),house_no:pick(row,["Hausnummer","Nr"]),postal_code:pick(row,["PLZ","Postleitzahl"]),city:pick(row,["Ort","Stadt"]),country:pick(row,["Land"]),tax_id:pick(row,["Steuer-ID","Steuer ID","Steueridentifikationsnummer","IdNr"]),social_security_no:pick(row,["Sozialversicherungsnummer","SV-Nummer","Rentenversicherungsnummer"]),health_insurance:pick(row,["Krankenkasse","Krankenversicherung"]),iban:pick(row,["IBAN"]).replace(/\s/g,""),bic:pick(row,["BIC"]).replace(/\s/g,""),nationality:pick(row,["Nationalität","Staatsangehörigkeit"]),tax_class:pick(row,["Steuerklasse"]),employment_start_date:dateOnly(pick(row,["Eintrittsdatum","Beschäftigungsbeginn"])),employment_end_date:dateOnly(pick(row,["Austrittsdatum","Beschäftigungsende"])),emergency_contact:pick(row,["Notfallkontakt"]),emergency_phone:pick(row,["Notfall Telefon","Notfalltelefon"]),extra_fields:extra}};
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  try{
    const authHeader=req.headers.get("Authorization");if(!authHeader)return json({error:"missing_authorization"},401);
    const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const caller=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
    const {data:u,error:ue}=await caller.auth.getUser();if(ue||!u.user)return json({error:"invalid_session"},401);
    const body=await req.json();const action=clean(body.action||"parse");const orgId=clean(body.org_id);if(!orgId)return json({error:"org_id_required"},400);
    const {data:member}=await caller.from("guard_memberships").select("role,active").eq("org_id",orgId).eq("user_id",u.user.id).eq("active",true).maybeSingle();if(!member||!["owner","admin"].includes(member.role))return json({error:"hr_admin_required"},403);

    if(action==="parse"){
      const b64=clean(body.file_base64),filename=clean(body.file_name||"Mitarbeiter.xlsx");if(!b64)return json({error:"file_required"},400);
      const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));if(raw.byteLength>8*1024*1024)return json({error:"file_too_large","message":"Maximal 8 MB pro Importdatei."},413);
      const wb=XLSX.read(raw,{type:"array",cellDates:true});const ws=wb.Sheets[wb.SheetNames[0]];if(!ws)return json({error:"empty_workbook"},400);
      const source=XLSX.utils.sheet_to_json<Record<string,unknown>>(ws,{defval:"",raw:false});if(!source.length)return json({error:"no_rows"},400);if(source.length>2000)return json({error:"too_many_rows","message":"Maximal 2.000 Mitarbeiter pro Datei."},400);
      const rows=source.map((r,i)=>normalizeRow(r,i));const warnings=rows.filter(r=>!r.display_name).map(r=>`Zeile ${r.row_no}: Name fehlt.`);return json({ok:true,file_name:filename,file_sha256:await sha256(raw),headers:Object.keys(source[0]||{}),rows,warnings,total:rows.length});
    }

    if(action!=="import")return json({error:"invalid_action"},400);
    const rows=Array.isArray(body.rows)?body.rows:[];if(!rows.length||rows.length>50)return json({error:"rows_must_be_1_to_50"},400);
    const createAccounts=body.create_accounts===true;const results:any[]=[];const credentials:any[]=[];let created=0,updated=0,accounts=0,failed=0;
    for(const row of rows){
      let newUserId:string|null=null;let createdEmployeeId:string|null=null;let pendingCredential:any=null;let existing:any=null;let employeeId:string|null=null;try{
        const name=clean(row.display_name);if(name.length<2)throw new Error("Name fehlt oder ist zu kurz");const email=clean(row.email).toLowerCase();if(email&&!emailOk(email))throw new Error("E-Mail ist ungültig");
        if(clean(row.employee_no)){const {data}=await admin.from("guard_employees").select("*").eq("org_id",orgId).eq("employee_no",clean(row.employee_no)).maybeSingle();existing=data;}if(!existing&&email){const {data}=await admin.from("guard_employees").select("*").eq("org_id",orgId).eq("email",email).maybeSingle();existing=data;}
        let userId:string|null=existing?.user_id||null;let tempPassword:string|null=null;
        if(existing){
          if(createAccounts&&!userId&&email){tempPassword=makePassword();const {data:cu,error:ce}=await admin.auth.admin.createUser({email,password:tempPassword,email_confirm:true,user_metadata:{display_name:name,aone_guard:true},app_metadata:{aone_guard:true,must_change_password:true}});if(ce||!cu.user)throw new Error(`Account: ${ce?.message||"konnte nicht erstellt werden"}`);newUserId=cu.user.id;userId=newUserId;const {error:me}=await admin.from("guard_memberships").insert({org_id:orgId,user_id:userId,role:"employee",active:true});if(me)throw me;pendingCredential={row_no:row.row_no,name,email,temporary_password:tempPassword};}
          const patch:any={display_name:name,email:email||existing.email||null,phone:clean(row.phone)||existing.phone||null,bewacher_id:clean(row.bewacher_id)||existing.bewacher_id||null,qualification_level:clean(row.qualification_level)||existing.qualification_level||"none",status:clean(row.status)||existing.status||"active",updated_at:new Date().toISOString()};if(clean(row.employee_no))patch.employee_no=clean(row.employee_no);if(row.hourly_rate_cents!=null)patch.hourly_rate_cents=Number(row.hourly_rate_cents);if(row.vacation_days_annual!=null)patch.vacation_days_annual=Number(row.vacation_days_annual);if(userId&&!existing.user_id)patch.user_id=userId;const {data:eu,error:ee}=await admin.from("guard_employees").update(patch).eq("id",existing.id).select("id").single();if(ee)throw ee;employeeId=eu.id;updated++;
        }else{
          if(createAccounts&&email){tempPassword=makePassword();const {data:cu,error:ce}=await admin.auth.admin.createUser({email,password:tempPassword,email_confirm:true,user_metadata:{display_name:name,aone_guard:true},app_metadata:{aone_guard:true,must_change_password:true}});if(ce||!cu.user)throw new Error(`Account: ${ce?.message||"konnte nicht erstellt werden"}`);newUserId=cu.user.id;userId=newUserId;const {error:me}=await admin.from("guard_memberships").insert({org_id:orgId,user_id:userId,role:"employee",active:true});if(me)throw me;pendingCredential={row_no:row.row_no,name,email,temporary_password:tempPassword};}
          const erow:any={org_id:orgId,user_id:userId,display_name:name,email:email||null,employee_no:clean(row.employee_no)||null,phone:clean(row.phone)||null,bewacher_id:clean(row.bewacher_id)||null,qualification_level:clean(row.qualification_level)||"none",status:clean(row.status)||"active",hourly_rate_cents:row.hourly_rate_cents==null?null:Number(row.hourly_rate_cents),vacation_days_annual:row.vacation_days_annual==null?null:Number(row.vacation_days_annual)};const {data:ei,error:ee}=await admin.from("guard_employees").insert(erow).select("id").single();if(ee)throw ee;employeeId=ei.id;createdEmployeeId=employeeId;
        }
        const p=row.private&&typeof row.private==="object"?row.private:null;
        if(p){
          const privatePatch:any={source:"excel_import",updated_at:new Date().toISOString(),updated_by:u.user.id};
          const textFields=["street","house_no","postal_code","city","country","tax_id","social_security_no","health_insurance","iban","bic","nationality","tax_class","emergency_contact","emergency_phone"];
          for(const key of textFields){const value=clean(p[key]);if(value)privatePatch[key]=value;}
          for(const key of ["birth_date","employment_start_date","employment_end_date"]){if(p[key])privatePatch[key]=p[key];}
          if(p.extra_fields&&typeof p.extra_fields==="object"&&Object.keys(p.extra_fields).length)privatePatch.extra_fields=p.extra_fields;
          const meaningful=Object.keys(privatePatch).some(k=>!["source","updated_at","updated_by"].includes(k));
          if(meaningful){
            const {data:existingPrivate,error:readPrivateError}=await admin.from("guard_employee_private").select("employee_id").eq("employee_id",employeeId).maybeSingle();
            if(readPrivateError)throw readPrivateError;
            const write=existingPrivate
              ? await admin.from("guard_employee_private").update(privatePatch).eq("employee_id",employeeId)
              : await admin.from("guard_employee_private").insert({employee_id:employeeId,org_id:orgId,...privatePatch});
            if(write.error)throw write.error;
          }
        }
        await admin.from("guard_audit_log").insert({org_id:orgId,actor_user_id:u.user.id,entity_type:"employee",entity_id:employeeId,action:existing?"excel_import_updated":"excel_import_created",after_data:{row_no:row.row_no,account_created:!!newUserId}});
        if(createdEmployeeId)created++;if(newUserId){accounts++;if(pendingCredential)credentials.push(pendingCredential);}
        results.push({row_no:row.row_no,ok:true,employee_id:employeeId,account_created:!!newUserId});
      }catch(e){
        failed++;
        if(createdEmployeeId)await admin.from("guard_employees").delete().eq("id",createdEmployeeId);
        else if(existing?.id){
          await admin.from("guard_employees").update({
            user_id:existing.user_id??null,employee_no:existing.employee_no??null,display_name:existing.display_name,
            email:existing.email??null,phone:existing.phone??null,bewacher_id:existing.bewacher_id??null,
            qualification_level:existing.qualification_level,status:existing.status,
            hourly_rate_cents:existing.hourly_rate_cents??null,vacation_days_annual:existing.vacation_days_annual??null,
            updated_at:existing.updated_at
          }).eq("id",existing.id).eq("org_id",orgId);
        }
        if(newUserId){await admin.from("guard_memberships").delete().eq("org_id",orgId).eq("user_id",newUserId);await admin.auth.admin.deleteUser(newUserId);}
        results.push({row_no:row.row_no,ok:false,error:e instanceof Error?e.message:"Importfehler"});
      }
    }
    await admin.from("guard_employee_import_batches").insert({org_id:orgId,file_name:clean(body.file_name)||null,file_sha256:clean(body.file_sha256)||null,total_rows:rows.length,imported_rows:created,updated_rows:updated,account_rows:accounts,failed_rows:failed,status:failed===0?"completed":created+updated>0?"partial":"failed",created_by:u.user.id});
    return json({ok:failed===0,created,updated,accounts,failed,results,credentials});
  }catch(e){return json({error:e instanceof Error?e.message:"unexpected_error"},500)}
});