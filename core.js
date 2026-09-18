const AONE = (() => {
  const SUPABASE_URL = 'https://rwojydgekobbckpcvlnu.supabase.co';
  const API_KEY = 'sb_publishable_fCfxNJgvjLHsz1xr7_4Lhw_DxrNt8jd';
  const STRIPE_URL = 'https://buy.stripe.com/test_00wdRa7YHbt4f6f04R0sU07';
  const SESSION_KEY = 'aone_guard_session_v1';
  const CONTEXT_KEY = 'aone_guard_context_v1';

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function qs(s, r=document){ return r.querySelector(s); }
  function qsa(s, r=document){ return [...r.querySelectorAll(s)]; }
  function esc(v=''){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function money(cents){ return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format((Number(cents)||0)/100); }
  function dt(v){ if(!v) return '—'; return new Intl.DateTimeFormat('de-DE',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)); }
  function d(v){ if(!v) return '—'; return new Intl.DateTimeFormat('de-DE',{dateStyle:'medium'}).format(new Date(v)); }
  function t(v){ if(!v) return '—'; return new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(new Date(v)); }
  function duration(a,b){ if(!a) return 0; const e=b?new Date(b):new Date(); return Math.max(0,(e-new Date(a))/3600000); }
  function monthKey(date=new Date()){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-01`; }
  function prevMonthKey(){ const x=new Date(); x.setDate(1); x.setMonth(x.getMonth()-1); return monthKey(x); }

  function toast(message, kind='ok'){
    let box=qs('#toast');
    if(!box){ box=document.createElement('div'); box.id='toast'; document.body.appendChild(box); }
    box.className=`toast show ${kind}`; box.textContent=message;
    clearTimeout(box._timer); box._timer=setTimeout(()=>box.classList.remove('show'),3500);
  }
  function loading(on=true, label='Laden…'){
    let el=qs('#global-loading');
    if(!el){ el=document.createElement('div'); el.id='global-loading'; el.innerHTML='<div class="spinner"></div><span></span>'; document.body.appendChild(el); }
    el.querySelector('span').textContent=label; el.classList.toggle('show',on);
  }

  function getSession(){ try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null} }
  function setSession(s){ if(s) localStorage.setItem(SESSION_KEY,JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); }
  function setContext(c){ if(c) localStorage.setItem(CONTEXT_KEY,JSON.stringify(c)); else localStorage.removeItem(CONTEXT_KEY); }
  function getContextCached(){ try{return JSON.parse(localStorage.getItem(CONTEXT_KEY)||'null')}catch{return null} }

  async function authFetch(path, body){
    const r=await fetch(`${SUPABASE_URL}/auth/v1/${path}`,{
      method:'POST',headers:{'apikey':API_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.msg||data.message||data.error_description||data.error||'Anmeldung fehlgeschlagen');
    return data;
  }
  async function signIn(email,password){
    const data=await authFetch('token?grant_type=password',{email,password});
    const s={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+((data.expires_in||3600)-30)*1000,user:data.user};
    setSession(s); return s;
  }
  async function refreshSession(){
    const s=getSession(); if(!s?.refresh_token) return null;
    const data=await authFetch('token?grant_type=refresh_token',{refresh_token:s.refresh_token});
    const next={access_token:data.access_token,refresh_token:data.refresh_token||s.refresh_token,expires_at:Date.now()+((data.expires_in||3600)-30)*1000,user:data.user||s.user};
    setSession(next); return next;
  }
  async function session(){
    let s=getSession(); if(!s) return null;
    if(!s.expires_at || Date.now()>s.expires_at) s=await refreshSession().catch(()=>null);
    return s;
  }
  async function signUp(email,password,displayName){
    return authFetch('signup',{email,password,data:{display_name:displayName,full_name:displayName,aone_guard:true}});
  }
  async function recover(email){ return authFetch('recover',{email}); }
  async function updatePassword(password){
    const s=await session(); if(!s) throw new Error('Nicht angemeldet');
    const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{method:'PUT',headers:{apikey:API_KEY,Authorization:`Bearer ${s.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({password})});
    const data=await r.json().catch(()=>({})); if(!r.ok) throw new Error(data.message||'Passwort konnte nicht geändert werden'); return data;
  }
  function signOut(){ setSession(null); setContext(null); localStorage.removeItem('aone_guard_org'); }

  async function request(path,{method='GET',body=null,headers={},retry=true}={}){
    let s=await session(); if(!s) throw new Error('SESSION_REQUIRED');
    const h={apikey:API_KEY,Authorization:`Bearer ${s.access_token}`,...headers};
    if(body!==null) h['Content-Type']='application/json';
    let r=await fetch(`${SUPABASE_URL}${path}`,{method,headers:h,body:body===null?undefined:JSON.stringify(body)});
    if(r.status===401 && retry){ s=await refreshSession(); if(!s) throw new Error('SESSION_REQUIRED'); return request(path,{method,body,headers,retry:false}); }
    let data=null; const ct=r.headers.get('content-type')||'';
    if(r.status!==204) data=ct.includes('json')?await r.json().catch(()=>null):await r.text().catch(()=>null);
    if(!r.ok){ const msg=data?.message||data?.error_description||data?.hint||data?.details||data?.error||String(data||`HTTP ${r.status}`); throw new Error(msg); }
    return data;
  }
  async function table(name, query='select=*'){ return request(`/rest/v1/${name}?${query}`); }
  async function insert(name, row, returning=true){ return request(`/rest/v1/${name}`,{method:'POST',body:row,headers:{Prefer:returning?'return=representation':'return=minimal'}}); }
  async function update(name, query, row){ return request(`/rest/v1/${name}?${query}`,{method:'PATCH',body:row,headers:{Prefer:'return=representation'}}); }
  async function remove(name, query){ return request(`/rest/v1/${name}?${query}`,{method:'DELETE',headers:{Prefer:'return=minimal'}}); }
  async function storageUpload(bucket,path,file){
    const s=await session(); if(!s) throw new Error('SESSION_REQUIRED');
    const safePath=String(path).split('/').map(encodeURIComponent).join('/');
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${safePath}`,{method:'POST',headers:{apikey:API_KEY,Authorization:`Bearer ${s.access_token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
    const data=await r.json().catch(()=>({})); if(!r.ok) throw new Error(data.message||data.error||'Datei konnte nicht hochgeladen werden'); return data;
  }
  async function storageBlob(bucket,path){
    const s=await session(); if(!s) throw new Error('SESSION_REQUIRED');
    const safePath=String(path).split('/').map(encodeURIComponent).join('/');
    const r=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${safePath}`,{headers:{apikey:API_KEY,Authorization:`Bearer ${s.access_token}`}});
    if(!r.ok){const x=await r.text().catch(()=>null);throw new Error(x||'Datei konnte nicht geladen werden')} return r.blob();
  }
  async function openStorage(bucket,path,filename){ const blob=await storageBlob(bucket,path); const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.target='_blank'; a.rel='noopener'; if(filename) a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(u),60000); }
  async function rpc(name,args={}){ return request(`/rest/v1/rpc/${name}`,{method:'POST',body:args}); }
  async function edge(name,body,asText=false){
    const s=await session(); if(!s) throw new Error('SESSION_REQUIRED');
    const r=await fetch(`${SUPABASE_URL}/functions/v1/${name}`,{method:'POST',headers:{apikey:API_KEY,Authorization:`Bearer ${s.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok){ const x=await r.text(); try{const j=JSON.parse(x);throw new Error(j.error||x)}catch(e){if(e instanceof SyntaxError) throw new Error(x||`HTTP ${r.status}`); throw e;} }
    return asText?await r.text():await r.json();
  }

  async function memberships(){
    const s=await session(); if(!s) return [];
    const rows=await table('guard_memberships',`select=org_id,role,user_id&user_id=eq.${encodeURIComponent(s.user.id)}`);
    const orgs=await table('guard_organizations','select=id,name,slug,plan_code,subscription_status,trial_ends_at&order=name.asc');
    return rows.map(m=>({...m,org:orgs.find(o=>o.id===m.org_id)})).filter(x=>x.org);
  }
  async function chooseContext(preferOrg){
    const ms=await memberships(); if(!ms.length) return null;
    const stored=preferOrg||localStorage.getItem('aone_guard_org');
    const m=ms.find(x=>x.org_id===stored)||ms[0];
    localStorage.setItem('aone_guard_org',m.org_id);
    setContext(m); return m;
  }
  function isManager(role){ return ['owner','admin','dispatcher'].includes(role); }
  function roleLabel(role){ return ({owner:'Inhaber',admin:'Geschäftsführung / Admin',dispatcher:'Schichtleitung',employee:'Mitarbeiter'})[role]||role; }

  async function geolocate(){
    if(!navigator.geolocation) throw new Error('Standort wird von diesem Gerät nicht unterstützt.');
    return new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(
      p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:Math.round(p.coords.accuracy||0)}),
      e=>reject(new Error(e.message||'Standort konnte nicht ermittelt werden.')),
      {enableHighAccuracy:true,timeout:12000,maximumAge:30000}
    ));
  }

  function printNode(node,title='A ONE Guard'){
    const w=window.open('','_blank','noopener,noreferrer');
    if(!w) return toast('Pop-up für Drucken wurde blockiert.','err');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:14px/1.45 Arial,sans-serif;color:#111;padding:24px}h1,h2,h3{margin:0 0 12px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #aaa;padding:7px;text-align:left}small{color:#555}.no-print{display:none!important}@page{size:A4;margin:14mm}</style></head><body>${node.innerHTML}</body></html>`);
    w.document.close(); setTimeout(()=>w.print(),250);
  }

  return {SUPABASE_URL,API_KEY,STRIPE_URL,qs,qsa,esc,money,dt,d,t,duration,monthKey,prevMonthKey,toast,loading,getSession,session,signIn,signUp,recover,updatePassword,signOut,request,table,insert,update,remove,storageUpload,storageBlob,openStorage,rpc,edge,memberships,chooseContext,isManager,roleLabel,geolocate,printNode,sleep};
})();
