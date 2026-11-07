var SP = {
  nv: { key:'nv', level:'nv', val:'activityType', title:'Izvēlieties nodarbības veidu', eyebrow:'1. solis · Nodarbība', ph:'Izvēlieties nodarbības veidu...', searchPh:'Meklēt nodarbības veidu...', locked:null, items:[], parent:null, search:'', auto:false },
  goal: { key:'goal', level:'m', val:'goal', title:'Izvēlieties mērķi', eyebrow:'2. solis · Mērķis', ph:'Atvērt mērķu izvēli...', searchPh:'Meklēt mērķi pēc vārdiem...', locked:'Vispirms izvēlieties nodarbības nosaukumu', items:[], parent:'nv', search:'', auto:false },
  problem: { key:'problem', level:'p', val:'problem', title:'Izvēlieties klienta problēmu', eyebrow:'3. solis · Problēma', ph:'Atvērt problēmu izvēli...', searchPh:'Meklēt problēmu pēc vārdiem...', locked:'Vispirms izvēlieties mērķi', items:[], parent:'goal', search:'', auto:false },
  task: { key:'task', level:'u', val:'task', title:'Izvēlieties uzdevumu', eyebrow:'4. solis · Uzdevums', ph:'Atvērt uzdevumu izvēli...', searchPh:'Meklēt uzdevumu pēc vārdiem...', locked:'Vispirms izvēlieties klienta problēmu', items:[], parent:'problem', search:'', auto:false }
};
var SP_ORDER=['nv','goal','problem','task'];
var spState={k:null, sel:{nv:null,goal:null,problem:null,task:null}, open:null, autoTimer:null};

async function initJauna(){
  var u=requireUser(); var emp=byId('employee'); if(emp) emp.value=u.name||'';
  var date=byId('activityDate'); if(date && !date.value){ var d=new Date(); var dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0'); date.value=d.getFullYear()+'-'+mm+'-'+dd; }
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
  var modal=byId('spModal');
  if(modal){ modal.addEventListener('click', function(e){ if(e.target && e.target.getAttribute('data-modal-close')) closePicker(spState.open); }); }
  var ms=byId('spModalSearch'); if(ms){ ms.addEventListener('input', function(){ if(spState.open){ SP[spState.open].search=ms.value||''; renderList(spState.open); } }); }
  var mc=byId('spModalClear'); if(mc){ mc.addEventListener('click', function(){ if(spState.open){ SP[spState.open].search=''; if(ms){ms.value=''; ms.focus();} renderList(spState.open); } }); }
  ['spModalClose','spModalCancel'].forEach(function(id){ var b=byId(id); if(b) b.addEventListener('click', function(){ closePicker(spState.open); }); });
  document.addEventListener('keydown', function(e){ if(!spState.open) return; if(e.key==='Escape'){ e.preventDefault(); closePicker(spState.open); } if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); moveFocus(spState.open, e.key==='ArrowDown'?1:-1); } if(e.key==='Enter' && document.activeElement && document.activeElement.classList.contains('sp-option')){ e.preventDefault(); document.activeElement.click(); } });
  var rs=byId('resetCascade'); if(rs) rs.addEventListener('click', function(){ clearFrom('nv', true); openPicker('nv'); });
  document.querySelectorAll('[data-open]').forEach(function(b){ b.addEventListener('click', function(){ var k=b.getAttribute('data-open'); if(!byId(triggerId(k)).classList.contains('is-locked')) openPicker(k); else{ var p=SP[k].parent; if(p) openPicker(p); } }); });
  document.querySelectorAll('.step-chip').forEach(function(b){ b.addEventListener('click', function(){ if(b.classList.contains('is-locked')) return; var k=SP_ORDER[parseInt(b.getAttribute('data-step'),10)-1]; if(k) openPicker(k); }); });
  renderAllPickers();
}

