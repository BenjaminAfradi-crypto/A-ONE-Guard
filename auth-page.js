(()=>{
  const mode=document.body.dataset.authMode;
  window.AONE_AUTH_MODE=mode==='admin'?'admin':'employee';
  if(new URLSearchParams(location.search).has('changed')){
    const notice=document.getElementById('login-info');
    if(notice){
      notice.style.display='block';
      notice.textContent='Passwort geändert. Bitte erneut anmelden.';
    }
  }
})();
