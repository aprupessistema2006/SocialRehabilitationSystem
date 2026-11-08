/* Eksports uz Excel (.xlsx) - klientpusē, bez achtera maiņām */
function exportNodarbibasToExcel(nodarbibas, filename){
  if(!nodarbibas || !nodarbibas.length){
    var el=byId('pageMsg'); if(el){ el.textContent='Nav datu eksportam.'; el.style.display='block'; }
    return;
  }
  var wsData=[
    ['Klienta vārds/uzvārds','Datums','Nodarbība','Mērķis','Problēma','Uzdevums','Refleksija','Motivācija','Gaita','Garastāvoklis','Vērtējums','Pildīts','Komentārs','Darbinieks','Darbinieks ID']
  ];
  nodarbibas.forEach(function(r){
    wsData.push([
      r.klients||'', r.datums||'', r.nodarbiba_nosaukums||'', r.merkis||'', r.problema||'', r.uzdevums||'',
      r.refleksija||'', r.motivacija||'', r.gaita||'', r.garastavoklis||'', r.vertejums||'', r.pildits||'',
      r.komentars||'', r.darbinieks||'', r.employee_id||''
    ]);
  });
  var ws=XLSX.utils.aoa_to_sheet(wsData);
  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nodarbības');
  XLSX.writeFile(wb, filename||'nodarbibas_'+new Date().toISOString().slice(0,10)+'.xlsx');
}
document.addEventListener('DOMContentLoaded', function(){
  var btnSel=byId('exportSelectedBtn');
  var btnAll=byId('exportExcelBtn');
  if(btnSel){
    btnSel.addEventListener('click', function(){
      var nodarbibas = window._hist || [];
      if(!nodarbibas.length){
        var msg=byId('pageMsg'); if(msg){ msg.textContent='Nav datu eksportam.'; msg.style.display='block'; }
        return;
      }
      var data = window._selectedClients && window._selectedClients.size ? nodarbibas.filter(function(r){ return window._selectedClients.has(r.klients); }) : nodarbibas;
      if(!data.length){
        var msg=byId('pageMsg'); if(msg){ msg.textContent='Nav datu atlāsajiem klientiem.'; msg.style.display='block'; }
        return;
      }
      exportNodarbibasToExcel(data, 'nodarbibu_klienti_'+new Date().toISOString().slice(0,10)+'.xlsx');
    });
  }
  if(btnAll){
    btnAll.addEventListener('click', function(){
      var nodarbibas = window._hist || [];
      if(!nodarbibas.length){
        var msg=byId('pageMsg'); if(msg){ msg.textContent='Nav datu eksportam.'; msg.style.display='block'; }
        return;
      }
      exportNodarbibasToExcel(nodarbibas, 'nodarbibu_visiem_'+new Date().toISOString().slice(0,10)+'.xlsx');
    });
  }
});
