async function initClientProfile(){
  requireUser();
  var params = new URLSearchParams(location.search);
  var id = params.get('id');
  var info = byId('clientInfo');
  var hist = byId('clientHist');
  var msg = byId('pageMsg');
  var title = byId('clientTitle');
  if (msg) msg.textContent = '';

  if (!id) {
    if (title) title.textContent = 'Klienta profils';
    if (info) info.innerHTML = '<p>Nav izvēlēts klients. <a class="table-link" href="klienti.html">Atveriet klientu sarakstu</a> un izvēlieties konkrētu profilu.</p>';
    if (hist) hist.innerHTML = '<tr><td colspan="4">Nav datu — klients nav izvēlēts.</td></tr>';
    return;
  }

  if (info) info.innerHTML = '<p>Ielādē informāciju...</p>';
  if (hist) hist.innerHTML = '<tr><td colspan="4">Ielādē nodarbību vēsturi...</td></tr>';

  try {
    var results = await Promise.all([api('getKlienti'), api('getNodarbibas')]);
    var kRes = results[0] || {};
    var nRes = results[1] || {};
    var klienti = kRes.klienti || [];
    var nodarbibas = nRes.nodarbibas || [];
    var c = null;
    for (var i = 0; i < klienti.length; i++) {
      if (String(klienti[i].id) === String(id)) { c = klienti[i]; break; }
    }

    if (!c) {
      if (title) title.textContent = 'Klienta profils';
      if (info) info.innerHTML = '<p>Klients ar norādīto ID nav atrasts. <a class="table-link" href="klienti.html">Atgriezties uz klientu sarakstu</a>.</p>';
      if (hist) hist.innerHTML = '<tr><td colspan="4">Nav pieejamas vēstures.</td></tr>';
      return;
    }

    var name = c.vards || c.name || ('Klients #' + c.id);
    if (title) title.textContent = name;

    var sessions = [];
    for (var j = 0; j < nodarbibas.length; j++) {
      var n = nodarbibas[j];
      var match = false;
      if (n.klienta_id != null && String(n.klienta_id) === String(c.id)) match = true;
      else if (n.client_id != null && String(n.client_id) === String(c.id)) match = true;
      else {
        var nk = String(n.klients || '').trim();
        var cv = String(name).trim();
        if (cv && nk && (nk === cv || nk.indexOf(cv) >= 0)) match = true;
      }
      if (match) sessions.push(n);
    }
    sessions.sort(function(a, b){ return String(b.datums || '').localeCompare(String(a.datums || '')); });

    var statusText = c.statuss == null || c.statuss === '' ? '-' : String(c.statuss);
    var statusClass = statusText.toLowerCase().indexOf('akt') === 0 ? 'badge-ok' : 'badge-off';
    var notes = c.piezimes || c.notes || '';

    if (info) {
      info.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px 20px;">' +
          infoItem('Vārds, uzvārds', esc(name)) +
          infoItem('Klienta ID', esc(c.id)) +
          infoItem('Statuss', '<span class="badge ' + statusClass + '">' + esc(statusText) + '</span>') +
          infoItem('Nodarbību skaits', esc(String(sessions.length))) +
        '</div>' +
        '<div style="margin-top:14px;"><div style="font-size:12px;color:var(--muted,#94a3b8);margin-bottom:4px;">Piezīmes</div><div>' + (notes ? esc(notes) : '—') + '</div></div>';
    }

    if (hist) {
      hist.innerHTML = '';
      if (!sessions.length) {
        hist.innerHTML = '<tr><td colspan="4">Šim klientam vēl nav reģistrētu nodarbību.</td></tr>';
      } else {
        for (var k = 0; k < sessions.length; k++) {
          var s = sessions[k];
          var tr = document.createElement('tr');
          tr.innerHTML = '<td>' + esc(s.datums || '-') + '</td><td>' + esc(s.nodarbiba_nosaukums || s.nodarbiba || '-') + '</td><td>' + esc(s.darbinieks || '-') + '</td><td>' + esc(s.id || '-') + '</td>';
          hist.appendChild(tr);
        }
      }
    }
  } catch (e) {
    if (info) info.innerHTML = '<p>Neizdevās ielādēt klienta datus. Mēģiniet vēlreiz vai pārbaudiet savienojumu.</p>';
    if (hist) hist.innerHTML = '<tr><td colspan="4">Vēsture nav pieejama.</td></tr>';
  }
}

function infoItem(label, valueHtml){
  return '<div><div style="font-size:12px;color:var(--muted,#94a3b8);margin-bottom:4px;">' + esc(label) + '</div><div style="font-weight:600;">' + valueHtml + '</div></div>';
}

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

document.addEventListener('DOMContentLoaded', function(){ if (byId('clientHist')) initClientProfile(); });
