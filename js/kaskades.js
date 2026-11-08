/* Kaskādes — vizuāls līmeņu navigators: NV → Mērķis → Problēma → Uzdevums */
var K = { nv: [], m: [], p: [], u: [], byId: {}, sel: { nv: null, m: null, p: null, u: null }, q: '', activeOnly: false };
var EDIT = { id: null, key: null };
var ADD = { key: null, parentId: null };

var LVL = {
  nv: { key: 'nv', type: 'NV', label: 'Nodarbības veids', short: 'NV', prop: null, parentKey: null, childKey: 'm', list: 'nodarbibu_veidi', save: 'saveNodarbibasVeids' },
  m:  { key: 'm',  type: 'M',  label: 'Mērķis',          short: 'M',  prop: 'nv_id',      parentKey: 'nv', childKey: 'p', list: 'merki',           save: 'saveMerkis' },
  p:  { key: 'p',  type: 'P',  label: 'Problēma',        short: 'P',  prop: 'merkis_id',  parentKey: 'm',  childKey: 'u', list: 'problemas',       save: 'saveProblema' },
  u:  { key: 'u',  type: 'U',  label: 'Uzdevums',         short: 'U',  prop: 'problema_id',parentKey: 'p',  childKey: null, list: 'uzdevumi',       save: 'saveUzdevums' }
};
var ORDER = ['nv', 'm', 'p', 'u'];

function normTxt(s){
  return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[ā]/g, 'a').replace(/[č]/g, 'c').replace(/[ē]/g, 'e').replace(/[ģ]/g, 'g').replace(/[ī]/g, 'i')
    .replace(/[ķ]/g, 'k').replace(/[ļ]/g, 'l').replace(/[ņ]/g, 'n').replace(/[š]/g, 's').replace(/[ū]/g, 'u').replace(/[ž]/g, 'z')
    .replace(/\s+/g, ' ').trim();
}
function matches(n, q){
  if (!q) return true;
  var hay = normTxt(n.name) + ' ' + normTxt(n.id);
  var words = normTxt(q).split(' ').filter(Boolean);
  for (var i = 0; i < words.length; i++) { if (hay.indexOf(words[i]) === -1) return false; }
  return true;
}
function isAktiv(v){ return String(v).toUpperCase() !== 'FALSE' && v !== false && v !== 0 && v !== '0'; }
function msg(t){ var e = byId('pageMsg'); if (e) e.textContent = t || ''; }

async function initKaskades(){
  var u = requireUser();
  if (u.role !== 'ADMIN') { byId('adminWarn').style.display = 'block'; byId('kascadeWrap').style.display = 'none'; return; }
  byId('reloadK').addEventListener('click', loadK);
  byId('addRootBtn').addEventListener('click', function(){ openAdd('nv', null); });
  var search = byId('kascadeSearch');
  if (search) {
    search.addEventListener('input', function(){ K.q = this.value || ''; renderSearchResults(); renderAll(); });
    search.addEventListener('focus', function(){ renderSearchResults(); });
  }
  document.addEventListener('click', function(e){
    var box = byId('searchResults'), wrap = document.querySelector('.k-search-wrap');
    if (box && wrap && !wrap.contains(e.target)) box.hidden = true;
  });
  var activeOnly = byId('kascadeActiveOnly');
  if (activeOnly) activeOnly.addEventListener('change', function(){ K.activeOnly = this.checked; renderSearchResults(); renderAll(); });
  document.querySelectorAll('.k-add-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ var key = btn.getAttribute('data-add'); requestAdd(key); });
  });
  initModals();
  await loadK();
}

async function loadK(){
  msg('Ielādē kaskādi…');
  try {
    var res = await api('getKaskade');
    var ok = res && (res.ok === true || res.nodarbibu_veidi || res.merki);
    K.nv = ((ok && res.nodarbibu_veidi) || []).map(function(x){ return { id: x.id, name: x.nosaukums || '', aktiv: isAktiv(x.aktivs), parentId: null, key: 'nv' }; });
    K.m  = ((ok && res.merki) || []).map(function(x){ return { id: x.id, name: x.nosaukums || '', aktiv: isAktiv(x.aktivs), parentId: x.nv_id || null, key: 'm' }; });
    K.p  = ((ok && res.problemas) || []).map(function(x){ return { id: x.id, name: x.nosaukums || '', aktiv: isAktiv(x.aktivs), parentId: x.merkis_id || null, key: 'p' }; });
    K.u  = ((ok && res.uzdevumi) || []).map(function(x){ return { id: x.id, name: x.nosaukums || '', aktiv: isAktiv(x.aktivs), parentId: x.problema_id || null, key: 'u' }; });
    rebuildIndex();
    validateSelection();
    renderAll();
    msg(ok ? '' : 'Kaskādes dati nav ielādēti. Pārbaudiet savienojumu vai Apps Script izvietojumu.');
  } catch (e) {
    rebuildIndex(); renderAll();
    msg('Neizdevās ielādēt kaskādi.');
  }
}

