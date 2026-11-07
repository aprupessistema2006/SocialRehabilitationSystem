function isToday(v){ var s=fmtDate(v); if(!s) return false; var d=new Date(); var dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0'); return s === (dd+'.'+mm+'.'+d.getFullYear()); }
function loadSakums() {
  var user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  var msg = document.getElementById('sakumsMsg');
  if (!user.id) { window.location.href = '../index.html'; return; }
  var token = getToken();
  if (!token) { window.location.href = '../index.html'; return; }
  if (typeof WEBAPP_URL === 'undefined') { if (msg) msg.textContent = 'Nav konfigurēts WEBAPP_URL.'; return; }
  Promise.all([
    fetch(WEBAPP_URL, { method:'POST', body:new URLSearchParams({ data: JSON.stringify({ action:'getSakums', employee_id:user.id, access_token:token }) }) }).then(function(r){return r.json();}),
    fetch(WEBAPP_URL, { method:'POST', body:new URLSearchParams({ data: JSON.stringify({ action:'getNodarbibas', access_token:token }) }) }).then(function(r){return r.json();}).catch(function(){return {ok:false};})
  ]).then(function(arr){
    var res=arr[0]||{}, nRes=arr[1]||{};
    if (!res.ok) { if (msg) msg.textContent = 'Kļūda ielādējot datus.'; return; }
    var list=(nRes.ok&&(nRes.nodarbibas||nRes.list)) ? (nRes.nodarbibas||nRes.list||[]) : null;
    var sodien = res.sodien||0, mani = res.mani||0;
    if(list){ sodien = list.filter(function(rw){ return isToday(rw.datums); }).length; mani = list.filter(function(rw){ return String(rw.employee_id||rw.darbinieks_id||'')===String(user.id||''); }).length; }
    setText('statAktivie', res.aktivie);
    setText('statSodien', sodien);
    setText('statKopa', res.kopskaits != null ? res.kopskaits : (list?list.length:0));
    setText('statMani', mani);
    var tbody = document.getElementById('recentBody');
    if (tbody) {
      tbody.innerHTML = '';
      var ped = list ? list.slice().sort(function(a,b){ return String(b.id||'').localeCompare(String(a.id||'')); }).slice(0,5) : (res.ped || []).slice().reverse();
      ped.forEach(function(rw){
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>'+esc(fmtDate(rw.datums))+'</td><td>'+esc(rw.klients)+'</td><td>'+esc(rw.nodarbiba||rw.nodarbiba_nosaukums)+'</td><td>'+esc(rw.darbinieks)+'</td><td><a class="table-link" href="nodarbibu-vesture.html">Skatīt</a></td>';
        tbody.appendChild(tr);
      });
      if (!ped.length) tbody.innerHTML = '<tr><td colspan="5">Nav ierakstu.</td></tr>';
    }
  }).catch(function(){ if (msg) msg.textContent = 'Neizdevās savienoties ar serveri.'; });
}
function setText(id, v){ var el=document.getElementById(id); if(el) el.textContent = (v==null?'0':v); }
function fmtDate(v){ if(!v) return ''; var s=String(v); if(/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s; var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return m[3]+'.'+m[2]+'.'+m[1]; var d=new Date(s); if(!isNaN(d)){ var dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0'); return dd+'.'+mm+'.'+d.getFullYear(); } return s; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
document.addEventListener('DOMContentLoaded', loadSakums);
