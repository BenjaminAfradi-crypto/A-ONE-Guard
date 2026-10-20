(()=>{
  const params=new URLSearchParams(location.search);
  const token=params.get('token')||'';
  const form=document.getElementById('pwForm');
  const submit=document.getElementById('submit');
  document.getElementById('token').value=token;
  // Do not retain the one-time setup credential in the browser history.
  if(params.has('token')){
    const sanitized=new URL(location.href);
    sanitized.searchParams.delete('token');
    try{history.replaceState(history.state,'',sanitized.pathname+sanitized.search+sanitized.hash)}catch{}
  }
  if(!token){
    document.getElementById('err').style.display='block';
    submit.disabled=true;
  }
  form.addEventListener('submit',()=>{
    // An iframe submit does not verify whether the remote function accepted the password.
    const notice=document.getElementById('ok');
    notice.textContent='Anfrage abgeschickt. Prüfe im Developer-Login, ob das Passwort angenommen wurde.';
    notice.style.display='block';
  });
})();
