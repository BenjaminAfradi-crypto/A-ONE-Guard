(async()=>{
  const qs=s=>document.querySelector(s), state=qs('#state'), headline=qs('#headline'), detail=qs('#detail'), subtitle=qs('#subtitle'), login=qs('#login-btn'), retry=qs('#retry-btn');
  const setState=(title,text,kind='')=>{headline.textContent=title;detail.textContent=text;state.className='nfc-state'+(kind?' '+kind:'')};
  const read=(storage,key)=>{try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}};
  const queryToken=(new URLSearchParams(location.search).get('t')||'').trim();
  const pending=read(localStorage,'aone_nfc_pending');
  const last=read(sessionStorage,'aone_nfc_last');
  const navigation=performance.getEntriesByType('navigation')[0]?.type;
  const validPending=pending?.token&&Date.now()-pending.created_at<10*60*1000;
  const replay=['reload','back_forward'].includes(navigation)&&last?.token&&(!queryToken||last.token===queryToken);
  let request=replay?last:validPending&&(!queryToken||pending.token===queryToken)?pending:null;
  if(!request&&queryToken)request={token:queryToken,request_id:crypto.randomUUID(),created_at:Date.now()};
  if(!request){localStorage.removeItem('aone_nfc_pending');subtitle.textContent='Kein gültiger NFC-Link';setState('Tag erneut scannen','Der NFC-Link fehlt oder die Anmeldung hat zu lange gedauert.','err');return}
  request.request_id ||= crypto.randomUUID();
  // Persist BEFORE sending. If storage fails, do not risk an unrepeatable booking.
  try{localStorage.setItem('aone_nfc_pending',JSON.stringify(request));sessionStorage.setItem('aone_nfc_last',JSON.stringify(request))}
  catch{setState('Speicher nicht verfügbar','Bitte den Browserspeicher aktivieren und erneut scannen.','err');return}
  const session=await AONE.session().catch(()=>null);
  if(!session){subtitle.textContent='Anmeldung erforderlich';setState('Bitte anmelden','Nach der Anmeldung wird die Zeiterfassung automatisch fortgesetzt.');login.style.display='inline-flex';setTimeout(()=>location.replace('./login.html'),900);return}
  if(session.user?.app_metadata?.must_change_password){sessionStorage.setItem('aone_after_password','./nfc.html');location.replace('./change-password.html');return}
  if(request.user_id&&request.user_id!==session.user.id){localStorage.removeItem('aone_nfc_pending');sessionStorage.removeItem('aone_nfc_last');setState('Bitte erneut scannen','Der vorherige Vorgang gehört zu einem anderen Zugang.','err');return}
  request.user_id=session.user.id;
  try{localStorage.setItem('aone_nfc_pending',JSON.stringify(request));sessionStorage.setItem('aone_nfc_last',JSON.stringify(request))}catch{setState('Speicher nicht verfügbar','Es wurde keine Buchung angefordert.','err');return}
  let busy=false;
  async function book(){
    if(busy)return;busy=true;retry.hidden=true;
    try{
      subtitle.textContent='NFC-Tag erkannt';setState('Zeiterfassung läuft…','Bitte einen Moment warten.');
      const result=await AONE.rpc('guard_clock_nfc_once',{p_token:request.token,p_request_id:request.request_id,p_shift:null});
      let siteName='Objekt';
      try{const rows=await AONE.table('guard_sites',`select=id,name&id=eq.${encodeURIComponent(result.site_id)}&limit=1`);if(rows?.[0]?.name)siteName=rows[0].name}catch{}
      localStorage.removeItem('aone_nfc_pending');
      const isIn=result.action==='in';subtitle.textContent=siteName;
      setState(isIn?'Eingestempelt':'Ausgestempelt',`${siteName} · Buchung bestätigt. Zum nächsten Stempeln den Tag erneut scannen.`,'ok');
      if(navigator.vibrate)navigator.vibrate(isIn?[80,50,80]:[150]);
    }catch(e){
      const raw=String(e?.message||e||'NFC-Zeiterfassung fehlgeschlagen');
      const map={'NFC tag invalid or inactive':'Dieser NFC-Tag ist ungültig oder wurde deaktiviert.','employee not found':'Dieser Zugang ist keinem Mitarbeiterprofil zugeordnet.','employee inactive':'Das Mitarbeiterprofil ist deaktiviert.','already clocked in at another site':'Du bist bereits an einem anderen Objekt eingestempelt.','shift mismatch':'Die Schicht passt nicht zu diesem Objekt.'};
      subtitle.textContent='Bestätigung fehlt';setState('Buchung prüfen',`${map[raw]||raw} Erneut prüfen verwendet denselben Vorgang und erzeugt keine doppelte Buchung.`,'err');retry.hidden=false;
    }finally{busy=false}
  }
  retry.addEventListener('click',book);await book();
})();
