(async()=>{
  const qs=s=>document.querySelector(s), state=qs('#state'), headline=qs('#headline'), detail=qs('#detail'), subtitle=qs('#subtitle'), login=qs('#login-btn');
  const setState=(title,text,kind='')=>{headline.textContent=title;detail.textContent=text;state.className='nfc-state'+(kind?' '+kind:'')};
  const params=new URLSearchParams(location.search);
  const queryToken=(params.get('t')||'').trim();
  if(queryToken) localStorage.setItem('aone_nfc_pending',JSON.stringify({token:queryToken,created_at:Date.now()}));
  let pending=null;try{pending=JSON.parse(localStorage.getItem('aone_nfc_pending')||'null')}catch{}
  const token=queryToken||pending?.token||'';
  if(!token){subtitle.textContent='Kein gültiger NFC-Link';setState('Tag nicht erkannt','Auf diesem NFC-Tag fehlt der A ONE Guard Zeiterfassungs-Link.','err');return}
  const session=await AONE.session().catch(()=>null);
  if(!session){
    subtitle.textContent='Anmeldung erforderlich';setState('Bitte anmelden','Nach der Anmeldung wird die Zeiterfassung automatisch fortgesetzt.');login.style.display='inline-flex';
    setTimeout(()=>location.replace('./login.html'),900);return;
  }
  try{
    subtitle.textContent='NFC-Tag erkannt';setState('Zeiterfassung läuft…','Bitte einen Moment warten.');
    const result=await AONE.rpc('guard_clock_nfc_auto',{p_token:token,p_shift:null});
    let siteName='Objekt';
    try{const rows=await AONE.table('guard_sites',`select=id,name&id=eq.${encodeURIComponent(result.site_id)}&limit=1`);if(rows?.[0]?.name)siteName=rows[0].name}catch{}
    localStorage.removeItem('aone_nfc_pending');
    const isIn=result.action==='in';subtitle.textContent=siteName;
    setState(isIn?'Eingestempelt':'Ausgestempelt',`${siteName} · ${new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())}`,'ok');
    if(navigator.vibrate)navigator.vibrate(isIn?[80,50,80]:[150]);
  }catch(e){
    const raw=String(e?.message||e||'NFC-Zeiterfassung fehlgeschlagen');
    const map={
      'NFC tag invalid or inactive':'Dieser NFC-Tag ist ungültig oder wurde deaktiviert.',
      'employee not found':'Dieser Benutzer ist noch keinem Mitarbeiterprofil zugeordnet.',
      'employee inactive':'Das Mitarbeiterprofil ist deaktiviert.',
      'already clocked in at another site':'Du bist bereits an einem anderen Objekt eingestempelt.',
      'shift mismatch':'Die gefundene Schicht passt nicht zu diesem Objekt.'
    };
    subtitle.textContent='Zeiterfassung nicht möglich';setState('Nicht gebucht',map[raw]||raw,'err');
  }
})();