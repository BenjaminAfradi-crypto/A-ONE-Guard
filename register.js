(async()=>{
 const form=AONE.qs('#reg-form'),err=AONE.qs('#reg-error');
 form.onsubmit=async e=>{e.preventDefault();err.textContent='';const f=new FormData(form);AONE.loading(true,'Firmenkonto wird angelegt…');try{
   const email=String(f.get('email')).trim(), password=String(f.get('password')), name=String(f.get('name')).trim(), company=String(f.get('company')).trim();
   const r=await AONE.signUp(email,password,name);
   if(!r.access_token){AONE.loading(false);form.innerHTML=`<div class="notice"><b>E-Mail bestätigen</b><br>Supabase hat eine Bestätigungs-E-Mail an ${AONE.esc(email)} gesendet. Nach der Bestätigung hier anmelden und die Firma anlegen.</div><a class="btn primary block" style="margin-top:14px" href="./admin-login.html">Zum Management-Login</a>`;return}
   const s={access_token:r.access_token,refresh_token:r.refresh_token,expires_at:Date.now()+((r.expires_in||3600)-30)*1000,user:r.user};
   localStorage.setItem('aone_guard_session_v1',JSON.stringify(s));
   await AONE.rpc('guard_create_organization',{p_name:company}); await AONE.chooseContext();
   location.replace('./admin.html');
 }catch(ex){err.textContent=ex.message||'Registrierung fehlgeschlagen';AONE.loading(false)}};
})();