function rebuildIndex(){
  K.byId = {};
  ORDER.forEach(function(key){ (K[key] || []).forEach(function(n){ K.byId[String(n.id)] = n; }); });
}
function getNode(id){ return id == null ? null : (K.byId[String(id)] || null); }
function childrenOf(key, parentId){
  var arr = K[key] || [];
  if (key === 'nv') return arr.slice();
  return arr.filter(function(n){ return String(n.parentId) === String(parentId); });
}
function sortNodes(a, b){
  if (a.aktiv !== b.aktiv) return a.aktiv ? -1 : 1;
  var an = String(a.name || ''), bn = String(b.name || '');
  return an.localeCompare(bn, 'lv', { sensitivity: 'base' }) || String(a.id).localeCompare(String(b.id));
}
function visible(list){
  var q = K.q || '';
  return list.filter(function(n){
    if (K.activeOnly && !n.aktiv) return false;
    if (q && !matches(n, q)) return false;
    return true;
  }).sort(sortNodes);
}
function countChildren(key, parentId){
  if (!LVL[key].childKey) return 0;
  var ck = LVL[key].childKey;
  return childrenOf(ck, parentId).filter(function(n){ return !K.activeOnly || n.aktiv; }).length;
}

function validateSelection(){
  ORDER.forEach(function(key, i){
    var id = K.sel[key];
    if (!id) return;
    var n = getNode(id);
    if (!n || n.key !== key) { clearSelFrom(key, true); return; }
    if (key !== 'nv') {
      var pk = LVL[key].parentKey;
      if (String(n.parentId) !== String(K.sel[pk] || '')) clearSelFrom(key, true);
    }
  });
}
function clearSelFrom(key, include){
  var idx = ORDER.indexOf(key);
  if (idx < 0) return;
  for (var i = include ? idx : idx + 1; i < ORDER.length; i++) K.sel[ORDER[i]] = null;
}

function selectNode(key, id, opts){
  opts = opts || {};
  K.sel[key] = id;
  clearSelFrom(key, false);
  renderAll();
  if (!opts.noScroll) scrollColIntoView(LVL[key].childKey || key);
  renderDetail(key, id);
}
function scrollColIntoView(key){
  if (!key) return;
  var col = document.querySelector('.k-col[data-col="' + key + '"]');
  if (col && col.scrollIntoView) { try { col.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); } catch (e) {} }
}

function renderAll(){
  renderPath();
  ORDER.forEach(renderCol);
  updateAddButtons();
}
function updateAddButtons(){
  document.querySelectorAll('.k-add-btn').forEach(function(btn){
    var key = btn.getAttribute('data-add');
    var L = LVL[key];
    btn.disabled = !!(L.parentKey && !K.sel[L.parentKey]);
  });
}
function requestAdd(key){
  var L = LVL[key];
  if (!L) return;
  if (!L.parentKey) { openAdd(key, null); return; }
  var pid = K.sel[L.parentKey];
  if (!pid) { msg('Vispirms izvēlieties ' + LVL[L.parentKey].label.toLowerCase() + '.'); scrollColIntoView(L.parentKey); return; }
  openAdd(key, pid);
}

