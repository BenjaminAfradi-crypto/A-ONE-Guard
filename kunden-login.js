(()=>{
  const $=s=>document.querySelector(s);
  async function validatePortal(){
    const from=new Date();from.setDate(from.getDate()-30);
    const to=new Date();to.setDate(to.getDate()+30);
    return AONE.rpc('guard_customer_portal_snapshot',{p_customer:null,p_from:from.toISOString().slice(0,10),p_to:to.toISOString().slice(0,10)});
  }
  async function boot(){const s=await AONE.session().catch(()=>null);if(!s)return;try{await validatePortal();location.replace('./kundenportal.html')}catch{}}
  $('#customer-login-form').onsubmit=async e=>{
    e.preventDefault();$('#login-error').textContent='';
    const email=$('#email').value.trim(),password=$('#password').value;
    try{AONE.loading(true,'Anmelden…');await AONE.signIn(email,password);await validatePortal();location.replace('./kundenportal.html')}
    catch(err){AONE.signOut();$('#login-error').textContent=err.message==='customer portal access not found'?'Für diesen Account ist kein aktiver Kundenportal-Zugang hinterlegt.':err.message}
    finally{AONE.loading(false)}
  };
  boot();
})();