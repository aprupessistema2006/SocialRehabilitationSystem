async function initClientProfile(){ requireUser(); var id=new URLSearchParams(location.search).get('id');
  try{ var [kRes,nRes]=await Promise.all([api('getKlienti'), api('getNodarbibas')]); var c=(kRes.klienti||[]).find(function(x){return String(x.id)===String(id);});
    if(!c){ byId('pageMsg').textContent='Klients nav atrasts.'; return; }
    byId('clientTitle').textContent=c.vards; byId('clientInfo').innerHTML='<div><b>ID:</b> '+esc(c.id)+'</div><div><b>Statuss:</b> '+esc(c.statuss)+'</div><div><b>Piezīmes:</b> '+esc(c.piezimes||'-')+'</div>';
    var tb=byId('clientHist'); tb.innerHTML=''; (nRes.nodarbibas||[]).filter(function(n){return String(n.klients)===String(c.vards)||String(n.klients).indexOf(String(c.vards))>=0;}).slice().reverse().forEach(function(n){ var tr=document.createElement('tr'); tr.innerHTML='<td>'+esc(n.datums)+'</td><td>'+esc(n.nodarbiba_nosaukums)+'</td><td>'+esc(n.darbinieks)+'</td><td>'+esc(n.id)+'</td>'; tb.appendChild(tr); });
    if(!tb.children.length) tb.innerHTML='<tr><td colspan="4">Nav nodarbību.</td></tr>';
  }catch(e){ byId('pageMsg').textContent='Neizdevās ielādēt profilu.'; }
}
document.addEventListener('DOMContentLoaded', function(){ if(byId('clientHist')) initClientProfile(); });
