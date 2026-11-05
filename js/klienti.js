var _clients=[];
async function initKlienti(){ requireUser(); await loadKlienti();
  byId('searchClient').addEventListener('input', renderKlienti); byId('filterStatus').addEventListener('change', renderKlienti);
  byId('addClientBtn').addEventListener('click', function(){ openClientModal(); });
  byId('clientCancel').addEventListener('click', closeClientModal); byId('clientSave').addEventListener('click', saveClient); }
async function loadKlienti(){ try{ var res=await api('getKlienti'); _clients=res.ok?(res.klienti||[]):[]; renderKlienti(); }catch(e){ byId('pageMsg').textContent='Neizdevās ielādēt klientus.'; } }
function renderKlienti(){ var q=(byId('searchClient').value||'').toLowerCase(); var st=byId('filterStatus').value; var tb=byId('clientsBody'); tb.innerHTML='';
  _clients.filter(function(c){ return (!q||String(c.vards||'').toLowerCase().indexOf(q)>=0) && (!st||String(c.statuss)===st); }).forEach(function(c){
    var tr=document.createElement('tr'); tr.innerHTML='<td>'+esc(c.id)+'</td><td>'+esc(c.vards)+'</td><td><span class="badge '+(String(c.statuss).toLowerCase().indexOf('akt')===0?'badge-ok':'badge-off')+'">'+esc(c.statuss)+'</span></td><td>'+esc(c.piezimes)+'</td><td class="table-actions"><a class="table-link" href="klienta-profilis.html?id='+encodeURIComponent(c.id)+'">Profils</a><button class="btn btn-secondary" data-edit="'+esc(c.id)+'">Labot</button></td>';
    tb.appendChild(tr);
  }); if(!tb.children.length) tb.innerHTML='<tr><td colspan="5">Nav klientu.</td></tr>';
  tb.querySelectorAll('[data-edit]').forEach(function(b){ b.addEventListener('click', function(){ var c=_clients.find(function(x){return String(x.id)===String(b.dataset.edit);}); if(c) openClientModal(c); }); });
}
function openClientModal(c){ byId('clientId').value=c?c.id:''; byId('clientName').value=c?c.vards:''; byId('clientStatus').value=c?c.statuss:'Aktīvs'; byId('clientNotes').value=c?c.piezimes||'':''; setMsg('clientModalMsg','',''); byId('clientModalTitle').textContent=c?'Labot klientu':'Pievienot klientu'; byId('clientModal').style.display='flex'; }
function closeClientModal(){ byId('clientModal').style.display='none'; }
async function saveClient(){ var name=byId('clientName').value.trim(); if(!name){ setMsg('clientModalMsg','Vārds ir obligāts.','alert-error'); return; }
  try{ var res=await api('saveKlients',{id:byId('clientId').value||null, vards:name, statuss:byId('clientStatus').value, piezimes:byId('clientNotes').value}); if(res.ok){ closeClientModal(); await loadKlienti(); } else setMsg('clientModalMsg','Neizdevās saglabāt.','alert-error'); }
  catch(e){ setMsg('clientModalMsg','Servera kļūda.','alert-error'); }
}
document.addEventListener('DOMContentLoaded', function(){ if(byId('clientsBody')) initKlienti(); });