function triggerId(k){ return 'spTrigger'+cap(k); }
function cap(k){ return k==='nv'?'Nv':k.charAt(0).toUpperCase()+k.slice(1); }
function bindPicker(k){
  var trig=byId(triggerId(k)); if(!trig) return;
  trig.addEventListener('click', function(){ if(trig.classList.contains('is-locked')){ if(SP[k].parent) focusOrOpen(SP[k].parent); return; } openPicker(k); });
}
function focusOrOpen(k){ if(byId(triggerId(k)).classList.contains('is-locked')) return; openPicker(k); }
function openPicker(k){
  if(!k) return; var trig=byId(triggerId(k)); if(!trig || trig.classList.contains('is-locked')) return;
  spState.open=k; SP[k].search='';
  var modal=byId('spModal'); if(!modal) return;
  byId('spModalEyebrow').textContent=SP[k].eyebrow||'Kaskādes izvēle';
  byId('spModalTitle').textContent=SP[k].title||'Izvēle';
  var bc=byId('spModalBc'); bc.innerHTML=renderBreadcrumbHtml(k); bc.style.display=bc.innerHTML?'':'none';
  var ms=byId('spModalSearch'); if(ms){ ms.value=''; ms.placeholder=SP[k].searchPh||'Meklēt...'; }
  renderModalList(k);
  modal.hidden=false; modal.setAttribute('aria-hidden','false'); document.body.classList.add('sp-modal-open');
  setTimeout(function(){ if(ms) ms.focus(); }, 40);
}
function closePicker(k){
  if(!spState.open && !k) return; var ok=spState.open; spState.open=null;
  var modal=byId('spModal'); if(modal){ modal.hidden=true; modal.setAttribute('aria-hidden','true'); }
  document.body.classList.remove('sp-modal-open');
  renderAllPickers(); updateSummary(); updateStepper();
  if(ok){ var t=byId(triggerId(ok)); if(t) t.focus(); }
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
  SP[k].auto=!!isAuto; var justOpen=spState.open; spState.open=null; var modal=byId('spModal'); if(modal){modal.hidden=true; modal.setAttribute('aria-hidden','true');} document.body.classList.remove('sp-modal-open');
  clearFrom(k, false);
  var idx=SP_ORDER.indexOf(k);
  if(idx < SP_ORDER.length-1){
    var nk=SP_ORDER[idx+1];
    SP[nk].items=childrenOf(nk, item.id);
    renderAllPickers(); updateSummary(); updateStepper();
    if(k==='nv'){ try{ localStorage.setItem('srs_last_nv', item.id); }catch(e){} }
    if(SP[nk].items.length===1){
      if(spState.autoTimer) clearTimeout(spState.autoTimer);
      spState.autoTimer=setTimeout(function(){ onSelect(nk, SP[nk].items[0], true); }, 180);
    } else if(SP[nk].items.length>1){
      setTimeout(function(){ openPicker(nk); }, 80);
    } else {
      setNote(nk, 'Šim izvēlētajam solim nav pieejamu nākamo opciju.');
    }
  } else {
    renderAllPickers(); updateSummary(); updateStepper();
  }
  if(justOpen){ var t=byId(triggerId(justOpen)); if(t) t.focus(); }
}