function renderCol(key){
  var body = byId('col-' + key);
  var countEl = byId('count-' + key);
  if (!body) return;
  var L = LVL[key];
  var list = [];
  if (!L.parentKey) {
    list = visible(K.nv);
  } else {
    var pid = K.sel[L.parentKey];
    if (!pid) {
      body.innerHTML = '<div class="k-placeholder">← Izvēlieties ' + esc(LVL[L.parentKey].label.toLowerCase()) + '</div>';
      if (countEl) countEl.textContent = '—';
      return;
    }
    list = visible(childrenOf(key, pid));
  }
  if (countEl) countEl.textContent = String(list.length);
  if (!list.length) {
    var parent = L.parentKey ? getNode(K.sel[L.parentKey]) : null;
    var hint = !L.parentKey
      ? 'Nav nodarbību veidu. Pievienojiet pirmo.'
      : 'Šim elementam nav ' + esc(L.label.toLowerCase()) + (L.childKey === null ? 'u' : 'u') + '. Pievienojiet jaunu.';
    if (L.key === 'm') hint = 'Šim nodarbības veidam nav mērķu. Nospiediet +, lai pievienotu.';
    if (L.key === 'p') hint = 'Šim mērķim nav problēmu. Nospiediet +, lai pievienotu.';
    if (L.key === 'u') hint = 'Šai problēmai nav uzdevumu. Nospiediet +, lai pievienotu.';
    body.innerHTML = '<div class="k-empty"><b>Tukšs līmenis</b><div style="margin-top:6px;">' + hint + '</div></div>';
    return;
  }
  body.innerHTML = '';
  list.forEach(function(n){ body.appendChild(renderItem(key, n)); });
  var sel = K.sel[key];
  if (sel) {
    var el = body.querySelector('.k-item[data-id="' + CSS.escape(String(sel)) + '"]');
    if (el) { try { el.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
  }
}

function renderItem(key, n){
  var L = LVL[key];
  var selected = String(K.sel[key]) === String(n.id);
  var cc = countChildren(key, n.id);
  var wrap = document.createElement('div');
  wrap.className = 'k-item' + (selected ? ' is-selected' : '') + (n.aktiv ? '' : ' is-inactive');
  wrap.setAttribute('data-id', n.id);
  wrap.setAttribute('data-key', key);
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'button');
  wrap.setAttribute('aria-pressed', selected ? 'true' : 'false');
  var statusCls = n.aktiv ? 'k-status-ok' : 'k-status-off';
  var statusTxt = n.aktiv ? 'Aktīvs' : 'Neaktīvs';
  var childHtml = L.childKey ? '<span class="k-child-count" title="Apakšelementi nākamajā līmenī">' + cc + ' ' + esc(LVL[L.childKey].label.toLowerCase()) + '</span>' : '';
  wrap.innerHTML =
    '<div class="k-item-main">' +
      '<div class="k-item-top"><span class="k-id">' + esc(n.id) + '</span><span class="k-status ' + statusCls + '">' + statusTxt + '</span>' + childHtml + '</div>' +
      '<div class="k-item-name">' + esc(n.name) + '</div>' +
    '</div>' +
    '<div class="k-item-actions">' +
      '<button type="button" class="k-icon-btn" data-act="expand" title="Rādīt pilnu tekstu">⋯</button>' +
      '<button type="button" class="k-icon-btn" data-act="edit" title="Labot">✎</button>' +
      '<button type="button" class="k-icon-btn k-icon-btn-danger" data-act="del" title="Dzēst">×</button>' +
    '</div>';
  wrap.addEventListener('click', function(e){
    var act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
    if (act === 'edit') { e.stopPropagation(); openEdit(n.id, key); return; }
    if (act === 'del') { e.stopPropagation(); delItem(n.id, key); return; }
    if (act === 'expand') { e.stopPropagation(); wrap.classList.toggle('is-expanded'); renderDetail(key, n.id); return; }
    selectNode(key, n.id);
  });
  wrap.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectNode(key, n.id); }
  });
  return wrap;
}

function renderPath(){
  var el = byId('kPath');
  if (!el) return;
  var parts = [];
  ORDER.forEach(function(key){
    var id = K.sel[key];
    if (!id) return;
    var n = getNode(id);
    if (n) parts.push({ key: key, n: n });
  });
  if (!parts.length) {
    el.innerHTML = '<span class="k-path-label">Ceļš:</span><span class="k-path-empty">Nav izvēlēts neviens elements. Izvēlieties nodarbības veidu, lai redzētu tā mērķus, problēmas un uzdevumus.</span>';
    return;
  }
  var html = '<span class="k-path-label">Ceļš:</span>';
  parts.forEach(function(p, i){
    if (i > 0) html += '<span class="k-crumb-sep" aria-hidden="true">→</span>';
    html += '<button type="button" class="k-crumb" data-jump="' + esc(p.key) + '" data-id="' + esc(p.n.id) + '"><span class="k-crumb-lvl">' + esc(LVL[p.key].short) + '</span><span class="k-crumb-txt">' + esc(p.n.name) + '</span></button>';
  });
  html += '<button type="button" class="k-crumb" data-jump="clear" title="Notīrīt izvēli">× Notīrīt</button>';
  el.innerHTML = html;
  el.querySelectorAll('[data-jump]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var j = btn.getAttribute('data-jump');
      if (j === 'clear') { clearSelFrom('nv', true); renderAll(); renderDetail(null, null); return; }
      var id = btn.getAttribute('data-id');
      clearSelFrom(j, false);
      K.sel[j] = id;
      renderAll();
      renderDetail(j, id);
    });
  });
}

