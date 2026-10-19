(async()=>{
  const mode=window.AONE_AUTH_MODE||'employee';
  const employeeTarget=()=>{
    try{const p=JSON.parse(localStorage.getItem('aone_nfc_pending')||'null');if(p?.token&&Date.now()-p.created_at<10*60*1000)return './nfc.html';localStorage.removeItem('aone_nfc_pending')}catch{}
    return './app.html';
  };
  async function tryPendingPilot(user){
    try{
      const pending=JSON.parse(localStorage.getItem('aone_guard_pending_pilot')||'null');
      if(!pending?.code||!pending?.name) return null;
      if(pending?.email && pending.email.toLowerCase()!==String(user?.email||'').toLowerCase()) return null;
      let ctx=await AONE.chooseContext().catch(()=>null);
      if(ctx){ localStorage.removeItem('aone_guard_pending_pilot'); return ctx; }
      await AONE.rpc('guard_join_organization',{p_code:String(pending.code).trim().toUpperCase(),p_display_name:String(pending.name).trim()});
      localStorage.removeItem('aone_guard_pending_pilot');
      return await AONE.chooseContext();
    }catch{return null}
  }
  async function tryPendingCompany(user){
    // Company name from signup is profile data only; no authorization trusts it.
    // guard_create_organization remains responsible for authenticated ownership.
    const saved=JSON.parse(localStorage.getItem('aone_guard_pending_company')||'null');
    const localName=saved?.email?.toLowerCase()===String(user?.email||'').toLowerCase()?saved.company:null;
    const metadataName=user?.user_metadata?.aone_pending_company;
    const company=String(localName||metadataName||'').trim().slice(0,160);
    if(!company)return null;
    await AONE.rpc('guard_create_organization',{p_name:company});
    localStorage.removeItem('aone_guard_pending_company');
    return AONE.chooseContext();
  }
  const existing=await AONE.session();
  if(existing?.user?.app_metadata?.must_change_password){ sessionStorage.setItem('aone_after_password',mode==='admin'?'./admin-login.html':employeeTarget()); location.replace('./change-password.html'); return; }
  if(existing){
    let ctx=await AONE.chooseContext().catch(()=>null);
    if(!ctx) ctx=await tryPendingPilot(existing.user);
    if(!ctx && mode==='admin') ctx=await tryPendingCompany(existing.user).catch(()=>null);
    if(ctx){
      if(mode==='admin' && AONE.isManager(ctx.role)) location.replace('./admin.html');
      if(mode==='employee') location.replace(employeeTarget());
    }
  }
  const form=AONE.qs('#login-form'), err=AONE.qs('#login-error');
  form.addEventListener('submit',async e=>{
    e.preventDefault();err.textContent='';AONE.loading(true,'Anmeldung wird geprüft…');
    try{
      const f=new FormData(form);const signed=await AONE.signIn(String(f.get('email')),String(f.get('password')));
      if(signed?.user?.app_metadata?.must_change_password){sessionStorage.setItem('aone_after_password',mode==='admin'?'./admin-login.html':employeeTarget());location.replace('./change-password.html');return;}
      let ctx=await AONE.chooseContext();
      if(!ctx) ctx=await tryPendingPilot(signed.user);
      if(!ctx && mode==='admin') ctx=await tryPendingCompany(signed.user);
      if(!ctx) throw new Error('Für diesen Zugang ist noch keine Firma eingerichtet.');
      if(mode==='admin'&&!AONE.isManager(ctx.role)){AONE.signOut();throw new Error('Dieser Zugang ist kein Management-Zugang.');}
      location.replace(mode==='admin'?'./admin.html':employeeTarget());
    }catch(ex){err.textContent=ex.message||'Anmeldung fehlgeschlagen';AONE.loading(false);}
  });
  AONE.qs('#forgot').addEventListener('click',async()=>{
    const email=form.email.value.trim(); if(!email) return AONE.toast('Bitte zuerst die E-Mail-Adresse eintragen.','warn');
    try{await AONE.recover(email,mode);AONE.toast('E-Mail zum Zurücksetzen wurde angefordert.')}catch(e){AONE.toast(e.message,'err')}
  });
})();