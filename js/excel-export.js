/* Eksports uz Excel (.xlsx) - klientpusē, bez achtera maiņām */
function exportNodarbibasToExcel(nodarbibas, filename){
  if(!nodarbibas || !nodarbibas.length){
    var el=byId('pageMsg'); if(el){ el.textContent='Nav datu eksportam.'; el.style.display='block'; }
    return;
  }
  var wsData=[
    ['ID','Datums','Klients','Nodarbība','Darbinieks','Mērķis','Problēma','Uzdevums','Refleksija','Motivācija','Gaita','Garastāvoklis','Vērtējums','Pildīts','Komentārs','Darbinieks ID','Darbinieks vārds']
  ];
  nodarbibas.forEach(function(r){
    wsData.push([
      r.id||'', r.datums||'', r.klients||'', r.nodarbiba_nosaukums||'', r.darbinieks||'',
      r.merkis||'', r.problema||'', r.uzdevums||'', r.refleksija||'', r.motivacija||'',
      r.gaita||'', r.garastavoklis||'', r.vertejums||'', r.pildits||'', r.komentars||'',
      r.employee_id||'', r.darbinieks||''
    ]);
  });
  var ws=XLSX.utils.aoa_to_sheet(wsData);
  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nodarbības');
  XLSX.writeFile(wb, filename||'nodarbibas_'+new Date().toISOString().slice(0,10)+'.xlsx');
}
document.addEventListener('DOMContentLoaded', function(){
  var btn=byId('exportExcelBtn');
  if(btn){
    btn.addEventListener('click', function(){
      var nodarbibas = window._hist || [];
      if(!nodarbibas.length){
        var msg=byId('pageMsg'); if(msg){ msg.textContent='Nav datu eksportam.'; msg.style.display='block'; }
        return;
      }
      exportNodarbibasToExcel(nodarbibas, 'nodarbibu_vesture_'+new Date().toISOString().slice(0,10)+'.xlsx');
    });
  }
});