function renderDetail(key, id){
  var box = byId('kDetail');
  if (!box) return;
  var n = key && id ? getNode(id) : null;
  if (!n) { box.hidden = true; box.innerHTML = ''; return; }
  var chain = [];
  var cur = n;
  while (cur) { chain.unshift(cur); cur = cur.parentId ? getNode(cur.parentId) : null; }
  var meta = chain.map(function(x){ return LVL[x.key].short + ': ' + x.name; }).join(' → ');
  box.hidden = false;
  box.innerHTML =
    '<div class="k-detail-head"><div>' +
      '<div class="k-detail-title">Pilns teksts — ' + esc(LVL[n.key].label) + ' (' + esc(n.id) + ')</div>' +
      '<div class="k-detail-meta">' + esc(meta) + '</div>' +
    '</div><div class="k-item-actions">' +
      '<button type="button" class="k-icon-btn" data-dact="edit" title="Labot">✎</button>' +
      '<button type="button" class="k-icon-btn k-icon-btn-danger" data-dact="del" title="Dzēst">×</button>' +
    '</div></div>' +
    '<div class="k-detail-body">' + esc(n.name) + '</div>';
  box.querySelector('[data-dact="edit"]').addEventListener('click', function(){ openEdit(n.id, n.key); });
  box.querySelector('[data-dact="del"]').addEventListener('click', function(){ delItem(n.id, n.key); });
}

/* Search across whole cascade */
function renderSearchResults(){
  var box = byId('searchResults');
  var q = K.q || '';
  if (!box) return;
  if (!q || normTxt(q).length < 2) { box.hidden = true; box.innerHTML = ''; return; }
  var hits = [];
  ORDER.forEach(function(key){
    (K[key] || []).forEach(function(n){
      if (matches(n, q) && (!K.activeOnly || n.aktiv)) hits.push(n);
    });
  });
  hits.sort(function(a, b){
    var ak = ORDER.indexOf(a.key), bk = ORDER.indexOf(b.key);
    return ak - bk || sortNodes(a, b);
  });
  if (!hits.length) {
    box.hidden = false;
    box.innerHTML = '<div class="k-sr-empty">Nekas netika atrasts.</div>';
    return;
  }
  box.hidden = false;
  box.innerHTML = '';
  hits.slice(0, 40).forEach(function(n){
    var path = buildPathText(n);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'k-sr-item';
    btn.innerHTML = '<span class="k-sr-kind k-kind-' + n.key + '">' + esc(LVL[n.key].short) + '</span>' + esc(n.name) +
      (path ? '<span class="k-sr-path">' + esc(path) + '</span>' : '');
    btn.addEventListener('click', function(){ jumpToNode(n); byId('searchResults').hidden = true; });
    box.appendChild(btn);
  });
}
function buildPathText(n){
  var parts = [];
  var cur = n.parentId ? getNode(n.parentId) : null;
  while (cur) { parts.unshift(LVL[cur.key].short + ': ' + cur.name); cur = cur.parentId ? getNode(cur.parentId) : null; }
  return parts.join(' → ');
}
function jumpToNode(n){
  var chain = [];
  var cur = n;
  while (cur) { chain.unshift(cur); cur = cur.parentId ? getNode(cur.parentId) : null; }
  clearSelFrom('nv', true);
  chain.forEach(function(x){ K.sel[x.key] = x.id; });
  renderAll();
  renderDetail(n.key, n.id);
  scrollColIntoView(n.key);
}

/* Delete / Edit / Add */
function delItem(id, key){
  var n = getNode(id);
  if (!n) return;
  if (!confirm('Dzēst „' + n.name.slice(0, 80) + '” un visus tā apakšelementus?')) return;
  api('deleteKaskadeItem', { id: id, type: LVL[key].type }).then(function(res){
    if (res && res.ok) {
      msg('Dzēsts.');
      clearSelFrom(key, true);
      loadK();
    } else {
      msg('Neizdevās dzēst: ' + (res && res.reason ? res.reason : 'nezināma kļūda'));
    }
  }).catch(function(){ msg('Servera kļūda dzēšot.'); });
}

function openEdit(id, key){
  var n = getNode(id);
  if (!n) return;
  EDIT.id = id; EDIT.key = key;
  var L = LVL[key];
  byId('editModalTitle').textContent = 'Labot: ' + L.label + ' (' + n.id + ')';
  byId('editName').value = n.name || '';
  byId('editActive').value = n.aktiv ? 'true' : 'false';
  var pg = byId('editParentGroup');
  var ps = byId('editParent');
  if (!L.prop) {
    pg.style.display = 'none';
  } else {
    pg.style.display = 'block';
    fillParentSelect(ps, L.parentKey, n.parentId);
  }
  setModalMsg('editModalMsg', '', false, true);
  byId('editModal').style.display = 'flex';
  setTimeout(function(){ byId('editName').focus(); }, 40);
}

