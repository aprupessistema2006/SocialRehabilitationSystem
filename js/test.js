function _srsMaskToken(t){ if(!t) return ''; t=String(t); return t.length>10 ? (t.slice(0,6)+'…'+t.slice(-4)) : '***'; }
function _srsDiagText(){
  var lines=[];
  lines.push('Laiks: '+new Date().toISOString());
  lines.push('Lapa: '+location.href);
  lines.push('WEBAPP_URL: '+(typeof WEBAPP_URL!=='undefined'?WEBAPP_URL:'-'));
  lines.push('APP_VERSION (kods): '+(typeof APP_VERSION!=='undefined'?APP_VERSION:'-'));
  try{ lines.push('APP_VERSION (storage): '+localStorage.getItem('srs_app_version')); }catch(e){}
  try{ lines.push('Token: '+_srsMaskToken(localStorage.getItem('srs_access_token'))); }catch(e){}
  try{ lines.push('Lietotājs: '+localStorage.getItem('currentUser')); }catch(e){}
  if(window.SRS_DEBUG && window.SRS_DEBUG.last && window.SRS_DEBUG.last.fillVeidne){
    try{ lines.push('Pēdējais fillVeidne: '+JSON.stringify(window.SRS_DEBUG.last.fillVeidne)); }catch(e){}
  }
  return lines.join('\n');
}

async function runTests(){
  var out=byId('out'); var lines=[];
  function log(s){ lines.push(String(s==null?'':s)); if(out) out.textContent=lines.join('\n'); console.log('[SRS][tests]', s); }
  function j(v){ try{ return JSON.stringify(v); }catch(e){ return String(v); } }
  async function step(name,fn){ try{ var d=await fn(); log('PASS  '+name+(d!=null && d!=='' ? ' — '+d : '')); return true; }catch(e){ var msg=(e&&(e.reason||e.message||e.err))||e; log('FAIL  '+name+' — '+j(msg)); if(e && e.reason) log('      detaļas: '+j(e)); return false; } }

  lines=[];
  log('=== SRS diagnostika un testi ===');
  log(_srsDiagText());
  log('');
  var ok=0,total=0;

  total++; if(await step('Serveris sasniedzams (getAppInfo)', async()=>{
    var body=new URLSearchParams(); body.append('data', JSON.stringify({action:'getAppInfo'}));
    var r=await fetch(WEBAPP_URL,{method:'POST',body:body});
    var txt=await r.text(); var res; try{ res=JSON.parse(txt); }catch(e){ throw new Error('Ne-JSON: '+txt.slice(0,300)); }
    if(res && res.ok===false) throw res;
    return j(res);
  })) ok++;

  if(typeof getToken==='function' && getToken() && typeof api==='function'){
    total++; if(await step('getKlienti (ar tokenu)', async()=>{ var r=await api('getKlienti'); if(!r||!r.ok) throw (r||{reason:'nav_atbildes'}); return 'count='+((r.klienti||[]).length); })) ok++;
    total++; if(await step('getNodarbibas (ar tokenu)', async()=>{ var r=await api('getNodarbibas'); if(!r||!r.ok) throw (r||{reason:'nav_atbildes'}); return 'count='+((r.nodarbibas||[]).length); })) ok++;
    total++; if(await step('getKaskade', async()=>{ var r=await api('getKaskade'); if(!r||!r.ok) throw (r||{reason:'nav_atbildes'}); var c=[(r.nodarbibu_veidi||[]).length,(r.merki||[]).length,(r.problemas||[]).length,(r.uzdevumi||[]).length]; return 'NV/M/P/U='+c.join('/'); })) ok++;

    total++; if(await step('fillVeidne 1:1 eksports (tests)', async()=>{
      var sample={ klients:'TESTS', datums:'01.01.2026', nodarbiba_nosaukums:'Tests', merkis:'Tests', problema:'Tests', uzdevums:'Tests', refleksija:'Tests', motivacija:'Tests', gaita:'Tests', garastavoklis:'Tests', vertejums:'Tests', pildits:'Tests', komentars:'Diagnostikas tests', darbinieks:(currentUser&&currentUser().name)||'Tests', employee_id:(currentUser&&currentUser().id)||'' };
      var r=await api('fillVeidne', sample);
      if(!r) throw {reason:'nav_atbildes'};
      if(!r.ok) throw r;
      if(!r.fileBase64) throw r; // satur exportWarning/err
      return 'OK, fileBase64='+String(r.fileBase64||'').length+' chars, file='+ (r.fileName||'');
    })) ok++;
  } else {
    log('WARN  Nav aktīva tokena — ielogojieties, lai palaistu datu un fillVeidne testus. (Pēc ielogošanās var palaist SRS.test() konsolē.)');
  }

  log('');
  log('Kopsavilkums: '+ok+'/'+total+' PASS');
  if(ok<total){
    log('');
    log('Ieteikumi:');
    log('- "nav_kopējā_parole": tokens neder šim Web App → izlogojieties un ielogojieties no jauna (vai SRS.relogin()).');
    log('- "export_klaida" + err par atļaujām: Apps Script projektā (..Txhi9Lqokw/exec) ielīmējiet lokālo excel-veidne.gs un code.gs, autorizējiet scopes (Drive/Spreadsheets/external_request), tad Deploy → Edit → New version. Rediģējiet appsscript.json un palaidiet autorizācijas funkciju.');
    log('- Ja ielādējas vecs kods/URL: SRS.reset() vai Ctrl+F5 un pārbaudiet Network → config.js?v=2.0.6 un fillVeidne POST uz pareizo URL.');
    log('- Konsolē: SRS.diag() (detalizēti), SRS.test(), SRS.relogin(), SRS.reset().');
  }
  try{ if(window.SRS_DEBUG && window.SRS_DEBUG.last && window.SRS_DEBUG.last.fillVeidne && !window.SRS_DEBUG.last.fillVeidne.ok){ log(''); log('Pēdējā fillVeidne kļūda: '+j(window.SRS_DEBUG.last.fillVeidne)); } }catch(e){}
}

document.addEventListener('DOMContentLoaded', function(){
  var b=byId('runBtn'); if(b) b.addEventListener('click', runTests);
  var r=byId('resetBtn'); if(r) r.addEventListener('click', function(){ if(window.SRS && SRS.reset) SRS.reset(); else location.reload(true); });
  var d=byId('diagBtn'); if(d) d.addEventListener('click', function(){ var o=byId('out'); if(o) o.textContent=_srsDiagText()+'\n\n'+JSON.stringify(window.SRS?SRS.info():{}, null, 2); if(window.SRS) SRS.diag(); });
});
