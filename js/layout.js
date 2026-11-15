function initLayout(){var user=JSON.parse(localStorage.getItem('currentUser')||'{}');var userNameEl=document.getElementById('userName');var userRoleEl=document.getElementById('userRole');if(userNameEl)userNameEl.textContent=user.name||'';if(userRoleEl)userRoleEl.textContent=user.role||'';if(user.role!=='ADMIN'){document.querySelectorAll('.admin-only').forEach(function(el){el.style.display='none';});}var logoutBtn=document.getElementById('logoutBtn');if(logoutBtn){logoutBtn.addEventListener('click',function(e){e.preventDefault();if(typeof window.showLoader==='function'){window.showLoader('Iziet...');}localStorage.removeItem('currentUser');localStorage.removeItem('srs_access_token');setTimeout(function(){window.location.href='../index.html';},300);});}var currentPage=window.location.pathname.split('/').pop();document.querySelectorAll('.nav-link').forEach(function(link){var href=link.getAttribute('href');if(href===currentPage){link.classList.add('active');}});
  var v=(typeof APP_VERSION!=='undefined'&&APP_VERSION)?APP_VERSION:(function(){try{return localStorage.getItem('srs_app_version')||'';}catch(e){return ''}})()||'—';
  document.querySelectorAll('.app-version-num').forEach(function(el){el.textContent=v;});
  document.querySelectorAll('.app-footer').forEach(function(el){if(el.textContent&&el.textContent.indexOf('Versija 1.0')>=0) el.innerHTML=el.innerHTML.replace('Versija 1.0','Versija <span class=\"app-version-num\">'+v+'</span>');});
}document.addEventListener('DOMContentLoaded',initLayout);

