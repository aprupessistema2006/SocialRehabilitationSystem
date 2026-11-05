function initLayout(){var user=JSON.parse(localStorage.getItem('currentUser')||'{}');var userNameEl=document.getElementById('userName');var userRoleEl=document.getElementById('userRole');if(userNameEl)userNameEl.textContent=user.name||'';if(userRoleEl)userRoleEl.textContent=user.role||'';if(user.role!=='ADMIN'){document.querySelectorAll('.admin-only').forEach(function(el){el.style.display='none';});}var logoutBtn=document.getElementById('logoutBtn');if(logoutBtn){logoutBtn.addEventListener('click',function(e){e.preventDefault();if(typeof window.showLoader==='function'){window.showLoader('Iziet...');}localStorage.removeItem('currentUser');setTimeout(function(){window.location.href='../index.html';},300);});}var currentPage=window.location.pathname.split('/').pop();document.querySelectorAll('.nav-link').forEach(function(link){var href=link.getAttribute('href');if(href===currentPage){link.classList.add('active');}});}document.addEventListener('DOMContentLoaded',initLayout);

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