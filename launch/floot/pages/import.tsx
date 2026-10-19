import {Helmet} from "react-helmet";
import {PilotShell} from "../components/PilotShell";
import {ExcelImportPanel} from "../components/ExcelImportPanel";
import {EmployeeInvitations} from "../components/EmployeeInvitations";
import styles from "../components/LaunchForms.module.css";
export default function ImportPage(){
  return <PilotShell><div className={styles.layout}>
    <Helmet><title>Excel-Import und Einladungen · A ONE Guard</title></Helmet>
    <h1>Mitarbeiter und Dienstplan aus Excel</h1>
    <p className={styles.help}>Importiere zuerst die Mitarbeiterliste, danach den Dienstplan. Jeder Mitarbeiter bekommt nach Annahme seiner Einladung nur seine eigenen Dienste angezeigt.</p>
    <ExcelImportPanel kind="employees"/><ExcelImportPanel kind="shifts"/><EmployeeInvitations/>
  </div></PilotShell>;
}
