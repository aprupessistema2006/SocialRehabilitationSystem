var _cpState = {
  clients: [],
  sessions: [],
  selectedId: null,
  selectedSessions: [],
  filteredSessions: [],
  ready: false
};

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

async function initClientProfile(){
  requireUser();
  bindProfileUi();
  setProfileMsg('', '');

  var params = new URLSearchParams(location.search);
  _cpState.selectedId = params.get('id');

  setPickerMeta('Ielādē klientu sarakstu...');
  try {
    var results = await Promise.all([api('getKlienti'), api('getNodarbibas')]);
    var kRes = results[0] || {};
    var nRes = results[1] || {};
    _cpState.clients = Array.isArray(kRes.klienti) ? kRes.klienti.slice() : [];
    _cpState.sessions = Array.isArray(nRes.nodarbibas) ? nRes.nodarbibas.slice() : [];
    _cpState.clients.sort(function(a, b){
      return String(a.vards || a.name || '').localeCompare(String(b.vards || b.name || ''), 'lv');
    });
    _cpState.ready = true;
  } catch (e) {
    _cpState.clients = [];
    _cpState.sessions = [];
    setPickerMeta('Neizdevās ielādēt datus. Pārbaudiet savienojumu un mēģiniet vēlreiz.');
    renderClientPicker();
    renderProfileView();
    setProfileMsg('Neizdevās ielādēt klientus vai nodarbības.', 'error');
    return;
  }

  renderClientPicker();
  renderProfileView();

  window.addEventListener('popstate', function(){
    var p = new URLSearchParams(location.search);
    _cpState.selectedId = p.get('id');
    renderClientPicker();
    renderProfileView();
  });
}

function bindProfileUi(){
  var search = byId('profileClientSearch');
  var status = byId('profileClientStatus');
  var histSearch = byId('profileHistorySearch');
  var toggle = byId('togglePickerBtn');
  var exportFiltered = byId('profileExportFilteredBtn');
  var exportAll = byId('profileExportAllBtn');
  if (search) search.addEventListener('input', renderClientPicker);
  if (status) status.addEventListener('change', renderClientPicker);
  if (histSearch) histSearch.addEventListener('input', function(){ renderHistory(_cpState.selectedSessions); });
  if (toggle) toggle.addEventListener('click', function(){
    var body = byId('profilePickerBody');
    var expanded = toggle.getAttribute('aria-expanded') !== 'false';
    if (body) body.style.display = expanded ? 'none' : '';
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    toggle.textContent = expanded ? 'Rādīt sarakstu' : 'Paslēpt sarakstu';
  });
  if (exportFiltered) exportFiltered.addEventListener('click', function(){ exportSessions(_cpState.filteredSessions, true); });
  if (exportAll) exportAll.addEventListener('click', function(){ exportSessions(_cpState.selectedSessions, false); });
}

function renderClientPicker(){
  var list = byId('profileClientList');
  if (!list) return;
  var q = (byId('profileClientSearch') && byId('profileClientSearch').value || '').toLowerCase().trim();
  var st = (byId('profileClientStatus') && byId('profileClientStatus').value) || '';

  var filtered = _cpState.clients.filter(function(c){
    var name = String(c.vards || c.name || '').toLowerCase();
    var id = String(c.id == null ? '' : c.id).toLowerCase();
    var status = String(c.statuss || '');
    var matchQ = !q || name.indexOf(q) >= 0 || id.indexOf(q) >= 0;
    var matchSt = !st || status === st;
    return matchQ && matchSt;
  });

  list.innerHTML = '';
  if (!_cpState.ready) {
    list.innerHTML = '<div class="profile-empty">Ielādē klientus...</div>';
  } else if (!filtered.length) {
    list.innerHTML = '<div class="profile-empty">Neviens klients neatbilst meklēšanai. Pamēģiniet mainīt filtrus.</div>';
  } else {
    for (var i = 0; i < filtered.length; i++) {
      list.appendChild(buildClientItem(filtered[i]));
    }
  }

  var total = _cpState.clients.length;
  var shown = filtered.length;
  var sel = getSelectedClient();
  var meta = 'Atrasti ' + shown + ' no ' + total + ' klientiem.';
  if (sel) meta += ' Izvēlēts: ' + displayClientName(sel) + '.';
  setPickerMeta(meta);
}

