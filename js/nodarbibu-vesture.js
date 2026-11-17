var _hist=[];
var _klienti=[];
var _selectedClients=new Set();

function downloadBase64File(b64, filename, mime){
  try{
    var byteChars = atob(b64);
    var byteNums = new Array(byteChars.length);
    for(var i=0;i<byteChars.length;i++) byteNums[i]=byteChars.charCodeAt(i);
    var blob = new Blob([new Uint8Array(byteNums)], {type: mime || 'application/octet-stream'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename || 'veidne.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    console.log('[SRS] Lejupielādē fails:', a.download);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
  }catch(e){
    console.error('downloadBase64File failed', e);
  }
}
function fmtVeidneDate(v){
  var s=String(v==null?'':v).trim(); if(!s) return '';
  if(/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){ var p=s.split('-'); return p[2]+'.'+p[1]+'.'+p[0]; }
  var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return m[3]+'.'+m[2]+'.'+m[1];
  var d=new Date(s); if(!isNaN(d)){ var dd=('0'+d.getDate()).slice(-2), mm=('0'+(d.getMonth()+1)).slice(-2); return dd+'.'+mm+'.'+d.getFullYear(); }
  return s;
}
function makeVeidneFileName(rec){
  var name=String((rec&&rec.klients)||'Klients').replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'') || 'Klients';
  var d=fmtVeidneDate((rec&&rec.datums)||''); if(!d){ var dt=new Date(); d=('0'+dt.getDate()).slice(-2)+'.'+('0'+(dt.getMonth()+1)).slice(-2)+'.'+dt.getFullYear(); }
  return name+'_Nodarbibas_veidne_'+d+'.xlsx';
}

async function initHist(){
  requireUser();
  var errs=[];
  try{
    await Promise.all([
      loadKlienti().catch(function(e){ errs.push('klienti: '+(e&&(e.reason||e.message)||String(e))); }),
      loadNodarbibas().catch(function(e){ errs.push('nodarbības: '+(e&&(e.reason||e.message)||String(e))); })
    ]);
    renderClients();
    renderHist();
    if(errs.length){ var pm=byId('pageMsg'); if(pm){ pm.textContent='Daļa datu netika ielādēta ('+errs.join('; ')+').'; pm.style.display='block'; } }
  }catch(e){
    var pm2=byId('pageMsg'); if(pm2){ pm2.textContent='Neizdevās ielādēt datus: '+(e&&(e.reason||e.message)||String(e)); pm2.style.display='block'; }
  }
  ['qClient','qWorker','qDate'].forEach(function(id){ var el=byId(id); if(el) el.addEventListener('input', renderHist); });
  var cf=byId('clearFilters'); if(cf) cf.addEventListener('click', function(){ byId('qClient').value=''; byId('qWorker').value=''; byId('qDate').value=''; _selectedClients.clear(); renderClients(); renderHist(); });
  var vc=byId('viewClose'); if(vc) vc.addEventListener('click', function(){ byId('viewModal').style.display='none'; });
  var ve=byId('viewExportBtn'); if(ve) ve.addEventListener('click', async function(){
    var r = window._currentViewRecord;
    if(!r){ alert('Nav ieraksta eksportam.'); return; }
    var btn = byId('viewExportBtn');
    try{
      if(btn){ btn.disabled = true; btn.textContent = 'Aizpilda veidni...'; }
      var res = await api('fillVeidne', r);
      if(res && res.ok && res.fileBase64){
        downloadBase64File(res.fileBase64, res.fileName || makeVeidneFileName(r), res.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else if(res && res.ok){
        alert('1:1 veidnes fails netika atgriezts lejupielādei.' + (res.exportWarning?(' Eksporta kļūda: '+res.exportWarning):'') + (res.err?(' '+res.err):'') + ' Iekopējiet jauno excel-veidne.gs tajā pašā Apps Script projektā kā code.gs un izdariet Deploy → New version. Ja vajag, ieslēdziet Advanced Google Service "Drive API".');
      } else {
        alert('Neizdevās aizpildīt/lejupielādēt veidni: ' + (res && (res.reason||res.err||res.exportWarning) || 'nezināma kļūda'));
      }
    }catch(e){
      alert('Servera kļūda, eksportējot veidni.');
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = 'Export uz Excel formu'; }
    }
  });
  var fc=byId('filterClients'); if(fc) fc.addEventListener('change', function(){ _selectedClients=new Set(Array.from(byId('filterClients').selectedOptions).map(function(o){ return o.value; })); renderClients(); renderHist(); });
  var esb=byId('exportSelectedBtn'); if(esb) esb.addEventListener('click', function(){ var data=_selectedClients.size? _hist.filter(function(r){ return _selectedClients.has(r.klients); }):_hist; exportNodarbibasToExcel(data, 'nodarbibu_klienti_'+new Date().toISOString().slice(0,10)+'.xlsx'); });
  var eeb=byId('exportExcelBtn'); if(eeb) eeb.addEventListener('click', function(){ exportNodarbibasToExcel(_hist, 'nodarbibu_visiem_'+new Date().toISOString().slice(0,10)+'.xlsx'); });
}

async function loadKlienti(){
  try{
    var res=await api('getKlienti');
    if(res && res.ok){ _klienti = res.klienti || []; }
    else { _klienti = []; throw (res || {reason:'nezināma kļūda'}); }
  }catch(e){ _klienti=[]; throw e; }
}
async function loadNodarbibas(){
  var res=await api('getNodarbibas');
  if(res && res.ok){ _hist=res.nodarbibas||[]; window._hist=_hist; }
  else { _hist=[]; window._hist=_hist; throw (res || {reason:'nezināma kļūda'}); }
}
function renderClients(){ var sel=byId('filterClients'); if(!sel) return; sel.innerHTML=''; (_klienti||[]).forEach(function(k){ var o=document.createElement('option'); o.value=k.vards||k.id||''; o.textContent=k.vards||k.id||''; if(_selectedClients.has(o.value)) o.selected=true; sel.appendChild(o); }); var el=byId('clientCount'); if(el) el.textContent=_selectedClients.size?'('+_selectedClients.size+' atlasīti)':'(visi)'; }
function renderHist(){ var qc=(byId('qClient').value||'').toLowerCase(), qw=(byId('qWorker').value||'').toLowerCase(), qd=(byId('qDate').value||'').trim(); var tb=byId('histBody'); if(!tb) return; tb.innerHTML='';
  _hist.filter(function(r){ return (!_selectedClients.size||_selectedClients.has(r.klients)) && (!qc||String(r.klients||'').toLowerCase().indexOf(qc)>=0) && (!qw||String(r.darbinieks||'').toLowerCase().indexOf(qw)>=0) && (!qd||String(r.datums||'').indexOf(qd)>=0); }).slice().reverse().forEach(function(r){
    var tr=document.createElement('tr'); tr.innerHTML='<td>'+esc(r.id)+'</td><td>'+esc(r.datums)+'</td><td>'+esc(r.klients)+'</td><td>'+esc(r.nodarbiba_nosaukums)+'</td><td>'+esc(r.darbinieks)+'</td><td><button class="btn btn-secondary" data-view="'+esc(r.id)+'">Skatīt</button></td>'; tb.appendChild(tr);
  }); if(!tb.children.length) tb.innerHTML='<tr><td colspan="6">Nav ierakstu.</td></tr>';
  tb.querySelectorAll('[data-view]').forEach(function(b){ b.addEventListener('click', function(){ var r=_hist.find(function(x){return String(x.id)===String(b.dataset.view);}); if(r) viewRec(r); }); });
}
function viewRec(r){ window._currentViewRecord = r; var fields=[['ID',r.id],['Datums',r.datums],['Klients',r.klients],['Darbinieks',r.darbinieks],['Nodarbība',r.nodarbiba_nosaukums],['Mērķis',r.merkis],['Problēma',r.problema],['Uzdevums',r.uzdevums],['Refleksija',r.refleksija],['Motivācija',r.motivacija],['Gaita',r.gaita],['Garastāvoklis',r.garastavoklis],['Vērtējums',r.vertejums],['Pildīts',r.pildits],['Komentārs',r.komentars]];
  var vb=byId('viewBody'); if(vb) vb.innerHTML=fields.map(function(f){ return '<div style="margin-bottom:10px"><div class="small muted">'+esc(f[0])+'</div><div>'+esc(f[1]||'-')+'</div></div>'; }).join(''); var vm=byId('viewModal'); if(vm) vm.style.display='flex'; }
document.addEventListener('DOMContentLoaded', function(){ if(byId('histBody')) initHist(); });
