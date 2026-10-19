import {useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {parseExcelFile,type ImportKind,type ImportProblem} from "../helpers/excelImport";
import {schema,postImportPreview,type ImportInput,type OutputType} from "../endpoints/import_preview_POST.schema";
import {postImportApply} from "../endpoints/import_apply_POST.schema";
import {Input} from "./Input";
import {Button} from "./Button";
import styles from "./LaunchForms.module.css";
export function ExcelImportPanel({kind}:{kind:ImportKind}){
  const client=useQueryClient();
  const [input,setInput]=useState<ImportInput|null>(null),[preview,setPreview]=useState<OutputType|null>(null);
  const [problems,setProblems]=useState<ImportProblem[]>([]);
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
  async function select(file:File|undefined){
    setInput(null);setPreview(null);setProblems([]);setError("");setSuccess("");
    if(!file)return;setBusy(true);
    try{
      const parsed=await parseExcelFile(file,kind);setProblems(parsed.problems);
      if(!parsed.rows.length)throw new Error("Keine importierbaren Zeilen erkannt. Prüfe die Hinweise und die Spaltenüberschriften.");
      const body=schema.parse({kind,fileName:file.name,rows:parsed.rows});
      const result=await postImportPreview(body);setInput(body);setPreview(result);
    }catch(e){setError(e instanceof Error?e.message:"Datei konnte nicht gelesen werden.");}
    finally{setBusy(false);}
  }
  async function apply(){
    if(!input||!preview?.accepted)return;
    setBusy(true);setError("");
    try{
      const result=await postImportApply(input);
      setSuccess(result.accepted+" Datensätze gespeichert; "+result.skipped+" übersprungen. Import-ID: "+result.batchId);
      setPreview(result);setInput(null);
      for(const key of [["employees"],["shifts"],["sites"],["pilot","dashboard"],["employee-home"],["invite-candidates"]])await client.invalidateQueries({queryKey:key});
    }catch(e){setError(e instanceof Error?e.message:"Import fehlgeschlagen.");}
    finally{setBusy(false);}
  }
  const issues=[...problems,...(preview?.issues??[])];
  return <section className={styles.panel}>
    <h2>{kind==="employees"?"1. Mitarbeiterliste importieren":"2. Dienstplan importieren"}</h2>
    <p className={styles.help}>{kind==="employees"?"Excel mit Name sowie Personalnummer oder E-Mail. E-Mail wird für den Mitarbeiterzugang benötigt. Optionale Spalten: Telefon, Qualifikation.":
      "Excel als Schichtliste (Personalnummer/E-Mail/Name, Objekt, Datum, Beginn, Ende) oder Monatsmatrix mit Datumsüberschriften und Uhrzeiten wie 12:00–20:00. Uhrzeiten gelten für Deutschland."}</p>
    <label className={styles.form}>Excel- oder CSV-Datei<Input type="file" accept=".xlsx,.csv" disabled={busy} onChange={e=>{void select(e.target.files?.[0]);}}/></label>
    <p className={styles.help}>Alte XLS-Dateien bitte zuerst als XLSX speichern. Maximal 8 MB und 2.000 erkannte Datensätze. Eine Vorschau erscheint vor dem Speichern. Bestehende Konten werden nicht automatisch verbunden; bestehende Dienste werden nicht überschrieben.</p>
    {busy&&<p role="status">Datei wird geprüft oder gespeichert…</p>}
    {preview&&<><div className={styles.summary}><span>{preview.created} neu</span><span>{preview.updated} geändert</span><span>{preview.skipped} übersprungen</span><span>{problems.length} Formatfehler</span></div>
      {preview.newSites.length>0&&<p>Neue Objekte: {preview.newSites.join(", ")}</p>}
      {kind==="shifts"&&<p className={styles.help}>Zugeordnete Dienste erscheinen nach dem Import automatisch im persönlichen Mitarbeiterkonto.</p>}</>}
    {issues.length>0&&<><h3>Diese Zeilen werden nicht importiert</h3><ul className={styles.issues}>{issues.map((issue,i)=><li key={i}>{issue.sheet}, Zeile {issue.row}: {issue.reason}</li>)}</ul></>}
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    {success&&<p role="status">{success}</p>}
    <div className={styles.actions}><Button disabled={busy||!input||!preview?.accepted} onClick={apply}>{preview?.accepted??0} gültige Datensätze importieren</Button></div>
  </section>;
}