/* SRS diagnostika un pašārstēšanās (konsolē: SRS.diag(), SRS.test(), SRS.reset(), SRS.relogin()) */
(function(){
  function safeJSON(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return localStorage.getItem(k); } }
  function mask(t){ if(!t) return ''; t=String(t); return t.length>10?(t.slice(0,6)+'…'+t.slice(-4)):'***'; }
  async function clearCachesOnly(){
    try{ if('caches' in window){ var keys=await caches.keys(); await Promise.all(keys.map(function(k){return caches.delete(k);})); } }catch(e){}
    try{ if('serviceWorker' in navigator){ var regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(function(r){return r.unregister();})); } }catch(e){}
  }
  async function hardReset(){
    try{ localStorage.clear(); sessionStorage.clear(); }catch(e){}
    try{ if('indexedDB' in window && typeof indexedDB.databases==='function'){ var dbs=await indexedDB.databases(); await Promise.all((dbs||[]).map(function(db){ return db&&db.name?new Promise(function(res){var r=indexedDB.deleteDatabase(db.name);r.onsuccess=r.onerror=r.onblocked=function(){res();};}):Promise.resolve(); })); } }catch(e){}
    await clearCachesOnly();
    console.log('[SRS] Atmiņa/kešs notīrīts. Pārlādēju...');
    setTimeout(function(){ var u=location.pathname+'?_reset='+Date.now(); location.replace(u); }, 300);
  }
  function relogin(){
    try{ localStorage.removeItem('srs_access_token'); localStorage.removeItem('currentUser'); }catch(e){}
    var url=(location.pathname.indexOf('/pages/')>=0?'../index.html':'index.html')+'?reason=relogin';
    location.href=url;
  }
  function info(){
    var d={
      time:new Date().toISOString(),
      url:location.href,
      WEBAPP_URL:(typeof WEBAPP_URL!=='undefined'?WEBAPP_URL:null),
      APP_VERSION:(typeof APP_VERSION!=='undefined'?APP_VERSION:null),
      storedVersion:(function(){try{return localStorage.getItem('srs_app_version');}catch(e){return null;}})(),
      token:mask((function(){try{return localStorage.getItem('srs_access_token');}catch(e){return null;}})()),
      currentUser:safeJSON('currentUser'),
      accessRemember:(function(){try{return localStorage.getItem(ACCESS_REMEMBER_KEY);}catch(e){return null;}})(),
      lastApi:(window.SRS_DEBUG?window.SRS_DEBUG.last:null)
    };
    return d;
  }
  function diag(){
    var d=info();
    console.group('[SRS][diag] Diagnostika');
    console.log('info', d);
    try{ console.table((window.SRS_DEBUG&&window.SRS_DEBUG.logs)||[]); }catch(e){ console.log('logs',(window.SRS_DEBUG&&window.SRS_DEBUG.logs)||[]); }
    console.log('Padomi: SRS.test() — API tests; SRS.relogin() — jauns tokens; SRS.reset() — pilna notīrīšana+reload; SRS.hardReset() — tas pats.');
    console.groupEnd();
    return d;
  }
  async function test(){
    console.group('[SRS][test] Pilns tests');
    var out={ok:true, steps:[], info:info()};
    function step(name, status, detail){ var s={name:name, status:status, detail:detail}; out.steps.push(s); console[status==='PASS'?'log':(status==='WARN'?'warn':'error')]('[SRS][test]', status, name, detail||''); }
    step('Konfigurācija', (typeof WEBAPP_URL!=='undefined'&&WEBAPP_URL)?'PASS':'FAIL', {WEBAPP_URL:(typeof WEBAPP_URL!=='undefined'?WEBAPP_URL:null), APP_VERSION:(typeof APP_VERSION!=='undefined'?APP_VERSION:null)});
    step('Local storage', 'PASS', {hasToken:!!(function(){try{return localStorage.getItem('srs_access_token');}catch(e){return false;}})(), user:safeJSON('currentUser')});
    try{
      var body=new URLSearchParams(); body.append('data', JSON.stringify({action:'getAppInfo'}));
      var r=await fetch(WEBAPP_URL,{method:'POST',body:body}); var t=await r.text();
      var j=null; try{ j=JSON.parse(t); }catch(e){}
      step('getAppInfo (serveris sasniedzams)', j?'PASS':'WARN', j||t.slice(0,300));
    }catch(e){ out.ok=false; step('getAppInfo (serveris sasniedzams)', 'FAIL', String(e)); }
    var token=(function(){try{return localStorage.getItem('srs_access_token');}catch(e){return '';}})();
    if(token && typeof api==='function'){
      try{ var k=await api('getKlienti'); step('getKlienti', (k&&k.ok)?'PASS':'FAIL', k&&(k.reason||k.err||('count='+((k.klienti||[]).length)))); if(!(k&&k.ok)) out.ok=false; }catch(e){ out.ok=false; step('getKlienti', 'FAIL', e); }
      try{ var n=await api('getNodarbibas'); step('getNodarbibas', (n&&n.ok)?'PASS':'FAIL', n&&(n.reason||n.err||('count='+((n.nodarbibas||[]).length)))); if(!(n&&n.ok)) out.ok=false; }catch(e){ out.ok=false; step('getNodarbibas', 'FAIL', e); }
    } else {
      step('API dati (klienti/nodarbības)', 'WARN', 'Nav tokena — ielogojieties, lai testētu.');
    }
    step('Pēdējais fillVeidne', (window.SRS_DEBUG&&window.SRS_DEBUG.last&&window.SRS_DEBUG.last.fillVeidne)?((window.SRS_DEBUG.last.fillVeidne.ok)?'PASS':'FAIL'):'WARN', (window.SRS_DEBUG&&window.SRS_DEBUG.last&&window.SRS_DEBUG.last.fillVeidne)||'nav izsaukts');
    console.log('Kopsavilkums', out);
    console.groupEnd();
    return out;
  }
  window.SRS = Object.assign(window.SRS||{}, { diag:diag, info:info, test:test, reset:hardReset, hardReset:hardReset, relogin:relogin, clearCaches:clearCachesOnly, logs:function(){return (window.SRS_DEBUG&&window.SRS_DEBUG.logs)||[];} });
  window.srsDiag=diag; window.srsTest=test; window.srsReset=hardReset; window.srsRelogin=relogin;
  console.log('[SRS] Diagnostika gatava. Komandas: SRS.diag(), SRS.test(), SRS.relogin(), SRS.reset()');
})();

