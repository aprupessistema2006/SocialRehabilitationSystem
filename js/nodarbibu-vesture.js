var _hist=[];
var _klienti=[];
var _selectedClients=new Set();
async function initHist(){ requireUser(); try{ await Promise.all([loadKlienti(),loadNodarbibas()]); renderClients(); renderHist(); }catch(e){ byId('pageMsg').textContent='Neizdevās ielādēt datus.'; }
  ['qClient','qWorker','qDate'].forEach(function(id){ byId(id).addEventListener('input', renderHist); });
  byId('clearFilters').addEventListener('click', function(){ byId('qClient').value=''; byId('qWorker').value=''; byId('qDate').value=''; _selectedClients.clear(); renderClients(); renderHist(); });
  byId('viewClose').addEventListener('click', function(){ byId('viewModal').style.display='none'; });
  byId('filterClients').addEventListener('change', function(){ _selectedClients=new Set(Array.from(byId('filterClients').selectedOptions).map(function(o){ return o.value; })); renderClients(); renderHist(); });
  byId('exportSelectedBtn').addEventListener('click', function(){ var data=_selectedClients.size? _hist.filter(function(r){ return _selectedClients.has(r.klients); }):_hist; exportNodarbibasToExcel(data, 'nodarbibu_klienti_'+new Date().toISOString().slice(0,10)+'.xlsx'); });
  byId('exportExcelBtn').addEventListener('click', function(){ exportNodarbibasToExcel(_hist, 'nodarbibu_visiem_'+new Date().toISOString().slice(0,10)+'.xlsx'); });
}
async function loadKlienti(){ try{ var res=await api('getKlienti'); _klienti=(res.ok&&res.klienti)||[]; }catch(e){ _klienti=[]; } }
async function loadNodarbibas(){ var res=await api('getNodarbibas'); _hist=res.ok?(res.nodarbibas||[]):[]; window._hist=_hist; }
function renderClients(){ var sel=byId('filterClients'); if(!sel) return; sel.innerHTML=''; (_klienti||[]).forEach(function(k){ var o=document.createElement('option'); o.value=k.vards||k.id||''; o.textContent=k.vards||k.id||''; if(_selectedClients.has(o.value)) o.selected=true; sel.appendChild(o); }); var el=byId('clientCount'); if(el) el.textContent=_selectedClients.size?'('+_selectedClients.size+' atlasīti)':'(visi)'; }
function renderHist(){ var qc=(byId('qClient').value||'').toLowerCase(), qw=(byId('qWorker').value||'').toLowerCase(), qd=(byId('qDate').value||'').trim(); var tb=byId('histBody'); tb.innerHTML='';
  _hist.filter(function(r){ return (!_selectedClients.size||_selectedClients.has(r.klients)) && (!qc||String(r.klients||'').toLowerCase().indexOf(qc)>=0) && (!qw||String(r.darbinieks||'').toLowerCase().indexOf(qw)>=0) && (!qd||String(r.datums||'').indexOf(qd)>=0); }).slice().reverse().forEach(function(r){
    var tr=document.createElement('tr'); tr.innerHTML='<td>'+esc(r.id)+'</td><td>'+esc(r.datums)+'</td><td>'+esc(r.klients)+'</td><td>'+esc(r.nodarbiba_nosaukums)+'</td><td>'+esc(r.darbinieks)+'</td><td><button class="btn btn-secondary" data-view="'+esc(r.id)+'">Skatīt</button></td>'; tb.appendChild(tr);
  }); if(!tb.children.length) tb.innerHTML='<tr><td colspan="6">Nav ierakstu.</td></tr>';
  tb.querySelectorAll('[data-view]').forEach(function(b){ b.addEventListener('click', function(){ var r=_hist.find(function(x){return String(x.id)===String(b.dataset.view);}); if(r) viewRec(r); }); });
}
function viewRec(r){ var fields=[['ID',r.id],['Datums',r.datums],['Klients',r.klients],['Darbinieks',r.darbinieks],['Nodarbība',r.nodarbiba_nosaukums],['Mērķis',r.merkis],['Problēma',r.problema],['Uzdevums',r.uzdevums],['Refleksija',r.refleksija],['Motivācija',r.motivacija],['Gaita',r.gaita],['Garastāvoklis',r.garastavoklis],['Vērtējums',r.vertejums],['Pildīts',r.pildits],['Komentārs',r.komentars]];
  byId('viewBody').innerHTML=fields.map(function(f){ return '<div style="margin-bottom:10px"><div class="small muted">'+esc(f[0])+'</div><div>'+esc(f[1]||'-')+'</div></div>'; }).join(''); byId('viewModal').style.display='flex'; }
document.addEventListener('DOMContentLoaded', function(){ if(byId('histBody')) initHist(); });
