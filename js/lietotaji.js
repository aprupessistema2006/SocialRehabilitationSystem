var _users=[];
async function initUsers(){ var u=requireUser(); if(u.role!=='ADMIN'){ byId('adminWarn').style.display='block'; byId('usersWrap').style.display='none'; return; }
  await loadUsers(); byId('addUserBtn').addEventListener('click', function(){ openUser(); }); byId('userCancel').addEventListener('click', function(){ byId('userModal').style.display='none'; }); byId('userSave').addEventListener('click', saveUser); }
async function loadUsers(){ try{ var res=await api('getLietotaji'); _users=res.ok?(res.lietotaji||[]):[]; renderUsers(); }catch(e){ byId('pageMsg').textContent='Neizdevās ielādēt lietotājus.'; } }
function renderUsers(){ var tb=byId('usersBody'); tb.innerHTML=''; _users.forEach(function(u){ var tr=document.createElement('tr'); tr.innerHTML='<td>'+esc(u.employee_id)+'</td><td>'+esc(u.employee_name)+'</td><td>'+esc(u.role)+'</td><td>'+(u.active?'<span class="badge badge-ok">Jā</span>':'<span class="badge badge-off">Nē</span>')+'</td><td><button class="btn btn-secondary" data-edit="'+esc(u.employee_id)+'">Labot</button></td>'; tb.appendChild(tr); });
  tb.querySelectorAll('[data-edit]').forEach(function(b){ b.addEventListener('click', function(){ var u=_users.find(function(x){return String(x.employee_id)===String(b.dataset.edit);}); if(u) openUser(u); }); }); }
function openUser(u){ byId('userId').value=u?u.employee_id:''; byId('userNameIn').value=u?u.employee_name:''; byId('userPin').value=u?u.pin:''; byId('userRoleIn').value=u?u.role:'USER'; byId('userActive').value=u&&u.active===false?'false':'true'; setMsg('userModalMsg','',''); byId('userModalTitle').textContent=u?'Labot lietotāju':'Pievienot lietotāju'; byId('userModal').style.display='flex'; }
async function saveUser(){ var name=byId('userNameIn').value.trim(), pin=byId('userPin').value.trim(); if(!name||!pin){ setMsg('userModalMsg','Vārds un PIN ir obligāti.','alert-error'); return; }
  if(!/^\d{4,20}$/.test(pin)){ setMsg('userModalMsg','PIN jābūt 4–20 cipariem.','alert-error'); return; }
  var btn=byId('userSave'); if(btn) btn.disabled=true; setMsg('userModalMsg','Saglabā...','');
  try{ var res=await api('saveLietotajs',{employee_id:byId('userId').value||null,employee_name:name,pin:pin,role:byId('userRoleIn').value,active:byId('userActive').value==='true'}); if(res&&res.ok){ byId('userModal').style.display='none'; await loadUsers(); setMsg('pageMsg','Saglabāts.',''); } else setMsg('userModalMsg','Neizdevās saglabāt: '+esc((res&&(res.reason||res.err))||'nezināma kļūda'),'alert-error'); }
  catch(e){ setMsg('userModalMsg','Servera kļūda vai versijas kešs. Pārlādē lapu (Ctrl+F5).','alert-error'); }
  finally{ if(btn) btn.disabled=false; } }
document.addEventListener('DOMContentLoaded', function(){ if(byId('usersBody')) initUsers(); });
