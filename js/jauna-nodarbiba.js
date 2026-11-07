var SP = {
  nv: { key:'nv', level:'nv', val:'activityType', title:'Nodarbība', ph:'Izvēlieties nodarbības veidu...', locked:null, items:[], parent:null, search:'', auto:false },
  goal: { key:'goal', level:'m', val:'goal', title:'Mērķis', ph:'Vispirms izvēlieties nodarbības nosaukumu', locked:'Vispirms izvēlieties nodarbības nosaukumu', items:[], parent:'nv', search:'', auto:false },
  problem: { key:'problem', level:'p', val:'problem', title:'Problēma', ph:'Vispirms izvēlieties mērķi', locked:'Vispirms izvēlieties mērķi', items:[], parent:'goal', search:'', auto:false },
  task: { key:'task', level:'u', val:'task', title:'Uzdevums', ph:'Vispirms izvēlieties klienta problēmu', locked:'Vispirms izvēlieties klienta problēmu', items:[], parent:'problem', search:'', auto:false }
};
var SP_ORDER=['nv','goal','problem','task'];
var spState={k:null, sel:{nv:null,goal:null,problem:null,task:null}, open:null, autoTimer:null};

async function initJauna(){
  var u=requireUser(); var emp=byId('employee'); if(emp) emp.value=u.name||'';
  var date=byId('activityDate'); if(date && !date.value){ var d=new Date(); date.value=d.toISOString().slice(0,10); }
  byId('clearForm').addEventListener('click', function(){ if(confirm('Notīrīt formu?')) location.reload(); });
  try{
    var res=await Promise.all([api('getKlienti'), api('getKaskade')]);
    var kRes=res[0], cRes=res[1];
    if(kRes.ok){ var sel=byId('client'); (kRes.klienti||[]).filter(function(k){return String(k.statuss).toLowerCase().indexOf('akt')===0;}).forEach(function(k){ var o=document.createElement('option'); o.value=k.vards; o.textContent=k.vards; sel.appendChild(o); }); }
    if(cRes.ok) spState.k=cRes;
  }catch(e){ setMsg('formAlert','Neizdevās ielādēt datus.','alert-error'); }
  initCascadePickers();
  byId('activityForm').addEventListener('submit', async function(e){ e.preventDefault(); await saveJauna(u); });
}

function initCascadePickers(){
  SP.nv.items = spState.k ? (spState.k.nodarbibu_veidi||[]).filter(function(x){return x.aktivs!==false;}) : [];
  SP_ORDER.forEach(function(k){ bindPicker(k); });
  document.addEventListener('click', function(e){ if(spState.open && !e.target.closest('.sp-field[data-sp="'+spState.open+'"]')) closePicker(spState.open); });
  document.addEventListener('keydown', function(e){ if(!spState.open) return; if(e.key==='Escape'){ closePicker(spState.open); byId(triggerId(spState.open)).focus(); } if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); moveFocus(spState.open, e.key==='ArrowDown'?1:-1); } if(e.key==='Enter' && document.activeElement && document.activeElement.classList.contains('sp-option')){ e.preventDefault(); document.activeElement.click(); } });
  var rs=byId('resetCascade'); if(rs) rs.addEventListener('click', function(){ clearFrom('nv', true); openPicker('nv'); });
  document.querySelectorAll('[data-open]').forEach(function(b){ b.addEventListener('click', function(){ var k=b.getAttribute('data-open'); if(!byId(triggerId(k)).classList.contains('is-locked')) openPicker(k); else{ var p=SP[k].parent; if(p) openPicker(p); } }); });
  document.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', function(){ closePicker(b.getAttribute('data-close')); }); });
  document.querySelectorAll('.step-chip').forEach(function(b){ b.addEventListener('click', function(){ if(b.classList.contains('is-locked')) return; var k=SP_ORDER[parseInt(b.getAttribute('data-step'),10)-1]; if(k) openPicker(k); }); });
  renderAllPickers();
}

