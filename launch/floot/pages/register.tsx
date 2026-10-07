import {Helmet} from "react-helmet";
import {PasswordRegisterForm} from "../components/PasswordRegisterForm";
import styles from "../components/LaunchForms.module.css";
export default function RegisterPage(){
  return <main className={styles.narrow}><Helmet><title>Mitarbeiterkonto · A ONE Guard</title><meta name="referrer" content="no-referrer"/></Helmet><h1>Mitarbeiterkonto anlegen</h1><PasswordRegisterForm/></main>;
}
