import {useState} from "react";
import {Helmet} from "react-helmet";
import {Link} from "react-router-dom";
import {useAuth} from "../helpers/useAuth";
import {PasswordRegisterForm} from "../components/PasswordRegisterForm";
import {Button} from "../components/Button";
import {postEmployeeInviteAccept} from "../endpoints/employee_invite_accept_POST.schema";
import styles from "../components/LaunchForms.module.css";
export default function InvitationPage(){
  const {authState}=useAuth();
  const [token]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get("token")??"");
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function accept(){
    setBusy(true);setError("");
    try{await postEmployeeInviteAccept({token});window.location.replace("/mitarbeiter-app");}
    catch(e){setError(e instanceof Error?e.message:"Einladung fehlgeschlagen.");}finally{setBusy(false);}
  }
  return <main className={styles.narrow}>
    <Helmet><title>Mitarbeitereinladung · A ONE Guard</title><meta name="referrer" content="no-referrer"/></Helmet>
    <h1>Dein Mitarbeiterzugang</h1>
    <p className={styles.help}>Deine Firma hat dich eingeladen. Der Link ist 48 Stunden gültig und kann einmal verwendet werden.</p>
    {authState.type==="authenticated"?
      <div className={styles.form}><p>Angemeldet als {authState.user.email}</p><Button onClick={accept} disabled={busy||!/^[a-f0-9]{64}$/.test(token)}>{busy?"Wird verbunden…":"Einladung annehmen"}</Button>{error&&<p role="alert" className={styles.error}>{error}</p>}</div>:
      <><PasswordRegisterForm token={token}/><p><Link to="/login">Bestehendes Konto anmelden</Link></p><p className={styles.help}>Falls der Login direkt zur App führt, öffne anschließend diesen Einladungslink erneut.</p></>}
  </main>;
}
