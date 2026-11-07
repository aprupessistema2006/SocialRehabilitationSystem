/* Kaskādes - interaktīvs koka skats: Nodarbība → Mērķis → Problēma → Uzdevums */
var K = { nv: [], m: [], p: [], u: [], tree: [], all: [], q: '', activeOnly: false };
var EDIT = { id: null, type: null, name: '', aktiv: true, prop: null, parentId: null };
var ADD = { type: null, prop: null, parentId: null };

var LVL = [
  { key: 'nv', label: 'Nodarbības veids', type: 'NV', prop: null, child: 'm', title: 'Nodarbības veids (sakne)' },
  { key: 'm', label: 'Mērķis', type: 'M', prop: 'nv_id', child: 'p', title: 'Mērķis' },
  { key: 'p', label: 'Problēma', type: 'P', prop: 'merkis_id', child: 'u', title: 'Klienta problēma' },
  { key: 'u', label: 'Uzdevums', type: 'U', prop: 'problema_id', child: null, title: 'Uzdevums' }
];
function lvlByKey(k){ for(var i=0;i<LVL.length;i++){ if(LVL[i].key===k) return LVL[i]; } return null; }
function lvlByType(t){ for(var i=0;i<LVL.length;i++){ if(LVL[i].type===t) return LVL[i]; } return null; }
function saveActionByType(t){ return t==='NV'?'saveNodarbibasVeids':t==='M'?'saveMerkis':t==='P'?'saveProblema':'saveUzdevums'; }

function normTxt(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[ā]/g,'a').replace(/[č]/g,'c').replace(/[ē]/g,'e').replace(/[ģ]/g,'g').replace(/[ī]/g,'i').replace(/[ķ]/g,'k').replace(/[ļ]/g,'l').replace(/[ņ]/g,'n').replace(/[š]/g,'s').replace(/[ū]/g,'u').replace(/[ž]/g,'z').replace(/\s+/g,' ').trim(); }
function matchNode(node, q){ if(!q) return true; var hay=normTxt(node.name); var words=normTxt(q).split(' ').filter(Boolean); for(var i=0;i<words.length;i++){ if(hay.indexOf(words[i])===-1) return false; } return true; }