function renderAllPickers(){ SP_ORDER.forEach(function(k){ renderField(k); }); }
function renderField(k){
  var def=SP[k], sel=spState.sel[k], parentOk=!def.parent || !!spState.sel[def.parent];
  var trig=byId(triggerId(k)), txt=byId('spText'+cap(k)), prev=byId('spPreview'+cap(k)), pill=byId('spPill'+cap(k)), note=byId('spNote'+cap(k));
  if(!trig) return;
  trig.classList.toggle('is-locked', !parentOk);
  trig.classList.toggle('has-value', !!sel);
  trig.setAttribute('aria-expanded','false');
  if(!parentOk){ txt.textContent=def.locked||def.ph; txt.classList.add('is-placeholder'); if(prev){prev.hidden=true;prev.textContent='';} if(pill) pill.textContent=''; if(note){note.hidden=true;note.textContent='';} }
  else if(sel){ txt.textContent=sel.text; txt.classList.remove('is-placeholder'); if(prev){ prev.hidden=false; prev.innerHTML='<div class="sp-preview-label">Pilns teksts</div><div class="sp-preview-text"></div><button type="button" class="sp-link sp-change" data-openx="'+k+'">Mainīt izvēli</button>'; prev.querySelector('.sp-preview-text').textContent=sel.text; prev.querySelector('.sp-change').addEventListener('click', function(){ openPicker(k); }); }
    if(pill) pill.textContent = def.auto && k!=='nv' ? 'Auto · 1 opcija' : 'Izvēlēts'; if(note){note.hidden=true;note.textContent='';}
  } else { txt.textContent=def.ph; txt.classList.add('is-placeholder'); if(prev){prev.hidden=true;prev.textContent='';} if(pill) pill.textContent = def.items.length? (def.items.length+' opcijas') : 'Atvērt'; if(note){note.hidden=true;note.textContent='';} }
}
function setNote(k,msg){ var n=byId('spNote'+cap(k)); if(!n) return; n.textContent=msg||''; n.hidden=!msg; }
function renderBreadcrumbHtml(k){
  var parts=[];
  if(k==='goal' && spState.sel.nv) parts.push(spState.sel.nv.text);
  if(k==='problem'){ if(spState.sel.nv) parts.push(spState.sel.nv.text); if(spState.sel.goal) parts.push(short(spState.sel.goal.text,90)); }
  if(k==='task'){ if(spState.sel.nv) parts.push(spState.sel.nv.text); if(spState.sel.goal) parts.push(short(spState.sel.goal.text,70)); if(spState.sel.problem) parts.push(short(spState.sel.problem.text,80)); }
  return parts.length ? parts.map(esc).join(' <span class="sp-bc-sep">›</span> ') : '';
}
function renderBreadcrumb(k){ return renderBreadcrumbHtml(k); }
function short(s,n){ s=String(s||''); return s.length>n? s.slice(0,n-1)+'…' : s; }

function renderModalList(k){ renderList(k); }
function renderList(k){
  var list=byId(spState.open===k?'spModalList':('spList'+cap(k))), count=byId(spState.open===k?'spModalCount':('spCount'+cap(k))); if(!list) return;
  var def=SP[k], items=def.items||[];
  var q=def.search||''; var filtered=items.filter(function(it){ return matchItem(it,q); });
  if(count) count.textContent = q ? ('Atrasti '+filtered.length+' no '+items.length) : (items.length+' opcijas');
  list.innerHTML='';
  if(!items.length){ list.innerHTML='<div class="sp-empty">Nav pieejamu opciju šim solim.</div>'; return; }
  if(!filtered.length){ list.innerHTML='<div class="sp-empty">Nav rezultātu meklējumam. <button type="button" class="sp-link" data-clearx="'+k+'">Notīrīt meklēšanu</button></div>'; var cx=list.querySelector('[data-clearx]'); if(cx) cx.addEventListener('click', function(){ def.search=''; var s=byId('spModalSearch'); if(s) s.value=''; renderList(k); s&&s.focus(); }); return; }
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
  var list=byId('spModalList'); if(!list) return;
  var opts=Array.prototype.slice.call(list.querySelectorAll('.sp-option')); if(!opts.length) return;
  var idx=opts.indexOf(document.activeElement); idx = idx<0 ? (dir>0?0:opts.length-1) : Math.max(0,Math.min(opts.length-1, idx+dir));
  opts[idx].focus(); opts[idx].scrollIntoView({block:'nearest'});
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
function fmtDate(iso){ if(!iso) return ''; var s=String(iso).trim(); if(/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s; var p=s.split('-'); if(p.length===3 && p[0].length===4) return p[2].slice(0,2)+'.'+p[1]+'.'+p[0]; var d=new Date(s); if(!isNaN(d)){ var dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0'); return dd+'.'+mm+'.'+d.getFullYear(); } return s; }
document.addEventListener('DOMContentLoaded', function(){ if(byId('activityForm')) initJauna(); });