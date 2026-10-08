import type {ReactNode} from "react";
import {Link,useLocation,useNavigate} from "react-router-dom";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {Building2,CalendarDays,Clock3,FileText,Gauge,LogOut,ShieldCheck,ScanLine,BarChart3,UsersRound,Upload} from "lucide-react";
import {useAuth} from "../helpers/useAuth";
import {getTenantContext} from "../endpoints/tenant_context_GET.schema";
import {postTenantSelect} from "../endpoints/tenant_select_POST.schema";
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from "./Select";
import {Button} from "./Button";
import {useState} from "react";
import styles from "./PilotShell.module.css";
const links=[
  {to:"/",label:"Command Center",icon:Gauge},{to:"/dienstplan",label:"Dienstplan",icon:CalendarDays},
  {to:"/import",label:"Excel-Import",icon:Upload},{to:"/zeiterfassung",label:"Zeiterfassung",icon:Clock3},
  {to:"/mitarbeiter",label:"Mitarbeiter",icon:UsersRound},{to:"/objekte",label:"Objekte",icon:Building2},
  {to:"/wachbuch",label:"Wachbuch",icon:FileText},{to:"/wks",label:"WKS",icon:ScanLine},
  {to:"/compliance",label:"Compliance",icon:ShieldCheck},{to:"/reporting",label:"Reporting",icon:BarChart3}
];
export const PilotShell=({children,className}:{children:ReactNode;className?:string})=>{
  const location=useLocation(),navigate=useNavigate(),client=useQueryClient();
  const {authState,logout}=useAuth();
  const tenant=useQuery({queryKey:["tenant-context"],queryFn:getTenantContext});
  const [error,setError]=useState(""),[switching,setSwitching]=useState(false);
  const selected=tenant.data?.memberships.find(m=>m.orgId===tenant.data?.selectedOrgId);
  const management=selected&&["owner","admin","dispatcher"].includes(selected.role);
  async function select(orgId:string){
    setSwitching(true);setError("");
    try{await postTenantSelect({orgId});client.clear();window.location.reload();}
    catch(e){setError(e instanceof Error?e.message:"Mandantenwechsel fehlgeschlagen.");setSwitching(false);}
  }
  async function signOut(){await logout();client.clear();navigate("/login",{replace:true});}
  return <div className={styles.shell+(className?" "+className:"")}>
    <aside className={styles.sidebar}>
      <Link to="/" className={styles.brand}><div className={styles.mark}>A1</div><div><strong>A ONE Guard</strong><span>Security OS</span></div></Link>
      <div className={styles.tenant}><ShieldCheck size={16}/>{selected?.orgName??"Mandant auswählen"}</div>
      {(tenant.data?.memberships.length??0)>1&&<Select disabled={switching} value={tenant.data?.selectedOrgId??""} onValueChange={v=>{void select(v);}}>
        <SelectTrigger aria-label="Mandant auswählen"><SelectValue placeholder="Firma auswählen"/></SelectTrigger><SelectContent>{tenant.data?.memberships.map(m=><SelectItem key={m.orgId} value={m.orgId}>{m.orgName}</SelectItem>)}</SelectContent>
      </Select>}
      {error&&<p role="alert">{error}</p>}
      <nav className={styles.nav}>
        {(management?links:[{to:"/mitarbeiter-app",label:"Meine Dienste",icon:CalendarDays},{to:"/scan",label:"Zeiterfassung",icon:Clock3},{to:"/checkpoint",label:"Kontrollpunkt",icon:ScanLine}]).map(item=>{
          const Icon=item.icon,active=item.to==="/"?location.pathname==="/":location.pathname.startsWith(item.to);
          return <Link key={item.to} to={item.to} className={styles.navLink+(active?" "+styles.active:"")}><Icon size={17}/><span>{item.label}</span></Link>;
        })}
      </nav>
      <div className={styles.user}><div><strong>{authState.type==="authenticated"?authState.user.displayName:"A ONE Guard"}</strong><span>{management?"Verwaltung":"Mitarbeiterzugang"}</span></div><Button variant="ghost" onClick={signOut} aria-label="Abmelden"><LogOut size={17}/></Button></div>
    </aside>
    <main className={styles.main}>{children}</main>
  </div>;
};
