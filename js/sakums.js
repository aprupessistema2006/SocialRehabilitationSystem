function loadSakums() {
  var user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  var msg = document.getElementById('sakumsMsg');
  if (!user.id) { window.location.href = '../index.html'; return; }
  if (typeof WEBAPP_URL === 'undefined') { if (msg) msg.textContent = 'Nav konfigurēts WEBAPP_URL.'; return; }
  fetch(WEBAPP_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: JSON.stringify({ action: 'getSakums', employee_id: user.id, access_password: ACCESS_PASSWORD }) })
  }).then(function(r){ return r.json(); }).then(function(res){
    if (!res.ok) { if (msg) msg.textContent = 'Kļūda ielādējot datus.'; return; }
    setText('statAktivie', res.aktivie);
    setText('statSodien', res.sodien);
    setText('statKopa', res.kopskaits);
    setText('statMani', res.mani);
    var tbody = document.getElementById('recentBody');
    if (tbody) {
      tbody.innerHTML = '';
      (res.ped || []).slice().reverse().forEach(function(rw){
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>'+esc(rw.datums)+'</td><td>'+esc(rw.klients)+'</td><td>'+esc(rw.nodarbiba)+'</td><td>'+esc(rw.darbinieks)+'</td><td><a class="table-link" href="nodarbibu-vesture.html">Skatīt</a></td>';
        tbody.appendChild(tr);
      });
      if (!(res.ped||[]).length) tbody.innerHTML = '<tr><td colspan="5">Nav ierakstu.</td></tr>';
    }
  }).catch(function(){ if (msg) msg.textContent = 'Neizdevās savienoties ar serveri.'; });
}
function setText(id, v){ var el=document.getElementById(id); if(el) el.textContent = (v==null?'0':v); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
document.addEventListener('DOMContentLoaded', loadSakums);