/* Globālais sesijas indikators (neuzkrītošs, apakšējā labajā stūrī) */
(function(){
  var el=null;
  function ensureEl(){
    if(el) return;
    el=document.createElement('div');
    el.className='session-indicator';
    document.body.appendChild(el);
  }
  function fmt(left){
    if(left<=0) return 'Sesija beigusies';
    var h=Math.floor(left/3600000), m=Math.floor((left%3600000)/60000), s=Math.floor((left%60000)/1000);
    return 'Sesija: '+h+'h '+m+'m '+s+'s';
  }
  function update(){
    try{
      var t=parseInt(localStorage.getItem(ACCESS_REMEMBER_KEY)||'0',10);
      if(!t){ if(el) el.textContent='Sesija beigusies'; return; }
      var left=ACCESS_REMEMBER_MS-(Date.now()-t);
      if(left<=0){ if(el) el.textContent='Sesija beigusies'; return; }
      ensureEl();
      el.textContent=fmt(left);
      el.classList.add('show');
    }catch(e){}
  }
  window.sessionTick=update;
  setInterval(update,1000);
  window.addEventListener('load',function(){ setTimeout(update,200); });
})();

/* Globālais loading indikators - rādās uz saglabāšanas un lapu pārnesšanas */
(function(){
  var loader=null;
  function showLoader(msg){
    if(!loader){
      loader=document.createElement('div');
      loader.className='global-loading';
      loader.innerHTML='<div class="spinner-ring"></div><span id="loaderMsg">Ielādē...</span>';
      document.body.appendChild(loader);
    }
    var m=document.getElementById('loaderMsg'); if(m) m.textContent=msg||'Ielādē...';
    loader.classList.add('active');
  }
  function hideLoader(){ if(loader) loader.classList.remove('active'); }
  window.showLoader=showLoader; window.hideLoader=hideLoader;

  document.addEventListener('submit', function(e){
    if(e.target.tagName==='FORM'){ showLoader('Saglabā...'); }
  }, true);

  document.addEventListener('click', function(e){
    var link=e.target.closest('a[href]');
    if(link && link.hostname===location.hostname && !link.classList.contains('nav-link-danger')){
      showLoader('Ielādējam datus...');
    }
  }, true);

  window.addEventListener('load', function(){ setTimeout(hideLoader, 300); });
})();

/* Globālais modal aizvēršanas kontroles - backdrop klikšķis un Esc taustiņš visiem modaliem */
(function(){
  function closeAll(){
    document.querySelectorAll('.modal-backdrop').forEach(function(m){ m.style.display='none'; });
  }
  document.addEventListener('click', function(e){
    if(e.target.classList.contains('modal-backdrop')){ closeAll(); }
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeAll(); } });
})();

/* Mobilā navigācijas izvēlne - rubena atvēršana/zūšana pārīkiem */
(function(){
  var btn=document.getElementById('mobileMenuBtn');
  var overlay=document.getElementById('mobileOverlay');
  var body=document.body;
  if(!btn || !overlay) return;
  function open(){ body.classList.add('sidebar-open'); btn.setAttribute('aria-expanded','true'); overlay.setAttribute('aria-hidden','false'); }
  function close(){ body.classList.remove('sidebar-open'); btn.setAttribute('aria-expanded','false'); overlay.setAttribute('aria-hidden','true'); }
  btn.addEventListener('click',function(){ body.classList.contains('sidebar-open')?close():open(); });
  overlay.addEventListener('click',close);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && body.classList.contains('sidebar-open')){ e.preventDefault(); close(); } });
})();

/* Modal logs - pārvilkšana ar kursoru (tikai izkārtojuma lietojamība, nav funkcionālās izmaiņas) */
(function(){
  document.addEventListener('mousedown', function(e){
    if(e.button !== 0) return;
    if(e.target.closest('.sp-modal-close, .modal-close')) return;
    var handle = e.target.closest('.sp-modal-head, .modal-header');
    if(!handle) return;
    var modal = handle.closest('.sp-modal, .modal-backdrop');
    if(!modal) return;
    var dialog = modal.querySelector('.sp-modal-dialog, .modal');
    if(!dialog) return;
    e.preventDefault();
    var rect = dialog.getBoundingClientRect();
    dialog.style.position = 'fixed';
    dialog.style.left = rect.left + 'px';
    dialog.style.top = rect.top + 'px';
    dialog.style.width = rect.width + 'px';
    dialog.style.margin = '0';
    dialog.style.transform = 'none';
    var startX = e.clientX, startY = e.clientY;
    var startLeft = rect.left, startTop = rect.top;
    function onMove(ev){
      dialog.style.left = (startLeft + ev.clientX - startX) + 'px';
      dialog.style.top = (startTop + ev.clientY - startY) + 'px';
    }
    function onUp(){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, {capture:true});
})();
