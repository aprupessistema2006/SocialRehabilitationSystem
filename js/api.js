function api(action, payload){ payload=payload||{}; payload.action=action;
  var token = getToken();
  if (!token) { window.location.href = '../index.html'; return Promise.reject({ok:false, reason:'nav_token'}); }
  payload.access_token = token;
  if (typeof window.showLoader === 'function') window.showLoader('Datu apstrāde...');
  return fetch(WEBAPP_URL,{method:'POST',body:new URLSearchParams({data:JSON.stringify(payload)})}).then(function(r){return r.json();}).finally(function(){ if (typeof window.hideLoader === 'function') window.hideLoader(); }); }
function currentUser(){ try{return JSON.parse(localStorage.getItem('currentUser')||'{}');}catch(e){return {};} }
function getToken(){ try{ return localStorage.getItem('srs_access_token')||''; }catch(e){return '';} }
function requireUser(){ var u=currentUser(); if(!u.id||!getToken()){ window.location.href='../index.html'; return u; } return u; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function fmt(v){ return v==null?'':String(v); }
function setMsg(id,text,cls){ var el=document.getElementById(id); if(!el) return; el.className='alert '+(cls||''); el.textContent=text||''; el.style.display=text?'block':'none'; }
function byId(id){ return document.getElementById(id); }
