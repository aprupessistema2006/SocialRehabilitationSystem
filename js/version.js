(function(){
  var APP_VERSION_KEY = typeof APP_VERSION_KEY !== 'undefined' ? APP_VERSION_KEY : 'srs_app_version';

  function safeGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function safeSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  function clearDeviceStorage(){
    try{ localStorage.clear(); }catch(e){}
    try{ sessionStorage.clear(); }catch(e){}
    if('indexedDB' in window){
      try{
        if(typeof indexedDB.databases==='function'){
          indexedDB.databases().then(function(dbs){ dbs.forEach(function(db){ if(db.name) indexedDB.deleteDatabase(db.name); }); });
        }
      }catch(e){}
    }
    if('caches' in window){
      try{ caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); }); }catch(e){}
    }
    if('serviceWorker' in navigator){
      try{ navigator.serviceWorker.getRegistrations().then(function(regs){ regs.forEach(function(r){ r.unregister(); }); }); }catch(e){}
    }
  }

  function reloadClean(reason){
    try{
      var u=new URL(window.location.href);
      u.searchParams.set('_v', String(typeof APP_VERSION!=='undefined'?APP_VERSION:Date.now()));
      u.searchParams.set('_r', String(Date.now()));
      if(reason) u.searchParams.set('_reason', reason);
      window.location.replace(u.toString());
    }catch(e){ window.location.reload(); }
  }

  function hardResetAndReload(reason){
    clearDeviceStorage();
    reloadClean(reason);
  }

  function ensureUpdateButton(localV, remoteV){
    var btn=document.getElementById('appUpdateBtn');
    if(!btn){
      btn=document.createElement('button');
      btn.id='appUpdateBtn'; btn.type='button'; btn.className='app-update-btn';
      btn.textContent='Atjaunot programmu';
      btn.addEventListener('click', function(){
        window.__srsResetStarted = true;
        btn.disabled=true;
        btn.textContent='Iztīra atmiņu un atjaunino...';
        hardResetAndReload('manual');
      });
      document.body.appendChild(btn);
    }
    btn.style.display='inline-flex';
    btn.title='Lokālā versija: '+(localV||'-')+', servera versija: '+(remoteV||'-');
    return btn;
  }

  function hideUpdateButton(){
    var btn=document.getElementById('appUpdateBtn');
    if(btn) btn.style.display='none';
  }

  function compareAndAct(remoteV){
    var remote=String(remoteV==null?'':remoteV).trim(); if(!remote) return;
    var local=String(safeGet(APP_VERSION_KEY)||'').trim();
    if(!local){ safeSet(APP_VERSION_KEY, remote); hideUpdateButton(); return; }
    if(local !== remote){
      ensureUpdateButton(local, remote);
      // Automātiskais hard reset pēc 3s, ja lietotājs nespiest poga — nodrošina, ka jaunais kods vienmēr ielādēsies
      setTimeout(function(){
        if(document.getElementById('appUpdateBtn') && !window.__srsResetStarted){
          window.__srsResetStarted = true;
          hardResetAndReload('version_mismatch_auto');
        }
      }, 3000);
    } else {
      hideUpdateButton();
    }
  }

  async function checkVersion(){
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
    }catch(e){ /* offline/stale backend: do not block app; local data keeps working */ }
  }

  window.SRSVersion={check:checkVersion,hardReset:function(){ hardResetAndReload('forced'); },getLocal:function(){ return safeGet(APP_VERSION_KEY); }};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', checkVersion); else checkVersion();
})();
