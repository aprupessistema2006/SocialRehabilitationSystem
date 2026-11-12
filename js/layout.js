function initLayout(){var user=JSON.parse(localStorage.getItem('currentUser')||'{}');var userNameEl=document.getElementById('userName');var userRoleEl=document.getElementById('userRole');if(userNameEl)userNameEl.textContent=user.name||'';if(userRoleEl)userRoleEl.textContent=user.role||'';if(user.role!=='ADMIN'){document.querySelectorAll('.admin-only').forEach(function(el){el.style.display='none';});}var logoutBtn=document.getElementById('logoutBtn');if(logoutBtn){logoutBtn.addEventListener('click',function(e){e.preventDefault();if(typeof window.showLoader==='function'){window.showLoader('Iziet...');}localStorage.removeItem('currentUser');setTimeout(function(){window.location.href='../index.html';},300);});}var currentPage=window.location.pathname.split('/').pop();document.querySelectorAll('.nav-link').forEach(function(link){var href=link.getAttribute('href');if(href===currentPage){link.classList.add('active');}});
  var v=(typeof APP_VERSION!=='undefined'&&APP_VERSION)?APP_VERSION:(function(){try{return localStorage.getItem('srs_app_version')||'';}catch(e){return ''}})()||'—';
  document.querySelectorAll('.app-version-num').forEach(function(el){el.textContent=v;});
  document.querySelectorAll('.app-footer').forEach(function(el){if(el.textContent&&el.textContent.indexOf('Versija 1.0')>=0) el.innerHTML=el.innerHTML.replace('Versija 1.0','Versija <span class=\"app-version-num\">'+v+'</span>');});
}document.addEventListener('DOMContentLoaded',initLayout);

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