function triggerId(k){ return 'spTrigger'+cap(k); }
function cap(k){ return k==='nv'?'Nv':k.charAt(0).toUpperCase()+k.slice(1); }
function bindPicker(k){
  var trig=byId(triggerId(k)); if(!trig) return;
  trig.addEventListener('click', function(){ if(trig.classList.contains('is-locked')){ if(SP[k].parent) focusOrOpen(SP[k].parent); return; } if(spState.open===k) closePicker(k); else openPicker(k); });
  var s=byId('spSearch'+cap(k)); if(s){ s.addEventListener('input', function(){ SP[k].search=s.value||''; renderList(k); }); }
  var c=byId('spClear'+cap(k)); if(c){ c.addEventListener('click', function(){ SP[k].search=''; if(s){s.value=''; s.focus();} renderList(k); }); }
}
function focusOrOpen(k){ if(byId(triggerId(k)).classList.contains('is-locked')) return; openPicker(k); }
function openPicker(k){
  if(byId(triggerId(k)).classList.contains('is-locked')) return;
  SP_ORDER.forEach(function(x){ if(x!==k) closePicker(x); });
  SP[k].search=''; var s=byId('spSearch'+cap(k)); if(s) s.value='';
  var p=byId('spPanel'+cap(k)); if(p) p.hidden=false;
  byId(triggerId(k)).setAttribute('aria-expanded','true');
  byId(triggerId(k)).closest('.sp-field').classList.add('is-open');
  spState.open=k; renderList(k);
  setTimeout(function(){ if(s) s.focus(); }, 30);
}
function closePicker(k){
  var p=byId('spPanel'+cap(k)); if(p) p.hidden=true;
  var t=byId(triggerId(k)); if(t) t.setAttribute('aria-expanded','false');
  var f=t&&t.closest('.sp-field'); if(f) f.classList.remove('is-open');
  if(spState.open===k) spState.open=null;
}

function normTxt(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[ā]/g,'a').replace(/[č]/g,'c').replace(/[ē]/g,'e').replace(/[ģ]/g,'g').replace(/[ī]/g,'i').replace(/[ķ]/g,'k').replace(/[ļ]/g,'l').replace(/[ņ]/g,'n').replace(/[š]/g,'s').replace(/[ū]/g,'u').replace(/[ž]/g,'z').replace(/\s+/g,' ').trim(); }
function matchItem(item, q){ if(!q) return true; var hay=normTxt(item.nosaukums); var words=normTxt(q).split(' ').filter(Boolean); for(var i=0;i<words.length;i++){ if(hay.indexOf(words[i])===-1) return false; } return true; }

function childrenOf(k, parentId){
  if(!spState.k) return [];
  if(k==='goal') return (spState.k.merki||[]).filter(function(x){return x.aktivs!==false && String(x.nv_id)===String(parentId);});
  if(k==='problem') return (spState.k.problemas||[]).filter(function(x){return x.aktivs!==false && String(x.merkis_id)===String(parentId);});
  if(k==='task') return (spState.k.uzdevumi||[]).filter(function(x){return x.aktivs!==false && String(x.problema_id)===String(parentId);});
  return [];
}

function clearFrom(k, includeSelf){
  var idx=SP_ORDER.indexOf(k); if(idx<0) return;
  for(var i=includeSelf?idx:idx+1;i<SP_ORDER.length;i++){
    var kk=SP_ORDER[i]; spState.sel[kk]=null; SP[kk].items=[]; SP[kk].search=''; SP[kk].auto=false;
    var hv=byId(SP[kk].val); if(hv) hv.value='';
  }
  renderAllPickers(); updateSummary(); updateStepper();
}

function onSelect(k, item, isAuto){
  spState.sel[k]={id:item.id, text:item.nosaukums};
  var hv=byId(SP[k].val); if(hv) hv.value=item.nosaukums;
  SP[k].auto=!!isAuto; closePicker(k);
  // clear below
  clearFrom(k, false);
  var idx=SP_ORDER.indexOf(k);
  if(idx < SP_ORDER.length-1){
    var nk=SP_ORDER[idx+1];
    SP[nk].items=childrenOf(nk, item.id);
    renderAllPickers(); updateSummary(); updateStepper();
    // remember NV locally
    if(k==='nv'){ try{ localStorage.setItem('srs_last_nv', item.id); }catch(e){} }
    // auto-fill if exactly 1
    if(SP[nk].items.length===1){
      spState.autoTimer=setTimeout(function(){ onSelect(nk, SP[nk].items[0], true); }, 220);
    } else if(SP[nk].items.length>1){
      openPicker(nk);
    } else {
      setNote(nk, 'Šim izvēlētajam solim nav pieejamu nākamo opciju.');
    }
  } else {
    renderAllPickers(); updateSummary(); updateStepper();
  }
}

