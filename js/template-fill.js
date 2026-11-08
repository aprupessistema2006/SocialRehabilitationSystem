/* Nodarbības veidņa templates aizpildītājs - Excel (.xlsx)
   Atver oriģinālo nodarb_veid.xlsx, maina tikai 13 noteiktās šūnas,
   saglabā visu esošo stilu un formātējumu. */
var TEMPLATE_CELLS = {
  'B3':  'klients',
  'C24': 'darbinieks',
  'C5':  'nodarbiba_nosaukums',
  'A23': 'komentars',
  'E3':  'datums',
  'D15': 'vertejums',
  'B7':  'merkis',
  'A19': 'pildits',
  'D13': 'gaita',
  'B10': 'uzdevums',
  'D14': 'garastavoklis',
  'D12': 'motivacija',
  'B8':  'problema'
};

async function exportActivityToTemplate(activity){
  try{
    var resp = await fetch('../nodarb_veid.xlsx');
    if(!resp.ok) throw new Error('Nevarēja atvērt nodarb_veid.xlsx: ' + resp.status);
    var ab = await resp.arrayBuffer();
    var wb = XLSX.read(ab, {type:'array', cellStyles: true});
    var ws = wb.Sheets[wb.SheetNames[0]];
    Object.keys(TEMPLATE_CELLS).forEach(function(cell){
      var field = TEMPLATE_CELLS[cell];
      var val = activity[field] == null ? '' : activity[field];
      var oldStyle = ws[cell] ? ws[cell].s : undefined;
      ws[cell] = {t: typeof val==='number'?'n':'s', v: val, s: oldStyle};
    });
    var fname = 'Nodarbiba_forma_' + (activity.id||'') + '_' + new Date().toISOString().slice(0,10) + '.xlsx';
    XLSX.writeFile(wb, fname, {cellStyles: true, bookType:'xlsx'});
  }catch(e){
    console.error('Template fill error:', e);
    var el=byId('pageMsg'); if(el){ el.textContent='Neizdevās ģenerēt Excel formu: '+(e.message||e); el.style.display='block'; }
  }
}
document.addEventListener('DOMContentLoaded', function(){
  var btn = byId('viewExportBtn');
  if(btn){
    btn.addEventListener('click', function(){
      var act = window._currentViewRecord || null;
      if(!act){
        var el=byId('pageMsg'); if(el){ el.textContent='Nav ieraksta exportam.'; el.style.display='block'; }
        return;
      }
      exportActivityToTemplate(act);
    });
  }
});