async function initKaskades(){
  var u=requireUser();
  if(u.role!=='ADMIN'){ byId('adminWarn').style.display='block'; byId('kascadeWrap').style.display='none'; return; }
  byId('reloadK').addEventListener('click', loadK);
  byId('seedBtn').addEventListener('click', async function(){
    byId('pageMsg').textContent='Ievietot testa datus...';
    try{ await api('seedTestData'); await loadK(); byId('pageMsg').textContent='Testa dati ievietoti (ja tabulas bija tukšas).'; }catch(e){ byId('pageMsg').textContent='Kļūda ielādējo testa datus.'; }
  });
  if(byId('addRootBtn')){ byId('addRootBtn').addEventListener('click', function(){ openAdd({type:'NV',prop:null,parentId:null}, 'Jauns nodarbības veids (sakne)'); }); }
  var search=byId('kascadeSearch'); if(search){ search.addEventListener('input', function(){ K.q=this.value||''; renderTree(); }); }
  var activeOnly=byId('kascadeActiveOnly'); if(activeOnly){ activeOnly.addEventListener('change', function(){ K.activeOnly=this.checked; renderTree(); }); }
  initModals();
  await loadK();
}
async function loadK(){
  try{
    var res=await api('getKaskade');
    if(res.ok){
      K.nv=(res.nodarbibu_veidi||[]).map(function(x){ return {id:x.id, name:x.nosaukums||'', aktiv: String(x.aktivs).toUpperCase()!=='FALSE', parentId:null}; });
      K.m=(res.merki||[]).map(function(x){ return {id:x.id, name:x.nosaukums||'', aktiv: String(x.aktivs).toUpperCase()!=='FALSE', parentId:x.nv_id}; });
      K.p=(res.problemas||[]).map(function(x){ return {id:x.id, name:x.nosaukums||'', aktiv: String(x.aktivs).toUpperCase()!=='FALSE', parentId:x.merkis_id}; });
      K.u=(res.uzdevumi||[]).map(function(x){ return {id:x.id, name:x.nosaukums||'', aktiv: String(x.aktivs).toUpperCase()!=='FALSE', parentId:x.problema_id}; });
      buildTree(); renderTree(); byId('pageMsg').textContent='';
    }
  }catch(e){ byId('pageMsg').textContent='Neizdevās ielādēt kaskādes.'; }
}
function buildTree(){
  var byIdMap={}; var all=[];
  function reg(key, items){ items.forEach(function(it){ var l=lvlByKey(key); var node={key:key, type:l.type, id:it.id, name:it.name, aktiv: it.aktiv, parentId: it.parentId, children: [], expanded: true, visible: true, match: false}; byIdMap[it.id]=node; all.push(node); }); }
  reg('nv', K.nv); reg('m', K.m); reg('p', K.p); reg('u', K.u);
  all.forEach(function(node){ node.children=[]; });
  all.forEach(function(node){ if(node.parentId && byIdMap[node.parentId]){ byIdMap[node.parentId].children.push(node); node.parent=byIdMap[node.parentId]; } });
  K.tree = all.filter(function(n){ return !n.parentId || !byIdMap[n.parentId]; }).sort(sortNodes);
  all.forEach(function(n){ n.children.sort(sortNodes); });
  K.all=all;
}
function sortNodes(a,b){ if(a.aktiv===b.aktiv) return String(a.name).localeCompare(String(a.name), 'lv') || String(a.name).localeCompare(String(b.name), 'lv'); return a.aktiv?-1:1; }
function computeVisibility(){
  var all=K.all||[];
  all.forEach(function(n){ n.visible = K.activeOnly ? n.aktiv : true; n.match = K.q ? matchNode(n, K.q) : false; });
  if(K.q){
    all.forEach(function(n){
      var cur=n; while(cur){ if(cur.match){ var x=cur; while(x){ x.visible=true; x=x.parent; } break; } cur=cur.parent; }
    });
    all.forEach(function(n){ if(n.visible && !n.match && n.children.some(function(c){ return c.visible; })){ n.expanded=true; } });
  }
  all.forEach(function(n){ delete n.parent; });
}
function renderTree(){
  computeVisibility();
  var cont=byId('cascadeTree'); cont.innerHTML='';
  var roots=K.tree.filter(function(n){ return n.visible; });
  if(!roots.length){
    var emptyMsg = K.q ? 'Meklējumam nav atbilstošu rezultātu.' : 'Nav datu. Nospiediet „Ievietot testa datus”, lai ģenerētu paraugu kaskādi.';
    cont.innerHTML='<div class="tree-empty"><b>Tukšs</b><div style="margin-top:8px; font-size:13px;">'+emptyMsg+'</div></div>';
    return;
  }
  var hint=byId('cascadeHint'); if(hint){ hint.textContent = K.q ? 'Rādīti atbilstošie elementi un viņu ceļi kaskādē.' : ''; }
  roots.forEach(function(node){ cont.appendChild(renderNode(node, 0)); });
}
function renderNode(node, depth){
  var l=lvlByKey(node.key);
  var hasChildren = node.children && node.children.length > 0;
  var visibleChildren = hasChildren ? node.children.filter(function(c){ return c.visible; }) : [];
  var showChildren = node.expanded && visibleChildren.length > 0;
  var wrap=document.createElement('div');
  wrap.className='tree-node tree-node-level-'+Math.min(depth,3)+(node.aktiv===false?' tree-node-inactive':'');
  var content=document.createElement('div');
  content.className='tree-node-content'; content.setAttribute('role','treeitem'); content.tabIndex=0;
  content.dataset.id=node.id; content.dataset.type=node.type;
  var toggle = hasChildren ? document.createElement('button') : null;
  if(toggle){ toggle.className='tree-node-toggle'; toggle.setAttribute('aria-label', showChildren?'Izvērt koku':'Rozvērt koku'); toggle.textContent=showChildren?'▾':'▸'; toggle.addEventListener('click', function(e){ e.stopPropagation(); node.expanded=!node.expanded; renderTree(); }); }
  content.addEventListener('click', function(e){ if(e.target.closest('.tree-node-action, .tree-node-toggle')) return; if(node.children.length){ node.expanded=!node.expanded; renderTree(); } });
  var icon=document.createElement('span'); icon.className='tree-node-icon'; icon.setAttribute('aria-hidden','true'); icon.textContent = depth===0?'🌿':depth===1?'🎯':depth===2?'⚠️':'📝';
  var idSpan=document.createElement('span'); idSpan.className='tree-node-id'; idSpan.textContent=node.id;
  var nameSpan=document.createElement('span'); nameSpan.className='tree-node-name'; nameSpan.textContent=node.name;
  var badge=document.createElement('span'); badge.className='tree-node-badge '+ (node.aktiv?'tree-node-badge-ok':'tree-node-badge-off'); badge.textContent=node.aktiv?'Aktīvs':'Neaktīvs';
  var actions=document.createElement('div'); actions.className='tree-node-actions';
  var btnEdit=document.createElement('button'); btnEdit.className='tree-node-action'; btnEdit.title='Labot'; btnEdit.setAttribute('aria-label','Labot'); btnEdit.textContent='✎';
  btnEdit.addEventListener('click', function(e){ e.stopPropagation(); e.preventDefault(); openEdit(node.id, node.type); });
  var btnDel=document.createElement('button'); btnDel.className='tree-node-action'; btnDel.title='Dzēst'; btnDel.setAttribute('aria-label','Dzēst'); btnDel.textContent='×';
  btnDel.addEventListener('click', function(e){ e.stopPropagation(); e.preventDefault(); delItem(node.id, node.type); });
  actions.appendChild(btnEdit); actions.appendChild(btnDel);
  if(l.child){
    var btnAdd=document.createElement('button'); btnAdd.className='tree-node-action'; btnAdd.title='Pievienot '+lvlByKey(l.child).label; btnAdd.setAttribute('aria-label','Pievienot '+lvlByKey(l.child).label); btnAdd.textContent='+';
    btnAdd.dataset.type=node.type; btnAdd.dataset.prop=l.prop; btnAdd.dataset.id=node.id;
    btnAdd.addEventListener('click', function(e){ e.stopPropagation(); e.preventDefault(); openAdd({type:l.child? lvlByKey(l.child).type : null, prop: l.prop, parentId: node.id}, 'Pievienot '+lvlByKey(l.child).label.toLowerCase()); });
    actions.appendChild(btnAdd);
  }
  content.appendChild(toggle); content.appendChild(icon); content.appendChild(idSpan); content.appendChild(nameSpan); content.appendChild(badge); content.appendChild(actions);
  wrap.appendChild(content);
  if(showChildren){
    var children=document.createElement('div'); children.className='tree-node-children';
    visibleChildren.forEach(function(c){ children.appendChild(renderNode(c, depth+1)); });
    wrap.appendChild(children);
  }
  return wrap;
}
function delItem(id, type){
  if(!confirm('Dzēst šo ierakstu un visus tā apakšējos elementus?')) return;
  api('deleteKaskadeItem', {id:id, type:type}).then(function(res){
    if(res && res.ok){ byId('pageMsg').textContent='Dzēsts.'; loadK(); }
    else { byId('pageMsg').textContent='Neizdevās dzēst: '+(res&&res.reason?res.reason:''); }
  }).catch(function(){ byId('pageMsg').textContent='Servera kļūda dzēšot.'; });
}
function openEdit(id, type){
  var node = (K.all||[]).find(function(n){ return String(n.id)===String(id) && n.type===type; });
  if(!node) return;
  EDIT.id=id; EDIT.type=type; EDIT.name=node.name; EDIT.aktiv=node.aktiv;
  var l=lvlByType(type);
  EDIT.prop = l ? l.prop : null;
  EDIT.parentId = node.parentId || null;
  byId('editModalTitle').textContent='Labot: '+esc(node.name);
  byId('editName').value=node.name;
  byId('editActive').value=node.aktiv?'true':'false';
  var pg=byId('editParentGroup'); var ps=byId('editParent');
  if(!EDIT.prop){ pg.style.display='none'; }
  else {
    pg.style.display='block'; ps.innerHTML='';
    var pkey = l.key==='m'?'nv': l.key==='p'?'m': l.key==='u'?'p': null;
    var opts = (K.all||[]).filter(function(n){ return n.key===pkey; }).sort(sortNodes);
    opts.forEach(function(o){ var o2=document.createElement('option'); o2.value=o.id; o2.textContent=esc(o.name)+' ('+esc(o.id)+')'; if(String(o.id)===String(EDIT.parentId)) o2.selected=true; ps.appendChild(o2); });
  }
  byId('editModalMsg').style.display='none';
  byId('editModal').style.display='flex';
  setTimeout(function(){ byId('editName').focus(); }, 50);
}
function openAdd(ctx, title){
  ADD.type=ctx.type; ADD.prop=ctx.prop; ADD.parentId=ctx.parentId;
  byId('addModalTitle').textContent=title;
  byId('addName').value='';
  var pg=byId('addParentGroup'); var ps=byId('addParent');
  if(!ADD.prop){ pg.style.display='none'; }
  else {
    pg.style.display='block'; ps.innerHTML='';
    var pkey = ADD.type==='M'?'nv': ADD.type==='P'?'m': ADD.type==='u'?'p': null;
    var opts = (K.all||[]).filter(function(n){ return n.key===pkey; }).sort(sortNodes);
    opts.forEach(function(o){ var o2=document.createElement('option'); o2.value=o.id; o2.textContent=esc(o.name)+' ('+esc(o.id)+')'; if(String(o.id)===String(ADD.parentId)) o2.selected=true; ps.appendChild(o2); });
  }
  byId('addModalMsg').style.display='none';
  byId('addModal').style.display='flex';
  setTimeout(function(){ byId('addName').focus(); }, 50);
}
function initModals(){
  function closeId(id){ var m=byId(id); if(m) m.style.display='none'; }
  [editCancel, addCancel].forEach(function(id){ var b=byId(id); if(b) b.addEventListener('click', function(){ closeId(id==='editCancel'?'editModal':'addModal'); }); });
  [editModal, addModal].forEach(function(id){ var m=byId(id); if(m){ m.addEventListener('click', function(e){ if(e.target===m) closeId(id); }); } });
  byId('editSave').addEventListener('click', function(){
    var name=String(byId('editName').value||'').trim(); if(!name){ setEditMsg('Nosaukums ir obligāts.', true); return; }
    var payload={ id: EDIT.id, nosaukums: name, aktivs: byId('editActive').value==='true' };
    if(EDIT.prop){ payload[EDIT.prop]=byId('editParent').value||''; }
    api(saveActionByType(EDIT.type), payload).then(function(res){
      if(res && res.ok){ closeId('editModal'); byId('pageMsg').textContent='Saglabāts.'; loadK(); }
      else { setEditMsg('Kļūda: '+(res&&res.reason?res.reason:'nezināma'), true); }
    }).catch(function(){ setEditMsg('Servera kļūda.', true); });
  });
  byId('addSave').addEventListener('click', function(){
    var name=String(byId('addName').value||'').trim(); if(!name){ setAddMsg('Nosaukums ir obligāts.', true); return; }
    var payload={ nosaukums: name, aktivs: true };
    if(ADD.prop){ payload[ADD.prop]=byId('addParent').value||''; }
    api(saveActionByType(ADD.type), payload).then(function(res){
      if(res && res.ok){ closeId('addModal'); byId('pageMsg').textContent='Pievienots.'; loadK(); }
      else { setAddMsg('Kļūda: '+(res&&res.reason?res.reason:'nezināma'), true); }
    }).catch(function(){ setAddMsg('Servera kļūda.', true); });
  });
}
function setEditMsg(t, err){ var e=byId('editModalMsg'); e.textContent=t; e.className='alert '+(err?'alert-error':'alert-success'); e.style.display='block'; }
function setAddMsg(t, err){ var e=byId('addModalMsg'); e.textContent=t; e.className='alert '+(err?'alert-error':'alert-success'); e.style.display='block'; }
document.addEventListener('DOMContentLoaded', function(){ if(byId('cascadeTree')) initKaskades(); });
