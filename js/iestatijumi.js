var CFG_KEYS = { vertejums: 'cfg_vertejums', garastavoklis: 'cfg_garastavoklis', gaita: 'cfg_gaita', refleksija: 'cfg_refleksija', motivacija: 'cfg_motivacija', pildits: 'cfg_pildits' };
var CFG_LABELS = { vertejums: 'Vērtējums (1–5)', garastavoklis: 'Klienta garastāvoklis', gaita: 'Nodarbības gaita', refleksija: 'Klienta refleksija', motivacija: 'Klienta motivācija', pildits: 'Pildības statuss' };
var CFG_DEFAULTS = {
  vertejums: [
    { id: '1', label: '1 – ļoti slikti', value: '1' },
    { id: '2', label: '2 – slikti', value: '2' },
    { id: '3', label: '3 – vidēji', value: '3' },
    { id: '4', label: '4 – labi', value: '4' },
    { id: '5', label: '5 – izcili', value: '5' }
  ],
  garastavoklis: [
    { id: 'm1', label: 'Normāls' },
    { id: 'm2', label: 'Pieņemams' },
    { id: 'm3', label: 'Jābūt uzmanīgam' }
  ],
  gaita: [
    { id: 'g1', label: 'Paceli jūtā' },
    { id: 'g2', label: 'Neutrāli' },
    { id: 'g3', label: 'Savākurbi' }
  ],
  refleksija: [
    { id: 'r1', label: 'Pozitīva' },
    { id: 'r2', label: 'Neutrāla' },
    { id: 'r3', label: 'Negatīva' }
  ],
  motivacija: [
    { id: 'mot1', label: 'Augsta' },
    { id: 'mot2', label: 'Vidēja' },
    { id: 'mot3', label: 'Zema' }
  ],
  pildits: [
    { id: 'yes', label: 'Jā', value: 'Jā' },
    { id: 'no', label: 'Nē', value: 'Nē' }
  ]
};
var CFG_STATE = { cat: 'vertejums', items: {}, editingId: null };

async function initSettings(){
  var u = requireUser();
  if(u.role !== 'ADMIN'){ byId('adminWarn').style.display = 'block'; byId('settingsWrap').style.display = 'none'; return; }
  try{
    var res = await api('getIestatijumi');
    var s = (res.ok && res.iestatijumi) || {};
    byId('setOrg').value = s.org || 'Sociālās aprūpes centrs';
    byId('setVer').value = s.version || '1.0';
    byId('setNote').value = s.note || '';

    Object.keys(CFG_KEYS).forEach(function(cat){
      var raw = s[CFG_KEYS[cat]];
      var arr = [];
      if(raw){
        try { arr = JSON.parse(raw); } catch(e) { arr = CFG_DEFAULTS[cat] || []; }
      }
      if(!arr.length) arr = CFG_DEFAULTS[cat] || [];
      CFG_STATE.items[cat] = arr;
      renderCfgList(cat);
    });
  }catch(e){}
  byId('saveSettings').addEventListener('click', async function(){
    try{
      var payload = {
        org: byId('setOrg').value,
        version: byId('setVer').value,
        note: byId('setNote').value
      };
      Object.keys(CFG_KEYS).forEach(function(cat){
        payload[CFG_KEYS[cat]] = JSON.stringify(CFG_STATE.items[cat] || []);
      });
      await api('saveIestatijumi', { iestatijumi: payload });
      byId('pageMsg').textContent = 'Saglabāts.';
    }catch(e){ byId('pageMsg').textContent = 'Kļūda.'; }
  });
  byId('seedSettings').addEventListener('click', async function(){
    byId('pageMsg').textContent = 'Ievieto testa datus...';
    try{ await api('seedTestData'); byId('pageMsg').textContent = 'Testa dati ievietoti (ja tabulas bija tukšas): 2 klienti, 2 darbinieki, kaskāde, 1 nodarbība.'; }catch(e){ byId('pageMsg').textContent = 'Kļūda.'; }
  });
  if (byId('sessionBar')) { updateSessionTimer(); setInterval(updateSessionTimer, 1000); }
  var extendBtn = byId('extendSession');
  if (extendBtn) {
    extendBtn.addEventListener('click', function(){
      try { localStorage.setItem(ACCESS_REMEMBER_KEY, String(Date.now())); } catch(e) {}
      updateSessionTimer();
      byId('pageMsg').textContent = 'Sesija atjaunināta.';
    });
  }
  initCfgTabs();
  initCfgModals();
}
document.addEventListener('DOMContentLoaded', function(){ if(byId('saveSettings')) initSettings(); });

