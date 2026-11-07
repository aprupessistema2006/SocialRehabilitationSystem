(function(){
  var APP_VERSION_KEY = typeof APP_VERSION_KEY !== 'undefined' ? APP_VERSION_KEY : 'srs_app_version';

  function safeGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function safeSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  async function clearDeviceStorage(){
    try{ localStorage.clear(); }catch(e){}
    try{ sessionStorage.clear(); }catch(e){}
    if('indexedDB' in window){
      try{
        if(typeof indexedDB.databases==='function'){
          var dbs=await indexedDB.databases();
          await Promise.all((dbs||[]).map(function(db){ return db && db.name ? new Promise(function(res){ var r=indexedDB.deleteDatabase(db.name); r.onsuccess=r.onerror=r.onblocked=function(){res();}; }) : Promise.resolve(); }));
        }
      }catch(e){}
    }
    if('caches' in window){
      try{ var keys=await caches.keys(); await Promise.all(keys.map(function(k){ return caches.delete(k); })); }catch(e){}
    }
    if('serviceWorker' in navigator){
      try{ var regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(function(r){ return r.unregister(); })); }catch(e){}
    }
  }

  function reloadClean(reason){
    try{
      var base = window.location.pathname + (window.location.hash || '');
      var sep = base.indexOf('?')>=0 ? '&' : '?';
      var u = base + sep + '_v=' + encodeURIComponent(String(typeof APP_VERSION!=='undefined'?APP_VERSION:Date.now())) + '&_r=' + String(Date.now()) + (reason? '&_reason='+encodeURIComponent(reason):'');
      window.location.replace(u);
    }catch(e){ window.location.reload(true); }
  }

  async function hardResetAndReload(reason){
    await clearDeviceStorage();
    reloadClean(reason);
  }

  function showUpdateBanner(localV, remoteV){
    if(window.__srsUpdateShown) return; window.__srsUpdateShown = true;
    var wrap=document.getElementById('appUpdateBanner');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='appUpdateBanner'; wrap.className='app-update-banner';
      wrap.innerHTML = '<div class="app-update-banner-inner">'
        + '<div class="app-update-icon">🔄</div>'
        + '<div class="app-update-text"><div class="app-update-title">Programma ir atjaunināta</div>'
        + '<div class="app-update-sub">Lai darbotos pareizi un rādītu jaunākos datus, lūdzu nospiediet pogu.</div></div>'
        + '<button type="button" id="appUpdateBtn" class="app-update-btn-big">Atjaunot tagad</button></div>';
      document.body.appendChild(wrap);
      var btn=document.getElementById('appUpdateBtn');
      btn.addEventListener('click', function(){
        if(window.__srsResetStarted) return; window.__srsResetStarted=true;
        btn.disabled=true; btn.textContent='Atjauno...';
        hardResetAndReload('manual');
      });
    }
    wrap.style.display='block';
    try{ wrap.setAttribute('data-ver', (localV||'-')+'→'+(remoteV||'-')); }catch(e){}
  }

  function hideUpdateBanner(){
    var w=document.getElementById('appUpdateBanner'); if(w) w.style.display='none';
  }

  function compareAndAct(remoteV){
    var remote=String(remoteV==null?'':remoteV).trim(); if(!remote) return;
    var local=String(safeGet(APP_VERSION_KEY)||'').trim();
    if(!local){ safeSet(APP_VERSION_KEY, remote); hideUpdateBanner(); return; }
    if(local !== remote){ showUpdateBanner(local, remote); }
    else { hideUpdateBanner(); }
  }

  async function checkVersion(){
    // Also honor ?_reason=version_mismatch_auto style reloads: if local mismatches known APP_VERSION constant, prompt
    try{
      var local=String(safeGet(APP_VERSION_KEY)||'').trim();
      var codeV=String(typeof APP_VERSION!=='undefined'?APP_VERSION:'').trim();
      if(local && codeV && local!==codeV){ showUpdateBanner(local, codeV); }
    }catch(e){}
    if(typeof WEBAPP_URL==='undefined' || !WEBAPP_URL) return;
    try{
      var ctrl=('AbortController' in window)?new AbortController():null;
      var t=ctrl?setTimeout(function(){ try{ctrl.abort();}catch(e){} }, 8000):null;
      var body=new URLSearchParams(); body.append('data', JSON.stringify({action:'getAppInfo'}));
      var res=await fetch(WEBAPP_URL,{method:'POST',body:body,cache:'no-store',signal:ctrl?ctrl.signal:undefined});
      if(t) clearTimeout(t);
      var txt=await res.text(); var json=JSON.parse(txt);
      var remote=json && (json.app_version || json.version || (json.iestatijumi && (json.iestatijumi.app_version||json.iestatijumi.version)));
      if(remote) compareAndAct(remote);
    }catch(e){ /* offline/stale backend: do not block app */ }
  }

  window.SRSVersion={check:checkVersion,hardReset:function(){ hardResetAndReload('forced'); },getLocal:function(){ return safeGet(APP_VERSION_KEY); }};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', checkVersion); else checkVersion();
})();
