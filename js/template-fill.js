/* Nodarbības forma 1:1 uz Excel veidli (nodarb_veid.xlsx).
   Tikai šūnu vērtības, bez formatēšanas maiņām, bez nevairošiem pogādājumiem. */
var TEMPLATE_URL = '../nodarb_veid.xlsx';
var SHEET_NAME = 'Nodarbību gaita';

/* Konkrētās šūnu adreses pēc lietotāja specifikācijas (nav ieteikumi). */
var CELL_BY_NAME = {
  client_full_name: 'B3',
  act_employee: 'C26',
  activity_area: 'C5',
  activity_comment: 'A25',
  activity_date: 'E3',
  activity_eval: 'D15',
  activity_goal: 'B7',
  activity_implementation: 'A19',
  activity_implementation_after: 'A21',
  activity_process: 'D13',
  activity_task: 'B10',
  client_mood: 'D14',
  client_motivation: 'D12',
  client_problem: 'B8'
};

function sanitizeFilename(s){
  return String(s==null?'':s).trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g,'').replace(/\s+/g,'_') || 'klients';
}
function fmtPrepDate(){
  var d=new Date();
  var dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0');
  return dd+'.'+mm+'.'+d.getFullYear();
}
function defaultFilename(r){
  return sanitizeFilename(r.klients)+'_'+fmtPrepDate()+'.xlsx';
}

function setCellValue(ws, addr, value){
  var c = ws[addr];
  if(!c){ c = {}; ws[addr] = c; }
  c.t = 's';
  c.v = value==null ? '' : String(value);
  delete c.f;
  delete c.w;
  delete c.R;
  /* c.s (stils) paliek neierikstēts – nav formatēšanas maiņas */
}

function buildRecordValues(r){
  return {
    client_full_name: r.klients || '',
    act_employee: r.darbinieks || '',
    activity_area: r.nodarbiba_nosaukums || '',
    activity_comment: r.komentars || '',
    activity_date: r.datums || '',
    activity_eval: r.vertejums || '',
    activity_goal: r.merkis || '',
    activity_implementation: r.pildits || '',
    activity_implementation_after: '',
    activity_process: r.gaita || '',
    activity_task: r.uzdevums || '',
    client_mood: r.garastavoklis || '',
    client_motivation: r.motivacija || '',
    client_problem: r.problema || ''
  };
}

function exportActivityToExcel(r, filename){
  if(typeof XLSX === 'undefined'){
    console.error('XLSX bibliotēka nav ielādēta.');
    return Promise.reject(new Error('XLSX bibliotēka nav ielādēta.'));
  }
  if(!r) return Promise.reject(new Error('Nav ieraksta datiem.'));
  var values = buildRecordValues(r);
  var outName = filename || defaultFilename(r);
  return fetch(TEMPLATE_URL, {cache:'no-store'}).then(function(resp){
    if(!resp.ok) throw new Error('Neizdevās ielādēt Excel veidli ('+resp.status+').');
    return resp.arrayBuffer();
  }).then(function(buffer){
    var wb = XLSX.read(buffer, {type:'array', cellStyles:true});
    var ws = wb.Sheets[SHEET_NAME];
    if(!ws) throw new Error('Lapa „'+SHEET_NAME+'” nav atrasta veidlī.');
    Object.keys(values).forEach(function(name){
      var addr = CELL_BY_NAME[name];
      if(addr) setCellValue(ws, addr, values[name]);
    });
    XLSX.writeFile(wb, outName);
  }).catch(function(err){
    console.error('Excel eksporta kļūda:', err);
    var el = null;
    if(typeof byId === 'function'){
      el = byId('formAlert') || byId('pageMsg');
    }
    if(el){ el.textContent='Excel eksporta kļūda: '+err.message; el.className='alert alert-error'; el.style.display='block'; }
    throw err;
  });
}
