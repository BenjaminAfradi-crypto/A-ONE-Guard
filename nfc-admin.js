(async()=>{
  const $=s=>document.querySelector(s);let ctx=null,currentUrl='';
  const msg=(text,kind='')=>{$('#msg').innerHTML=text?`<div class="${kind==='err'?'error':'notice'}" style="margin-top:12px">${AONE.esc(text)}</div>`:''};
  const session=await AONE.session().catch(()=>null);if(!session){location.replace('./admin-login.html');return}
  ctx=await AONE.chooseContext().catch(()=>null);if(!ctx||!AONE.isManager(ctx.role)){location.replace('./admin-login.html');return}
  try{
    const sites=await AONE.table('guard_sites',`select=id,name,customer_name&org_id=eq.${encodeURIComponent(ctx.org_id)}&active=eq.true&order=name.asc`);
    $('#site').innerHTML='<option value="">Objekt wählen…</option>'+(sites||[]).map(s=>`<option value="${s.id}">${AONE.esc(s.name)}${s.customer_name?` · ${AONE.esc(s.customer_name)}`:''}</option>`).join('');
  }catch(e){msg(e.message,'err')}

  $('#tag-form').addEventListener('submit',async e=>{
    e.preventDefault();msg('');const site=$('#site').value;if(!site)return msg('Bitte ein Objekt auswählen.','err');
    AONE.loading(true,'NFC-Tag wird erstellt…');
    try{
      const res=await AONE.rpc('guard_create_site_nfc_tag',{p_site:site,p_label:$('#label').value.trim()||null});
      const token=res?.token||String(res?.payload||'').replace(/^AONE-CLOCK:/,'');
      if(!token)throw new Error('Token konnte nicht erstellt werden.');
      currentUrl=new URL(`./nfc.html?t=${encodeURIComponent(token)}`,location.href).href;
      $('#url').textContent=currentUrl;$('#result').classList.add('show');
      $('#support').innerHTML=('NDEFReader' in window)?'<span class="status-ok">Dieses Gerät kann den Link direkt aus dem Browser auf einen NFC-Tag schreiben.</span>':'<span class="status-warn">Dieses Gerät unterstützt Web-NFC-Schreiben nicht. Auf iPhone den Link kopieren und z. B. mit einer NFC-Writer-App einmalig als URL auf den Tag schreiben.</span>';
      msg('NFC-Tag wurde im System angelegt.');
    }catch(err){msg(err.message||'NFC-Tag konnte nicht erstellt werden.','err')}finally{AONE.loading(false)}
  });

  $('#copy').onclick=async()=>{if(!currentUrl)return;try{await navigator.clipboard.writeText(currentUrl);AONE.toast('NFC-Link kopiert.')}catch{prompt('NFC-Link kopieren:',currentUrl)}};
  $('#write').onclick=async()=>{
    if(!currentUrl)return;
    if(!('NDEFReader' in window)){AONE.toast('Web-NFC-Schreiben wird auf diesem Gerät nicht unterstützt. Link kopieren und als URL auf den Tag schreiben.','warn');return}
    try{
      const writer=new NDEFReader();
      await writer.write({records:[{recordType:'url',data:currentUrl}]});
      AONE.toast('NFC-Tag erfolgreich beschrieben.');
    }catch(e){AONE.toast(e.message||'NFC-Tag konnte nicht beschrieben werden.','err')}
  };
})();