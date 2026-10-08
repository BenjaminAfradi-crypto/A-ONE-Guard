import {useState,type FormEvent} from "react";
import {useNavigate,Link} from "react-router-dom";
import {postRegisterWithPassword} from "../endpoints/auth/register_with_password_POST.schema";
import {Input} from "./Input";
import {Button} from "./Button";
import styles from "./LaunchForms.module.css";
export function PasswordRegisterForm({token:providedToken}:{token?:string}={}){
  const navigate=useNavigate();
  const [token]=useState(()=>providedToken??new URLSearchParams(window.location.hash.slice(1)).get("token")??"");
  const [form,setForm]=useState({email:"",displayName:"",password:""});
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function submit(event:FormEvent){
    event.preventDefault();setBusy(true);setError("");
    try{
      await postRegisterWithPassword({...form,token});
      // A reload lets the shared auth provider fetch the new server session.
      window.location.replace("/mitarbeiter-app");
    }catch(e){setError(e instanceof Error?e.message:"Registrierung fehlgeschlagen.");}
    finally{setBusy(false);}
  }
  if(!/^[a-f0-9]{64}$/.test(token))return <div className={styles.panel}><p>Für den Mitarbeiterzugang brauchst du einen Einladungslink deiner Firma.</p><Link to="/login">Zum Login</Link></div>;
  return <form className={styles.form} onSubmit={submit}>
    <label>Name<Input autoComplete="name" required value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})}/></label>
    <label>E-Mail aus der Einladung<Input type="email" autoComplete="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    <label>Passwort (mindestens 12 Zeichen)<Input type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    <Button disabled={busy} type="submit">{busy?"Konto wird angelegt…":"Mitarbeiterkonto anlegen"}</Button>
    <Button type="button" variant="ghost" onClick={()=>navigate("/login")}>Bereits ein Konto? Anmelden</Button>
  </form>;
}
