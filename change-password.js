(async()=>{
  const s=await AONE.session();
  if(!s){location.replace('./login.html');return}
  const form=AONE.qs('#password-form'),err=AONE.qs('#password-error');
  form.addEventListener('submit',async e=>{
    e.preventDefault();err.textContent='';const f=new FormData(form),p=String(f.get('password')||''),c=String(f.get('confirm')||'');
    if(p!==c){err.textContent='Die Passwörter stimmen nicht überein.';return}
    if(p.length<12){err.textContent='Das Passwort muss mindestens 12 Zeichen lang sein.';return}
    AONE.loading(true,'Passwort wird geändert…');
    try{await AONE.edge('guard-change-password',{new_password:p});const ret=new URLSearchParams(location.search).get('return');const next=sessionStorage.getItem('aone_after_password')||(ret==='admin'?'./admin-login.html':'./login.html');sessionStorage.removeItem('aone_after_password');AONE.signOut();location.replace(next+'?changed=1')}
    catch(ex){err.textContent=ex.message||'Passwort konnte nicht geändert werden';AONE.loading(false)}
  });
})();
