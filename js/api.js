function api(action, payload){ payload=payload||{}; payload.action=action;
  return fetch(WEBAPP_URL,{method:'POST',body:new URLSearchParams({data:JSON.stringify(payload)})}).then(function(r){return r.json();}); }
function currentUser(){ try{return JSON.parse(localStorage.getItem('currentUser')||'{}');}catch(e){return {};}}
function requireUser(){ var u=currentUser(); if(!u.id){ window.location.href='../index.html'; } return u; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function fmt(v){ return v==null?'':String(v); }
function setMsg(id,text,cls){ var el=document.getElementById(id); if(!el) return; el.className='alert '+(cls||''); el.textContent=text||''; el.style.display=text?'block':'none'; }
function byId(id){ return document.getElementById(id); }
