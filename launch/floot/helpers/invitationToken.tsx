import {createHash,randomBytes} from "crypto";
export const newInvitationToken=()=>randomBytes(32).toString("hex");
export const invitationHash=(token:string)=>createHash("sha256").update(token).digest("hex");
export const validInvitationToken=(token:string)=>/^[a-f0-9]{64}$/.test(token);