function buildClientItem(c){
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'profile-client-item' + (String(c.id) === String(_cpState.selectedId) ? ' is-active' : '');
  btn.setAttribute('role', 'option');
  btn.setAttribute('aria-selected', String(c.id) === String(_cpState.selectedId) ? 'true' : 'false');

  var name = document.createElement('span');
  name.className = 'profile-client-name';
  name.textContent = displayClientName(c);

  var meta = document.createElement('span');
  meta.className = 'profile-client-meta';
  var status = c.statuss == null || c.statuss === '' ? '-' : String(c.statuss);
  var badge = document.createElement('span');
  badge.className = 'badge ' + (status.toLowerCase().indexOf('akt') === 0 ? 'badge-ok' : 'badge-off');
  badge.textContent = status;
  var idText = document.createElement('span');
  idText.textContent = 'ID: ' + (c.id == null ? '-' : c.id);
  meta.appendChild(badge);
  meta.appendChild(idText);

  btn.appendChild(name);
  btn.appendChild(meta);
  btn.addEventListener('click', function(){ selectClient(c.id); });
  return btn;
}

function selectClient(id){
  _cpState.selectedId = id == null ? null : String(id);
  var url = new URL(location.href);
  if (_cpState.selectedId) url.searchParams.set('id', _cpState.selectedId);
  else url.searchParams.delete('id');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  renderClientPicker();
  renderProfileView();
  var content = byId('profileContent');
  if (content && !content.hidden) {
    try { content.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
  }
}

function getSelectedClient(){
  if (!_cpState.selectedId) return null;
  for (var i = 0; i < _cpState.clients.length; i++) {
    if (String(_cpState.clients[i].id) === String(_cpState.selectedId)) return _cpState.clients[i];
  }
  return null;
}

function renderProfileView(){
  var content = byId('profileContent');
  var title = byId('clientTitle');
  if (!content || !title) return;

  var c = getSelectedClient();
  if (!_cpState.selectedId) {
    content.hidden = true;
    title.textContent = 'Klienta profils';
    _cpState.selectedSessions = [];
    _cpState.filteredSessions = [];
    setProfileMsg('', '');
    return;
  }
  if (!c) {
    content.hidden = true;
    title.textContent = 'Klienta profils';
    _cpState.selectedSessions = [];
    _cpState.filteredSessions = [];
    setProfileMsg('Klients ar norādīto ID nav atrasts. Izvēlieties klientu no saraksta augstāk.', 'error');
    return;
  }

  content.hidden = false;
  setProfileMsg('', '');

  var name = displayClientName(c);
  title.textContent = name;
  var sessions = getSessionsForClient(c);
  sessions.sort(function(a, b){ return String(b.datums || '').localeCompare(String(a.datums || '')); });
  _cpState.selectedSessions = sessions;
  var hs = byId('profileHistorySearch'); if (hs) hs.value = '';

  renderHero(c, sessions);
  renderInfo(c, sessions);
  renderHistory(sessions);
}

function getSessionsForClient(c){
  var name = String(displayClientName(c)).trim();
  var id = String(c.id);
  var out = [];
  for (var i = 0; i < _cpState.sessions.length; i++) {
    var n = _cpState.sessions[i];
    var match = false;
    if (n.klienta_id != null && String(n.klienta_id) === id) match = true;
    else if (n.client_id != null && String(n.client_id) === id) match = true;
    else {
      var nk = String(n.klients || '').trim();
      if (name && nk && (nk === name || nk.indexOf(name) >= 0)) match = true;
    }
    if (match) out.push(n);
  }
  return out;
}

function renderHero(c, sessions){
  var name = displayClientName(c);
  var statusText = c.statuss == null || c.statuss === '' ? '-' : String(c.statuss);
  var active = statusText.toLowerCase().indexOf('akt') === 0;

  var avatar = byId('profileAvatar');
  var nameEl = byId('profileName');
  var badge = byId('profileStatusBadge');
  var meta = byId('profileHeroMeta');
  var stats = byId('profileStats');

  if (avatar) avatar.textContent = initials(name);
  if (nameEl) nameEl.textContent = name;
  if (badge) {
    badge.textContent = statusText;
    badge.className = 'badge ' + (active ? 'badge-ok' : 'badge-off');
  }
  if (meta) meta.textContent = 'Klienta ID: ' + (c.id == null ? '-' : c.id) + ' · Ieraksti sistēmā: ' + sessions.length;

  var lastDate = sessions.length ? (sessions[0].datums || '-') : '—';
  var workers = {};
  for (var i = 0; i < sessions.length; i++) {
    var w = String(sessions[i].darbinieks || '').trim();
    if (w) workers[w] = true;
  }
  var workerCount = Object.keys(workers).length;

  if (stats) {
    stats.innerHTML =
      statBox('Nodarbības', String(sessions.length)) +
      statBox('Pēdējā', esc(lastDate)) +
      statBox('Darbinieki', String(workerCount));
  }
}

function renderInfo(c, sessions){
  var info = byId('clientInfo');
  if (!info) return;
  var name = displayClientName(c);
  var statusText = c.statuss == null || c.statuss === '' ? '-' : String(c.statuss);
  var statusClass = statusText.toLowerCase().indexOf('akt') === 0 ? 'badge-ok' : 'badge-off';
  var notes = c.piezimes || c.notes || '';
  var last = sessions.length ? (sessions[0].datums || '-') : '-';

  info.innerHTML =
    '<div class="profile-info-grid">' +
      infoItem('Vārds, uzvārds', esc(name)) +
      infoItem('Klienta ID', esc(c.id == null ? '-' : c.id)) +
      infoItem('Statuss', '<span class="badge ' + statusClass + '">' + esc(statusText) + '</span>') +
      infoItem('Nodarbību skaits', esc(String(sessions.length))) +
      infoItem('Pēdējā nodarbība', esc(last)) +
    '</div>' +
    '<div class="profile-notes"><div class="profile-info-item-label">Piezīmes</div><div class="profile-info-item-value">' + (notes ? esc(notes) : '—') + '</div></div>';
}

function renderHistory(sessions){
  var hist = byId('clientHist');
  var searchEl = byId('profileHistorySearch');
  if (!hist) return;
  var q = (searchEl && searchEl.value || '').toLowerCase().trim();
  var rows = sessions || [];
  if (q) {
    rows = rows.filter(function(s){
      var hay = [s.datums, s.nodarbiba_nosaukums, s.nodarbiba, s.darbinieks, s.id].map(function(v){ return String(v == null ? '' : v).toLowerCase(); }).join(' ');
      return hay.indexOf(q) >= 0;
    });
  }
  _cpState.filteredSessions = rows.slice();

  hist.innerHTML = '';
  if (!(sessions || []).length) {
    hist.innerHTML = '<tr><td colspan="5">Šim klientam vēl nav reģistrētu nodarbību.</td></tr>';
    updateExportButtons();
    return;
  }
  if (!rows.length) {
    hist.innerHTML = '<tr><td colspan="5">Meklēšanai atbilstošu ierakstu nav.</td></tr>';
    updateExportButtons();
    return;
  }
  for (var i = 0; i < rows.length; i++) {
    (function(s){
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + esc(s.datums || '-') + '</td><td>' + esc(s.nodarbiba_nosaukums || s.nodarbiba || '-') + '</td><td>' + esc(s.darbinieks || '-') + '</td><td>' + esc(s.id || '-') + '</td>';
      var td = document.createElement('td');
      td.className = 'profile-row-actions';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary btn-sm';
      btn.textContent = 'Lejupielādēt';
      btn.title = 'Lejupielādēt šī ieraksta Excel veidni';
      btn.addEventListener('click', function(){ downloadSingleSession(s, btn); });
      td.appendChild(btn);
      tr.appendChild(td);
      hist.appendChild(tr);
    })(rows[i]);
  }
  updateExportButtons();
}

function updateExportButtons(){
  var bF = byId('profileExportFilteredBtn');
  var bA = byId('profileExportAllBtn');
  var hasAll = (_cpState.selectedSessions || []).length > 0;
  var hasFiltered = (_cpState.filteredSessions || []).length > 0;
  if (bA) bA.disabled = !hasAll;
  if (bF) bF.disabled = !hasFiltered;
}

async function downloadSingleSession(rec, btn){
  if (!rec) return;
  var old = btn ? btn.textContent : '';
  try{
    if (btn){ btn.disabled = true; btn.textContent = '...'; }
    var res = await api('fillVeidne', rec);
    if(res && res.ok && res.fileBase64){
      downloadBase64File(res.fileBase64, res.fileName || makeVeidneFileName(rec), res.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      setProfileMsg('Veidne lejupielādēta: ' + (res.fileName || makeVeidneFileName(rec)), 'ok');
    } else if(res && res.ok){
      setProfileMsg('Veidnes fails netika atgriezts lejupielādei.', 'error');
    } else {
      setProfileMsg('Neizdevās lejupielādēt veidni: ' + (res && (res.reason||res.err||res.exportWarning) || 'nezināma kļūda'), 'error');
    }
  }catch(e){
    setProfileMsg('Servera kļūda, lejupielādējot veidni.', 'error');
  }finally{
    if (btn){ btn.disabled = false; btn.textContent = old || 'Lejupielādēt'; }
  }
}

function exportSessions(list, isFiltered){
  var data = (list || []).slice();
  if (!data.length){
    setProfileMsg(isFiltered ? 'Nav ierakstu, ko lejupielādēt (pārbaudiet filtru).' : 'Šim klientam nav nodarbību lejupielādei.', 'error');
    return;
  }
  var c = getSelectedClient();
  var base = (c ? displayClientName(c) : 'klients').replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,'_');
  var suffix = isFiltered ? '_filtretie' : '_visi';
  var fname = base + '_nodarbibas' + suffix + '_' + new Date().toISOString().slice(0,10) + '.xlsx';
  if (typeof exportNodarbibasToExcel === 'function') {
    exportNodarbibasToExcel(data, fname);
    setProfileMsg('Eksports sagatavots: ' + data.length + ' ieraksts(-i).', 'ok');
  } else {
    setProfileMsg('Eksporta funkcija nav pieejama.', 'error');
  }
}

function statBox(label, valueHtml){
  return '<div class="profile-stat"><div class="profile-stat-label">' + esc(label) + '</div><div class="profile-stat-value">' + valueHtml + '</div></div>';
}

function infoItem(label, valueHtml){
  return '<div><div class="profile-info-item-label">' + esc(label) + '</div><div class="profile-info-item-value">' + valueHtml + '</div></div>';
}

function displayClientName(c){
  return c && (c.vards || c.name) ? String(c.vards || c.name) : ('Klients #' + (c ? c.id : ''));
}

function initials(name){
  var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  var a = parts[0].charAt(0) || '';
  var b = parts.length > 1 ? (parts[parts.length - 1].charAt(0) || '') : (parts[0].charAt(1) || '');
  return (a + b).toUpperCase() || '?';
}

function setPickerMeta(text){
  var el = byId('profilePickerMeta');
  if (el) el.textContent = text || '';
}

function setProfileMsg(text, type){
  var el = byId('pageMsg');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = type === 'error' ? '#fda4af' : (type === 'ok' ? '#86efac' : '#fbcfe8');
}

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

document.addEventListener('DOMContentLoaded', function(){ if (byId('profilePickerCard')) initClientProfile(); });
