import superjson from "superjson";
export type OutputType={employees:{id:string;displayName:string;email:string|null;linked:boolean}[]};
export async function getInviteCandidates():Promise<OutputType>{
  const response=await fetch("/_api/invite_candidates");
  const text=await response.text();
  if(!response.ok)throw new Error(superjson.parse<{error:string}>(text).error);
  return superjson.parse<OutputType>(text);
}
