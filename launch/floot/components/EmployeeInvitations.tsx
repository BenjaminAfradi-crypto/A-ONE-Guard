import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getInviteCandidates} from "../endpoints/invite_candidates_GET.schema";
import {postEmployeeInvite} from "../endpoints/employee_invite_POST.schema";
import {Button} from "./Button";
import styles from "./LaunchForms.module.css";
export function EmployeeInvitations(){
  const query=useQuery({queryKey:["invite-candidates"],queryFn:getInviteCandidates});
  const [busy,setBusy]=useState(""),[error,setError]=useState(""),[link,setLink]=useState(""),[email,setEmail]=useState(""),[copied,setCopied]=useState(false);
  async function invite(employeeId:string){
    setBusy(employeeId);setError("");setLink("");setCopied(false);
    try{const result=await postEmployeeInvite({employeeId});setEmail(result.email);setLink(window.location.origin+"/einladung#token="+result.token);}
    catch(e){setError(e instanceof Error?e.message:"Einladung fehlgeschlagen.");}finally{setBusy("");}
  }
  async function copy(){try{await navigator.clipboard.writeText(link);setCopied(true);}catch{setError("Link bitte unten markieren und kopieren.");}}
  return <section className={styles.panel}>
    <h2>3. Mitarbeiter sicher einladen</h2>
    <p className={styles.help}>Erstelle nach dem Mitarbeiterimport einen persönlichen Link und sende ihn direkt an die hinterlegte Person. Er gilt 48 Stunden, ist einmal verwendbar und ersetzt frühere Einladungen. Es wird keine E-Mail automatisch versendet.</p>
    {query.isFetching&&<p>Mitarbeiter werden geladen…</p>}
    {query.isError&&<p role="alert" className={styles.error}>{query.error.message}</p>}
    {query.data?.employees.length===0&&<p>Noch keine Mitarbeiter vorhanden.</p>}
    <div className={styles.candidates}>{query.data?.employees.map(employee=><div className={styles.candidate} key={employee.id}>
      <span>{employee.displayName}<br/>{employee.email||"E-Mail fehlt"}</span>
      <Button onClick={()=>{void invite(employee.id);}} disabled={Boolean(busy)||employee.linked||!employee.email}>{employee.linked?"Konto verbunden":busy===employee.id?"Wird erstellt…":"Einladungslink erstellen"}</Button>
    </div>)}</div>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    {link&&<div className={styles.form}><p>Einladung für {email}</p><p className={styles.token}>{link}</p><Button onClick={copy}>{copied?"Kopiert":"Link kopieren"}</Button></div>}
  </section>;
}
