(async()=>{
  const mode=window.AONE_AUTH_MODE||'employee';
  const existing=await AONE.session();
  if(existing?.user?.app_metadata?.must_change_password){ sessionStorage.setItem('aone_after_password',mode==='admin'?'./admin-login.html':'./login.html'); location.replace('./change-password.html'); return; }
  if(existing){
    const ctx=await AONE.chooseContext().catch(()=>null);
    if(ctx){
      if(mode==='admin' && AONE.isManager(ctx.role)) location.replace('./admin.html');
      if(mode==='employee') location.replace('./app.html');
    }
  }
  const form=AONE.qs('#login-form'), err=AONE.qs('#login-error');
  form.addEventListener('submit',async e=>{
    e.preventDefault();err.textContent='';AONE.loading(true,'Anmeldung wird geprüft…');
    try{
      const f=new FormData(form);const signed=await AONE.signIn(String(f.get('email')),String(f.get('password')));
      if(signed?.user?.app_metadata?.must_change_password){sessionStorage.setItem('aone_after_password',mode==='admin'?'./admin-login.html':'./login.html');location.replace('./change-password.html');return;}
      const ctx=await AONE.chooseContext();
      if(!ctx) throw new Error('Für diesen Zugang ist noch keine Firma eingerichtet.');
      if(mode==='admin'&&!AONE.isManager(ctx.role)){AONE.signOut();throw new Error('Dieser Zugang ist kein Management-Zugang.');}
      location.replace(mode==='admin'?'./admin.html':'./app.html');
    }catch(ex){err.textContent=ex.message||'Anmeldung fehlgeschlagen';AONE.loading(false);}
  });
  AONE.qs('#forgot').addEventListener('click',async()=>{
    const email=form.email.value.trim(); if(!email) return AONE.toast('Bitte zuerst die E-Mail-Adresse eintragen.','warn');
    try{await AONE.recover(email);AONE.toast('E-Mail zum Zurücksetzen wurde angefordert.')}catch(e){AONE.toast(e.message,'err')}
  });
})();
