/* Nodarbības veidņa templates aizpildītājs - Excel (.xlsx)
   Ielādē nodarb_veid.xlsx no repo, ieliek datus noteiktās šķēlēm un lejupielādē. */
var TEMPLATE_CELLS = {
  'B3':  'klients',          // Klients
  'C24': 'darbinieks',       // Darbinieks
  'C5':  'nodarbiba_nosaukums', // Nodarbības nosaukums
  'A23': 'komentars',        // Komentārs/piezīme
  'E3':  'datums',           // Datums
  'D15': 'vertejums',        // Nodarbības vērtējums
  'B7':  'merkis',           // Mērķis
  'A19': 'pildits',          // Programmas izpilde
  'D13': 'gaita',            // Nodarbības gaita
  'B10': 'uzdevums',         // Uzdevums
  'D14': 'garastavoklis',    // Garastāvoklis
  'D12': 'motivacija',       // Sadarbība un motivācija
  'B8':  'problema'          // Klienta problēma
};

async function exportActivityToTemplate(activity){
  try{
    var resp = await fetch('../nodarb_veid.xlsx');
    if(!resp.ok) throw new Error('Nevarēja atvērt nodarb_veid.xlsx: ' + resp.status);
    var ab = await resp.arrayBuffer();
    var wb = XLSX.read(ab, {type:'array'});
    var ws = wb.Sheets[wb.SheetNames[0]];
    Object.keys(TEMPLATE_CELLS).forEach(function(cell){
      var field = TEMPLATE_CELLS[cell];
      var val = activity[field] == null ? '' : activity[field];
      if(!ws[cell]){ ws[cell] = {t:'s', v:String(val)}; }
      else { ws[cell].v = val; ws[cell].t = typeof val==='number'?'n':'s'; }
    });
    var fname = 'Nodarbiba_forma_' + (activity.id||'') + '_' + new Date().toISOString().slice(0,10) + '.xlsx';
    XLSX.writeFile(wb, fname);
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
