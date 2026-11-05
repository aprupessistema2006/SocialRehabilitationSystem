async function initSettings(){ var u=requireUser(); if(u.role!=='ADMIN'){ byId('adminWarn').style.display='block'; byId('settingsWrap').style.display='none'; return; }
  try{ var res=await api('getIestatijumi'); var s=(res.ok&&res.iestatijumi)||{}; byId('setOrg').value=s.org||'Sociālās aprūpes centrs'; byId('setVer').value=s.version||'1.0'; byId('setNote').value=s.note||''; }catch(e){}
  byId('saveSettings').addEventListener('click', async function(){ try{ await api('saveIestatijumi',{iestatijumi:{org:byId('setOrg').value,version:byId('setVer').value,note:byId('setNote').value}}); byId('pageMsg').textContent='Saglabāts.'; }catch(e){ byId('pageMsg').textContent='Kļūda.'; } });
  byId('seedSettings').addEventListener('click', async function(){ byId('pageMsg').textContent='Ievieto testa datus...'; try{ await api('seedTestData'); byId('pageMsg').textContent='Testa dati ievietoti (ja tabulas bija tukšas): 2 klienti, 2 darbinieki, kaskāde, 1 nodarbība.'; }catch(e){ byId('pageMsg').textContent='Kļūda.'; } });
}
document.addEventListener('DOMContentLoaded', function(){ if(byId('saveSettings')) initSettings(); });
