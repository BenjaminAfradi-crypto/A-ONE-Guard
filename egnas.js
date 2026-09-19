(async()=>{
  const form=AONE.qs('#egnas-form'), err=AONE.qs('#egnas-error');
  async function finishJoin(user,name,code){
    let ctx=await AONE.chooseContext().catch(()=>null);
    if(!ctx){
      await AONE.rpc('guard_join_organization',{p_code:code,p_display_name:name});
      ctx=await AONE.chooseContext();
    }
    localStorage.removeItem('aone_guard_pending_pilot');
    if(!ctx || !AONE.isManager(ctx.role)) throw new Error('Der Premium-Zugang konnte nicht als Management-Zugang aktiviert werden.');
    location.replace('./admin.html');
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault(); err.textContent=''; AONE.loading(true,'EGNAS Premium-Zugang wird aktiviert…');
    try{
      const f=new FormData(form);
      const name=String(f.get('name')||'').trim();
      const email=String(f.get('email')||'').trim();
      const password=String(f.get('password')||'');
      const code=String(f.get('code')||'').trim().toUpperCase();
      const pending={name,email,code,created_at:Date.now()};
      localStorage.setItem('aone_guard_pending_pilot',JSON.stringify(pending));
      const r=await AONE.signUp(email,password,name);
      if(!r.access_token){
        AONE.loading(false);
        form.innerHTML=`<div class="notice"><b>E-Mail bestätigen</b><br>Wir haben eine Bestätigungs-E-Mail an ${AONE.esc(email)} gesendet. Danach über den Management-Login anmelden. Der EGNAS Premium Pilot wird automatisch verbunden.</div><a class="btn primary block" style="margin-top:14px" href="./admin-login.html">Zum Management-Login</a>`;
        return;
      }
      const s={access_token:r.access_token,refresh_token:r.refresh_token,expires_at:Date.now()+((r.expires_in||3600)-30)*1000,user:r.user};
      localStorage.setItem('aone_guard_session_v1',JSON.stringify(s));
      await finishJoin(r.user,name,code);
    }catch(ex){
      const msg=String(ex?.message||'Aktivierung fehlgeschlagen');
      if(/already registered|already been registered|user already exists/i.test(msg)){
        err.innerHTML='Diese E-Mail ist bereits registriert. <a href="./admin-login.html">Zum Management-Login</a> – der Pilot-Code bleibt für den Login vorgemerkt.';
      }else err.textContent=msg;
      AONE.loading(false);
    }
  });
})();
