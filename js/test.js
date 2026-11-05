async function runTests(){
  var out=byId('out'); var lines=[]; function log(s){ lines.push(s); out.textContent=lines.join('\n'); }
  async function step(name,fn){ try{ var d=await fn(); log('PASS  '+name+(d?' — '+d:'')); return true; }catch(e){ log('FAIL  '+name+' — '+(e.message||e)); return false; } }
  lines=[]; log('WEBAPP: '+WEBAPP_URL);
  var ok=0,total=0;
  total++; if(await step('login D001/1234', async()=>{ var r=await api('login',{employee_id:'D001',pin:'1234'}); if(!r.ok) throw new Error(JSON.stringify(r)); return r.employee_name+' '+r.role; })) ok++;
  total++; if(await step('seedTestData (2 klienti, 2 darbinieki, kaskāde, nodarbība)', async()=>{ var r=await api('seedTestData'); if(!r.ok) throw new Error(JSON.stringify(r)); return 'ok'; })) ok++;
  total++; if(await step('getLietotaji satur D001, D002', async()=>{ var r=await api('getLietotaji'); var ids=(r.lietotaji||[]).map(function(x){return x.employee_id;}); if(!ids.includes('D001')||!ids.includes('D002')) throw new Error(ids.join(',')); return ids.join(', '); })) ok++;
  total++; if(await step('getKlienti satur >= 2', async()=>{ var r=await api('getKlienti'); if((r.klienti||[]).length<2) throw new Error('count='+((r.klienti||[]).length)); return (r.klienti||[]).slice(0,2).map(function(x){return x.vards;}).join(' | '); })) ok++;
  total++; if(await step('getKaskade NV/M/P/U aizpildīta', async()=>{ var r=await api('getKaskade'); var c=[(r.nodarbibu_veidi||[]).length,(r.merki||[]).length,(r.problemas||[]).length,(r.uzdevumi||[]).length]; if(c.some(function(n){return n<1;})) throw new Error(c.join('/')); return 'NV/M/P/U='+c.join('/'); })) ok++;
  total++; if(await step('getNodarbibas satur ierakstus', async()=>{ var r=await api('getNodarbibas'); if(!(r.nodarbibas||[]).length) throw new Error('0'); return 'count='+r.nodarbibas.length; })) ok++;
  total++; if(await step('getSakums D001 statistika', async()=>{ var r=await api('getSakums',{employee_id:'D001'}); if(!r.ok) throw new Error(JSON.stringify(r)); return JSON.stringify({aktivie:r.aktivie,sodien:r.sodien,kopskaits:r.kopskaits,mani:r.mani}); })) ok++;
  log('\nSummary: '+ok+'/'+total+' passed');
  if(ok<total) log('Ja FAIL: iekopē lokālo code.gs Apps Script projektā, pārbaudi doPost/action maršrutēšanu un deploy jaunu Web App versiju.');
}
document.addEventListener('DOMContentLoaded', function(){ var b=byId('runBtn'); if(b) b.addEventListener('click', runTests); });