function initCfgTabs(){
  document.querySelectorAll('.cfg-tab').forEach(function(btn){
    btn.addEventListener('click', function(){
      var cat = btn.getAttribute('data-cat');
      document.querySelectorAll('.cfg-tab').forEach(function(b){ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.cfg-tab-panel').forEach(function(p){ p.classList.remove('active'); });
      btn.classList.add('active'); btn.setAttribute('aria-selected','true');
      byId('cfg-panel-' + cat).classList.add('active');
      CFG_STATE.cat = cat;
      renderCfgList(cat);
    });
  });
  Object.keys(CFG_KEYS).forEach(function(cat){
    var addBtn = byId('cfgAdd' + cap(cat));
    if(addBtn){
      addBtn.addEventListener('click', function(){ openCfgModal(cat, null); });
    }
  });
}

function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

function renderCfgList(cat){
  var list = byId('cfgList' + cap(cat));
  if(!list) return;
  var items = CFG_STATE.items[cat] || [];
  list.innerHTML = '';
  if(!items.length){
    list.innerHTML = '<div class="small muted">Nav opciju. Nospiediet "+ Pievienot", lai pievienotu pirmo.</div>';
    return;
  }
  items.forEach(function(it, idx){
    var row = document.createElement('div');
    row.className = 'cfg-item';
    row.innerHTML =
      '<div class="cfg-item-main">' +
      '<span class="cfg-item-num">' + (idx + 1) + '.</span>' +
      '<span class="cfg-item-label">' + esc(it.label || '') + '</span>' +
      (it.value ? '<span class="cfg-item-val">[vērtība: ' + esc(it.value) + ']</span>' : '') +
      '</div>' +
      '<div class="cfg-item-actions">' +
      '<button type="button" class="cfg-icon-btn" data-act="edit" data-idx="' + idx + '" title="Labot">✎</button>' +
      '<button type="button" class="cfg-icon-btn cfg-icon-btn-danger" data-act="del" data-idx="' + idx + '" title="Dzēst">×</button>' +
      '</div>';
    list.appendChild(row);
  });
  list.querySelectorAll('[data-act="edit"]').forEach(function(btn){
    btn.addEventListener('click', function(){ var idx = parseInt(btn.getAttribute('data-idx'), 10); openCfgModal(cat, idx); });
  });
  list.querySelectorAll('[data-act="del"]').forEach(function(btn){
    btn.addEventListener('click', function(){ var idx = parseInt(btn.getAttribute('data-idx'), 10); delCfgItem(cat, idx); });
  });
}

function delCfgItem(cat, idx){
  if(!confirm('Dzēst šo opciju?')) return;
  var items = CFG_STATE.items[cat] || [];
  items.splice(idx, 1);
  CFG_STATE.items[cat] = items;
  renderCfgList(cat);
}

function initCfgModals(){
  var modal = byId('cfgModal');
  if(!modal) return;
  modal.addEventListener('click', function(e){ if(e.target && e.target.getAttribute('data-cfg-close')) closeCfgModal(); });
  byId('cfgModalClose').addEventListener('click', closeCfgModal);
  byId('cfgCancel').addEventListener('click', closeCfgModal);
  byId('cfgSave').addEventListener('click', function(){
    var cat = byId('cfgEditCat').value;
    var idx = byId('cfgEditId').value ? parseInt(byId('cfgEditId').value, 10) : null;
    var label = String(byId('cfgOptionLabel').value || '').trim();
    var value = String(byId('cfgOptionValue').value || '').trim();
    if(!label){ setCfgMsg('Nosaukums ir obligāts.', true); return; }
    var item = { id: String(Date.now()), label: label };
    if(value !== '') item.value = value;
    var items = CFG_STATE.items[cat] || [];
    if(idx !== null && items[idx]){
      item.id = items[idx].id;
      items[idx] = item;
    } else {
      items.push(item);
    }
    CFG_STATE.items[cat] = items;
    closeCfgModal();
    renderCfgList(cat);
  });
}

function openCfgModal(cat, idx){
  var modal = byId('cfgModal');
  var title = byId('cfgModalTitle');
  var catInput = byId('cfgEditCat');
  var idxInput = byId('cfgEditId');
  var labelInput = byId('cfgOptionLabel');
  var valueInput = byId('cfgOptionValue');
  var catName = byId('cfgCatName');
  catInput.value = cat;
  idxInput.value = idx !== null ? String(idx) : '';
  catName.value = CFG_LABELS[cat] || cat;
  setCfgMsg('', false);
  if(idx !== null){
    title.textContent = 'Labot opciju';
    var it = (CFG_STATE.items[cat] || [])[idx];
    labelInput.value = it.label || '';
    valueInput.value = it.value || '';
  } else {
    title.textContent = 'Pievienot opciju';
    labelInput.value = '';
    valueInput.value = '';
  }
  modal.hidden = false; modal.setAttribute('aria-hidden','false');
  document.body.classList.add('sp-modal-open');
  setTimeout(function(){ labelInput.focus(); }, 40);
}
function closeCfgModal(){
  var modal = byId('cfgModal');
  if(modal){ modal.hidden = true; modal.setAttribute('aria-hidden','true'); }
  document.body.classList.remove('sp-modal-open');
}
function setCfgMsg(text, err){
  var e = byId('cfgMsg'); if(!e) return;
  e.textContent = text || '';
  e.className = 'alert ' + (err ? 'alert-error' : 'alert-success');
  e.style.display = text ? 'block' : 'none';
}
function updateSessionTimer(){
  var bar = byId('sessionBar'); var label = byId('sessionLabel');
  if(!bar) return;
  var t = parseInt(localStorage.getItem(ACCESS_REMEMBER_KEY) || '0', 10);
  if(!t){ bar.style.width = '0%'; if(label) label.textContent = 'Sesija beigusies'; return; }
  var left = ACCESS_REMEMBER_MS - (Date.now() - t);
  if(left <= 0){ bar.style.width = '0%'; if(label) label.textContent = 'Sesija beigusies'; return; }
  var pct = Math.max(0, Math.min(100, (left / ACCESS_REMEMBER_MS) * 100));
  bar.style.width = pct + '%';
  var h = Math.floor(left / 3600000); var m = Math.floor((left % 3600000) / 60000); var s = Math.floor((left % 60000) / 1000);
  if(label) label.textContent = 'Atlikis: ' + h + 'h ' + m + 'm ' + s + 's';
}
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