function renderAllPickers(){ SP_ORDER.forEach(function(k){ renderField(k); renderList(k); renderBreadcrumb(k); }); }
function renderField(k){
  var def=SP[k], sel=spState.sel[k], parentOk=!def.parent || !!spState.sel[def.parent];
  var trig=byId(triggerId(k)), txt=byId('spText'+cap(k)), prev=byId('spPreview'+cap(k)), pill=byId('spPill'+cap(k)), note=byId('spNote'+cap(k));
  if(!trig) return;
  trig.classList.toggle('is-locked', !parentOk);
  trig.classList.toggle('has-value', !!sel);
  if(!parentOk){ txt.textContent=def.locked||def.ph; txt.classList.add('is-placeholder'); if(prev){prev.hidden=true;prev.textContent='';} if(pill) pill.textContent=''; if(note){note.hidden=true;note.textContent='';} }
  else if(sel){ txt.textContent=sel.text; txt.classList.remove('is-placeholder'); if(prev){ prev.hidden=false; prev.innerHTML='<div class="sp-preview-label">Pilns teksts</div><div class="sp-preview-text"></div><button type="button" class="sp-link sp-change" data-openx="'+k+'">Mainīt izvēli</button>'; prev.querySelector('.sp-preview-text').textContent=sel.text; prev.querySelector('.sp-change').addEventListener('click', function(){ openPicker(k); }); }
    if(pill) pill.textContent = def.auto && k!=='nv' ? 'Auto · 1 opcija' : 'Izvēlēts'; if(note){note.hidden=true;note.textContent='';}
  } else { txt.textContent=def.ph; txt.classList.add('is-placeholder'); if(prev){prev.hidden=true;prev.textContent='';} if(pill) pill.textContent = def.items.length? (def.items.length+' opcijas') : ''; if(note){note.hidden=true;note.textContent='';} }
}
function setNote(k,msg){ var n=byId('spNote'+cap(k)); if(!n) return; n.textContent=msg||''; n.hidden=!msg; }
function renderBreadcrumb(k){
  var bc=byId('spBc'+cap(k)); if(!bc) return; var parts=[];
  if(k==='goal' && spState.sel.nv) parts.push(spState.sel.nv.text);
  if(k==='problem'){ if(spState.sel.nv) parts.push(spState.sel.nv.text); if(spState.sel.goal) parts.push(short(spState.sel.goal.text,60)); }
  if(k==='task'){ if(spState.sel.nv) parts.push(spState.sel.nv.text); if(spState.sel.goal) parts.push(short(spState.sel.goal.text,40)); if(spState.sel.problem) parts.push(short(spState.sel.problem.text,50)); }
  bc.innerHTML = parts.length ? '<span>'+parts.map(esc).join(' <span class="sp-bc-sep">›</span> ')+'</span>' : '';
}
function short(s,n){ s=String(s||''); return s.length>n? s.slice(0,n-1)+'…' : s; }

function renderList(k){
  var list=byId('spList'+cap(k)), count=byId('spCount'+cap(k)); if(!list) return;
  var def=SP[k], items=def.items||[];
  var q=def.search||''; var filtered=items.filter(function(it){ return matchItem(it,q); });
  if(count) count.textContent = q ? ('Atrasti '+filtered.length+' no '+items.length) : (items.length+' opcijas');
  list.innerHTML='';
  if(!items.length){ list.innerHTML='<div class="sp-empty">Nav pieejamu opciju šim solim.</div>'; return; }
  if(!filtered.length){ list.innerHTML='<div class="sp-empty">Nav rezultātu. <button type="button" class="sp-link" data-clearx="'+k+'">Notīrīt meklēšanu</button></div>'; var cx=list.querySelector('[data-clearx]'); if(cx) cx.addEventListener('click', function(){ def.search=''; var s=byId('spSearch'+cap(k)); if(s) s.value=''; renderList(k); s&&s.focus(); }); return; }
  filtered.forEach(function(it, i){
    var btn=document.createElement('button'); btn.type='button'; btn.className='sp-option'+(spState.sel[k]&&String(spState.sel[k].id)===String(it.id)?' is-selected':'');
    btn.setAttribute('role','option'); btn.setAttribute('aria-selected', spState.sel[k]&&String(spState.sel[k].id)===String(it.id)?'true':'false');
    btn.innerHTML='<span class="sp-opt-n">'+(i+1)+'</span><span class="sp-opt-body"><span class="sp-opt-text"></span></span><span class="sp-opt-check">'+(spState.sel[k]&&String(spState.sel[k].id)===String(it.id)?'✓':'')+'</span>';
    btn.querySelector('.sp-opt-text').textContent=it.nosaukums;
    btn.addEventListener('click', function(){ onSelect(k,it,false); });
    list.appendChild(btn);
  });
}
function moveFocus(k,dir){
  var opts=Array.prototype.slice.call(byId('spList'+cap(k)).querySelectorAll('.sp-option')); if(!opts.length) return;
  var idx=opts.indexOf(document.activeElement); idx = idx<0 ? (dir>0?0:opts.length-1) : Math.max(0,Math.min(opts.length-1, idx+dir));
  opts[idx].focus();
}

