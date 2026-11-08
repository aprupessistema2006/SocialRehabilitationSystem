var _hist=[];
async function initHist(){ requireUser(); try{ var res=await api('getNodarbibas'); _hist=res.ok?(res.nodarbibas||[]):[]; window._hist=_hist; renderHist(); }catch(e){ byId('pageMsg').textContent='Neizdevās ielādēt vēsturi.'; }
  ['qClient','qWorker','qDate'].forEach(function(id){ byId(id).addEventListener('input', renderHist); });
  byId('clearFilters').addEventListener('click', function(){ byId('qClient').value=''; byId('qWorker').value=''; byId('qDate').value=''; renderHist(); });
  byId('viewClose').addEventListener('click', function(){ byId('viewModal').style.display='none'; });
}
function renderHist(){ var qc=(byId('qClient').value||'').toLowerCase(), qw=(byId('qWorker').value||'').toLowerCase(), qd=(byId('qDate').value||'').trim(); var tb=byId('histBody'); tb.innerHTML='';
  _hist.filter(function(r){ return (!qc||String(r.klients||'').toLowerCase().indexOf(qc)>=0) && (!qw||String(r.darbinieks||'').toLowerCase().indexOf(qw)>=0) && (!qd||String(r.datums||'').indexOf(qd)>=0); }).slice().reverse().forEach(function(r){
    var tr=document.createElement('tr'); tr.innerHTML='<td>'+esc(r.id)+'</td><td>'+esc(r.datums)+'</td><td>'+esc(r.klients)+'</td><td>'+esc(r.nodarbiba_nosaukums)+'</td><td>'+esc(r.darbinieks)+'</td><td><button class="btn btn-secondary" data-view="'+esc(r.id)+'">Skatīt</button></td>'; tb.appendChild(tr);
  }); if(!tb.children.length) tb.innerHTML='<tr><td colspan="6">Nav ierakstu.</td></tr>';
  tb.querySelectorAll('[data-view]').forEach(function(b){ b.addEventListener('click', function(){ var r=_hist.find(function(x){return String(x.id)===String(b.dataset.view);}); if(r) viewRec(r); }); });
}
function viewRec(r){ var fields=[['ID',r.id],['Datums',r.datums],['Klients',r.klients],['Darbinieks',r.darbinieks],['Nodarbība',r.nodarbiba_nosaukums],['Mērķis',r.merkis],['Problēma',r.problema],['Uzdevums',r.uzdevums],['Refleksija',r.refleksija],['Motivācija',r.motivacija],['Gaita',r.gaita],['Garastāvoklis',r.garastavoklis],['Vērtējums',r.vertejums],['Pildīts',r.pildits],['Komentārs',r.komentars]];
  byId('viewBody').innerHTML=fields.map(function(f){ return '<div style="margin-bottom:10px"><div class="small muted">'+esc(f[0])+'</div><div>'+esc(f[1]||'-')+'</div></div>'; }).join(''); byId('viewModal').style.display='flex'; }
document.addEventListener('DOMContentLoaded', function(){ if(byId('histBody')) initHist(); });
