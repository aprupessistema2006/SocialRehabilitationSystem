async function initJauna(){
  var u=requireUser(); var emp=byId('employee'); if(emp) emp.value=u.name||'';
  var date=byId('activityDate'); if(date && !date.value){ var d=new Date(); date.value=d.toISOString().slice(0,10); }
  byId('clearForm').addEventListener('click', function(){ if(confirm('Notīrīt formu?')) location.reload(); });
  var state={k:null};
  try{
    var [kRes,cRes]=await Promise.all([api('getKlienti'), api('getKaskade')]);
    if(kRes.ok){ var sel=byId('client'); (kRes.klienti||[]).filter(function(k){return String(k.statuss).toLowerCase().indexOf('akt')===0;}).forEach(function(k){ var o=document.createElement('option'); o.value=k.vards; o.textContent=k.vards; sel.appendChild(o); }); }
    if(cRes.ok) state.k=cRes;
  }catch(e){ setMsg('formAlert','Neizdevās ielādēt datus.','alert-error'); }
  wireCascade(state);
  byId('activityForm').addEventListener('submit', async function(e){ e.preventDefault(); await saveJauna(u,state); });
}
function wireCascade(state){
  var nv=byId('activityType'), m=byId('goal'), p=byId('problem'), u=byId('task');
  nv.addEventListener('change', function(){ reset(m,'Izvēlieties...'); reset(p,'Vispirms izvēlieties mērķi'); reset(u,'Vispirms izvēlieties klienta problēmu'); m.disabled=true;p.disabled=true;u.disabled=true;
    if(!state.k||!nv.value) return; (state.k.merki||[]).filter(function(x){return String(x.nv_id)===String(nv.selectedOptions[0].dataset.id)&&x.aktivs!==false;}).forEach(function(x){ addOpt(m,x);}); m.disabled=false; });
  m.addEventListener('change', function(){ reset(p,'Izvēlieties...'); reset(u,'Vispirms izvēlieties klienta problēmu'); p.disabled=true;u.disabled=true;
    if(!state.k||!m.value) return; (state.k.problemas||[]).filter(function(x){return String(x.merkis_id)===String(m.selectedOptions[0].dataset.id)&&x.aktivs!==false;}).forEach(function(x){ addOpt(p,x);}); p.disabled=false; });
  p.addEventListener('change', function(){ reset(u,'Izvēlieties...'); u.disabled=true; if(!state.k||!p.value) return; (state.k.uzdevumi||[]).filter(function(x){return String(x.problema_id)===String(p.selectedOptions[0].dataset.id)&&x.aktivs!==false;}).forEach(function(x){ addOpt(u,x);}); u.disabled=false; });
  if(state.k){ (state.k.nodarbibu_veidi||[]).filter(function(x){return x.aktivs!==false;}).forEach(function(x){ addOpt(nv,x); }); }
}
function reset(sel, ph){ sel.innerHTML=''; var o=document.createElement('option'); o.value=''; o.textContent=ph; sel.appendChild(o); }
function addOpt(sel,item){ var o=document.createElement('option'); o.value=item.nosaukums; o.textContent=item.nosaukums; o.dataset.id=item.id; sel.appendChild(o); }
async function saveJauna(u){
  var req=['client','activityDate','activityType','goal','problem','task','reflection','motivation','process'];
  for(var i=0;i<req.length;i++){ var el=byId(req[i]); if(!el || !String(el.value||'').trim()){ setMsg('formAlert','Lūdzu aizpildiet visus obligātos laukus.','alert-error'); el&&el.focus(); return; } }
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
