export function selectedOrganization(request:Request){
  const header=request.headers.get("X-Guard-Org-Id");
  if(header)return header;
  const cookie=request.headers.get("Cookie")??"";
  const match=cookie.match(/(?:^|;\s*)guard_org=([a-f0-9-]{36})(?:;|$)/i);
  return match?.[1]??null;
}
