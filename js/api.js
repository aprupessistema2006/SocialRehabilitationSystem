function api(action, payload){ payload=payload||{}; payload.action=action;
  if (!isAccessRemembered()) { window.location.href = '../index.html'; return Promise.reject({ok:false, reason:'nav_kopējā_parole'}); }
  return fetch(WEBAPP_URL,{method:'POST',body:new URLSearchParams({data:JSON.stringify(payload)})}).then(function(r){return r.json();}); }
function currentUser(){ try{return JSON.parse(localStorage.getItem('currentUser')||'{}');}catch(e){return {};} }
function requireUser(){ var u=currentUser(); if(!u.id){ window.location.href='../index.html'; return u; } if(!isAccessRemembered()){ window.location.href='../index.html'; return u; } return u; }
function isAccessRemembered(){ try{ var t=localStorage.getItem(ACCESS_REMEMBER_KEY); if(!t) return false; return (Date.now()-Number(t))<ACCESS_REMEMBER_MS; }catch(e){return false;} }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function fmt(v){ return v==null?'':String(v); }
function setMsg(id,text,cls){ var el=document.getElementById(id); if(!el) return; el.className='alert '+(cls||''); el.textContent=text||''; el.style.display=text?'block':'none'; }
function byId(id){ return document.getElementById(id); }
