import {cpSync,mkdirSync,rmSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
const root=fileURLToPath(new URL("../",import.meta.url));
const work=root+".verification/work";
rmSync(root+".verification",{recursive:true,force:true});mkdirSync(work,{recursive:true});
cpSync(root+"floot",work,{recursive:true});cpSync(root+"verification/fixtures/schema.tsx",work+"/helpers/schema.tsx");
const put=(path,text)=>{mkdirSync(path.slice(0,path.lastIndexOf("/")),{recursive:true});writeFileSync(path,text);};
// Compile-only adapters for existing Floot files unavailable under the build cap.
// They are never included in transfer patches and are not integration mocks.
put(work+"/helpers/db.tsx",'import type {Kysely} from "kysely";import type {DB} from "./schema";export declare const db:Kysely<DB>;');
put(work+"/helpers/getServerUserSession.tsx",'export declare function getServerUserSession(request:Request):Promise<{user:{id:number;email:string;displayName:string;role:"admin"|"user"}}>;');
put(work+"/helpers/getSetServerSession.tsx",'export declare const SessionExpirationSeconds:number;export declare function setServerSession(response:Response,session:{id:string;createdAt:number;lastAccessed:number}):Promise<void>;');
put(work+"/helpers/generatePasswordHash.tsx",'export declare function generatePasswordHash(password:string):Promise<string>;');
put(work+"/helpers/useAuth.tsx",'type User={id:number;email:string;displayName:string;role:"admin"|"user"};export declare function useAuth():{authState:{type:"authenticated";user:User}|{type:"loading"|"unauthenticated"};logout:()=>Promise<void>};');
put(work+"/components/Input.tsx",'import type {InputHTMLAttributes,FC} from "react";export declare const Input:FC<InputHTMLAttributes<HTMLInputElement>>;');
put(work+"/components/Button.tsx",'import type {ButtonHTMLAttributes,FC} from "react";export declare const Button:FC<ButtonHTMLAttributes<HTMLButtonElement>&{variant?:string}>;');
put(work+"/components/Select.tsx",'import type {FC,ReactNode,HTMLAttributes} from "react";export declare const Select:FC<{children:ReactNode;value:string;onValueChange:(value:string)=>void;disabled?:boolean}>;export declare const SelectItem:FC<{children:ReactNode;value:string}>;export declare const SelectTrigger:FC<HTMLAttributes<HTMLButtonElement>>;export declare const SelectContent:FC<{children:ReactNode}>;export declare const SelectValue:FC<{placeholder?:string}>;');
put(work+"/components/ProtectedRoute.tsx",'import type {FC,ReactNode} from "react";export declare const ProtectedRoute:FC<{children:ReactNode}>;');
put(work+"/endpoints/employee_home_GET.schema.ts",'export type OutputType={employee:{id:string;displayName:string;orgName:string};shifts:{id:string;startsAt:Date;endsAt:Date;title:string;status:string;siteName:string;address:string|null}[];entries:{id:string;action:string;occurredAt:Date;source:string;siteName:string|null}[]};');
put(work+"/endpoints/shifts_POST.schema.ts",'import {z} from "zod";export const schema=z.object({siteId:z.string().uuid(),employeeId:z.string().uuid().nullable(),title:z.string(),startsAt:z.date(),endsAt:z.date(),requiredQualification:z.string().nullable(),notes:z.string().nullable()});export type OutputType={id:string};');
put(root+".verification/globals.d.ts",'declare module "*.module.css" {const value:Record<string,string>;export default value;}');
put(root+".verification/tsconfig.json",JSON.stringify({compilerOptions:{target:"ES2022",module:"ESNext",moduleResolution:"Bundler",jsx:"react-jsx",strict:true,noEmit:true,skipLibCheck:true,esModuleInterop:true,types:["node","react"],lib:["ES2022","DOM"]},include:["work/**/*","globals.d.ts"]},null,2));
const result=spawnSync(process.execPath,[root+"node_modules/typescript/bin/tsc","--project",root+".verification/tsconfig.json"],{cwd:root,stdio:"inherit"});
process.exit(result.status??1);
