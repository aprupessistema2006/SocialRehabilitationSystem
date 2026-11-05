async function initSettings(){ var u=requireUser(); if(u.role!=='ADMIN'){ byId('adminWarn').style.display='block'; byId('settingsWrap').style.display='none'; return; }
  try{ var res=await api('getIestatijumi'); var s=(res.ok&&res.iestatijumi)||{}; byId('setOrg').value=s.org||'Sociālās aprūpes centrs'; byId('setVer').value=s.version||'1.0'; byId('setNote').value=s.note||''; }catch(e){}
  byId('saveSettings').addEventListener('click', async function(){ try{ await api('saveIestatijumi',{iestatijumi:{org:byId('setOrg').value,version:byId('setVer').value,note:byId('setNote').value}}); byId('pageMsg').textContent='Saglabāts.'; }catch(e){ byId('pageMsg').textContent='Kļūda.'; } });
  byId('seedSettings').addEventListener('click', async function(){ byId('pageMsg').textContent='Ievieto testa datus...'; try{ await api('seedTestData'); byId('pageMsg').textContent='Testa dati ievietoti (ja tabulas bija tukšas): 2 klienti, 2 darbinieki, kaskāde, 1 nodarbība.'; }catch(e){ byId('pageMsg').textContent='Kļūda.'; } });
  if (byId('sessionBar')) {
    updateSessionTimer();
    setInterval(updateSessionTimer, 1000);
  }
  var extendBtn = byId('extendSession');
  if (extendBtn) {
    extendBtn.addEventListener('click', function(){
      try { localStorage.setItem(ACCESS_REMEMBER_KEY, String(Date.now())); } catch(e) {}
      updateSessionTimer();
      byId('pageMsg').textContent = 'Sesija atjaunināta.';
    });
  }
}
function updateSessionTimer(){
  var bar = byId('sessionBar'); var label = byId('sessionLabel');
  if (!bar) return;
  var t = parseInt(localStorage.getItem(ACCESS_REMEMBER_KEY) || '0', 10);
  if (!t) { bar.style.width = '0%'; if (label) label.textContent = 'Sesija beigusies'; return; }
  var left = ACCESS_REMEMBER_MS - (Date.now() - t);
  if (left <= 0) { bar.style.width = '0%'; if (label) label.textContent = 'Sesija beigusies'; return; }
  var pct = Math.max(0, Math.min(100, (left / ACCESS_REMEMBER_MS) * 100));
  bar.style.width = pct + '%';
  var h = Math.floor(left / 3600000); var m = Math.floor((left % 3600000) / 60000); var s = Math.floor((left % 60000) / 1000);
  if (label) label.textContent = 'Atlikis: ' + h + 'h ' + m + 'm ' + s + 's';
}
document.addEventListener('DOMContentLoaded', function(){ if(byId('saveSettings')) initSettings(); });
