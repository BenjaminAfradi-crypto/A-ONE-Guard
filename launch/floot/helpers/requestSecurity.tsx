export function requireSameOrigin(request:Request){
  const origin=request.headers.get("Origin");
  const site=request.headers.get("Sec-Fetch-Site");
  if(site==="cross-site")throw new Error("Anfrage von fremder Website abgelehnt.");
  if(origin&&origin!==new URL(request.url).origin)throw new Error("Anfrage von fremder Website abgelehnt.");
  if(!request.headers.get("Content-Type")?.toLowerCase().includes("application/json"))throw new Error("JSON-Anfrage erforderlich.");
}