function openAdd(key, parentId){
  var L = LVL[key];
  if (!L) return;
  if (L.parentKey && !parentId) {
    msg('Vispirms izvēlieties ' + LVL[L.parentKey].label.toLowerCase() + '.');
    return;
  }
  ADD.key = key; ADD.parentId = parentId || null;
  byId('addModalTitle').textContent = 'Pievienot: ' + L.label;
  byId('addName').value = '';
  var ctx = byId('addContext');
  if (L.parentKey && parentId) {
    var p = getNode(parentId);
    ctx.style.display = 'block';
    ctx.innerHTML = 'Pievieno zem: <b>' + esc(LVL[L.parentKey].label) + '</b> — ' + esc(p ? p.name : parentId);
  } else {
    ctx.style.display = 'none';
    ctx.innerHTML = '';
  }
  var pg = byId('addParentGroup');
  var ps = byId('addParent');
  if (!L.prop) {
    pg.style.display = 'none';
  } else {
    pg.style.display = 'block';
    fillParentSelect(ps, L.parentKey, parentId);
  }
  setModalMsg('addModalMsg', '', false, true);
  byId('addModal').style.display = 'flex';
  setTimeout(function(){ byId('addName').focus(); }, 40);
}

function fillParentSelect(sel, parentKey, selectedId){
  sel.innerHTML = '';
  var opts = (K[parentKey] || []).slice().sort(sortNodes);
  opts.forEach(function(o){
    var opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = (o.aktiv ? '' : '[Neaktīvs] ') + o.name + ' (' + o.id + ')';
    if (String(o.id) === String(selectedId || '')) opt.selected = true;
    sel.appendChild(opt);
  });
}
function setModalMsg(id, text, err, hide){
  var e = byId(id); if (!e) return;
  e.textContent = text || '';
  e.className = 'alert ' + (err ? 'alert-error' : 'alert-success');
  e.style.display = hide || !text ? 'none' : 'block';
}

function initModals(){
  function close(id){ var m = byId(id); if (m) m.style.display = 'none'; }
  byId('editCancel').addEventListener('click', function(){ close('editModal'); });
  byId('addCancel').addEventListener('click', function(){ close('addModal'); });
  ['editModal', 'addModal'].forEach(function(id){
    var m = byId(id);
    if (m) m.addEventListener('click', function(e){ if (e.target === m) close(id); });
  });
  byId('editSave').addEventListener('click', function(){
    var name = String(byId('editName').value || '').trim();
    if (!name) { setModalMsg('editModalMsg', 'Nosaukums ir obligāts.', true); return; }
    var L = LVL[EDIT.key];
    var payload = { id: EDIT.id, nosaukums: name, aktivs: byId('editActive').value === 'true' };
    if (L.prop) payload[L.prop] = byId('editParent').value || '';
    api(L.save, payload).then(function(res){
      if (res && res.ok) { close('editModal'); msg('Saglabāts.'); loadK(); }
      else { setModalMsg('editModalMsg', 'Kļūda: ' + (res && res.reason ? res.reason : 'nezināma'), true); }
    }).catch(function(){ setModalMsg('editModalMsg', 'Servera kļūda.', true); });
  });
  byId('addSave').addEventListener('click', function(){
    var name = String(byId('addName').value || '').trim();
    if (!name) { setModalMsg('addModalMsg', 'Nosaukums ir obligāts.', true); return; }
    var L = LVL[ADD.key];
    var payload = { nosaukums: name, aktivs: true };
    if (L.prop) payload[L.prop] = byId('addParent').value || ADD.parentId || '';
    if (L.prop && !payload[L.prop]) { setModalMsg('addModalMsg', 'Jānorāda vecāks elements.', true); return; }
    api(L.save, payload).then(function(res){
      if (res && res.ok) {
        close('addModal'); msg('Pievienots.');
        loadK().then(function(){
          if (res.id) { if (ADD.key === 'nv') selectNode('nv', res.id); }
          renderAll();
        });
      } else { setModalMsg('addModalMsg', 'Kļūda: ' + (res && res.reason ? res.reason : 'nezināma'), true); }
    }).catch(function(){ setModalMsg('addModalMsg', 'Servera kļūda.', true); });
  });
}

document.addEventListener('DOMContentLoaded', function(){ if (byId('kBoard')) initKaskades(); });