function updateStepper(){
  SP_ORDER.forEach(function(k,i){
    var chip=byId('stepChip'+(i+1)); if(!chip) return;
    var parentOk=!SP[k].parent || !!spState.sel[SP[k].parent];
    var done=!!spState.sel[k]; var active=spState.open===k || (!done && parentOk);
    chip.classList.toggle('is-done', done); chip.classList.toggle('is-active', active && !done); chip.classList.toggle('is-locked', !parentOk);
  });
}
function updateSummary(){
  var ok=spState.sel.nv&&spState.sel.goal&&spState.sel.problem&&spState.sel.task;
  var box=byId('cascadeSummary'); if(!box) return; box.hidden=!ok;
  if(!ok) return;
  [['sumNv','nv'],['sumGoal','goal'],['sumProblem','problem'],['sumTask','task']].forEach(function(p){ var el=byId(p[0]); if(el) el.textContent=spState.sel[p[1]].text; });
}

async function saveJauna(u){
  var reqVals=[['client','Klients'],['activityDate','Datums']];
  for(var i=0;i<reqVals.length;i++){ var el=byId(reqVals[i][0]); if(!el || !String(el.value||'').trim()){ setMsg('formAlert','Lūdzu aizpildiet: '+reqVals[i][1]+'.','alert-error'); el&&el.focus(); return; } }
  var reqSp=[['nv','Nodarbības nosaukums','activityType'],['goal','Mērķis','goal'],['problem','Klienta problēma','problem'],['task','Uzdevums','task']];
  for(var j=0;j<reqSp.length;j++){ var hv=byId(reqSp[j][2]); if(!hv||!String(hv.value||'').trim()){ setMsg('formAlert','Lūdzu izvēlieties: '+reqSp[j][1]+'.','alert-error'); if(!byId(triggerId(reqSp[j][0])).classList.contains('is-locked')) openPicker(reqSp[j][0]); return; } }
  var reqText=[['reflection','Refleksija'],['motivation','Klienta sadarbība un motivācija'],['process','Nodarbības gaita']];
  for(var k=0;k<reqText.length;k++){ var et=byId(reqText[k][0]); if(!et || !String(et.value||'').trim()){ setMsg('formAlert','Lūdzu aizpildiet: '+reqText[k][1]+'.','alert-error'); et&&et.focus(); return; } }
  var btn=document.querySelector('#activityForm button[type=submit]'); btn.disabled=true; setMsg('formAlert','Saglabā...', '');
  try{
    var payload={klients:byId('client').value, datums:fmtDate(byId('activityDate').value), nodarbiba_nosaukums:byId('activityType').value, merkis:byId('goal').value, problema:byId('problem').value, uzdevums:byId('task').value,
      refleksija:byId('reflection').value, motivacija:byId('motivation').value, gaita:byId('process').value, garastavoklis:byId('mood').value, vertejums:byId('evaluation').value, pildits:byId('implementation').value, komentars:byId('comment').value,
      employee_id:u.id, darbinieks:u.name};
    var res=await api('saveNodarbiba', payload);
    if(res.ok){ setMsg('formAlert','Nodarbība saglabāta.','alert-success'); setTimeout(function(){ window.location.href='sakums.html'; }, 700); }
    else setMsg('formAlert','Neizdevās saglabāt.','alert-error');
  }catch(e){ setMsg('formAlert','Servera kļūda.','alert-error'); }
  btn.disabled=false;
}
function fmtDate(iso){ if(!iso) return ''; var p=iso.split('-'); return p.length===3? (p[2]+'.'+p[1]+'.'+p[0]) : iso; }
document.addEventListener('DOMContentLoaded', function(){ if(byId('activityForm')) initJauna(); });