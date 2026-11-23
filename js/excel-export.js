/* Eksports uz Excel (.xlsx) - klientpusē, bez achtera maiņām */
async function exportNodarbibasToExcel(nodarbibas, filename){
  if(!nodarbibas || !nodarbibas.length){
    var el=byId('pageMsg'); if(el){ el.textContent='Nav datu eksportam.'; el.style.display='block'; }
    return;
  }
  var cfg = await getCfg();
  function lab(key, value){ return cfgLabel(cfg, key, value) || value || ''; }
  var headers=[
    'Klienta vārds/uzvārds','Datums','Nodarbība','Mērķis','Problēma','Uzdevums','Refleksija','Motivācija','Gaita','Garastāvoklis','Vērtējums','Pildīts','Komentārs','Darbinieks','Darbinieks ID'
  ];
  var wsData=[headers];
  nodarbibas.forEach(function(r){
    wsData.push([
      r.klients||'', r.datums||'', r.nodarbiba_nosaukums||'', r.merkis||'', r.problema||'', r.uzdevums||'',
      lab('cfg_refleksija', r.refleksija), lab('cfg_motivacija', r.motivacija), lab('cfg_gaita', r.gaita),
      lab('cfg_garastavoklis', r.garastavoklis), lab('cfg_vertejums', r.vertejums), lab('cfg_pildits', r.pildits),
      r.komentars||'', r.darbinieks||'', r.employee_id||''
    ]);
  });
  var ws=XLSX.utils.aoa_to_sheet(wsData);

  /* Šūnu stilizēšana: tekstu slāpts, rindas augstums pielāgojas platumam */
  var maxCols=headers.length;
  var colWidths=[];
  for(var c=0;c<maxCols;c++){ colWidths[c]=10; }
  var rowHeights=[];
  var headerRowHeight=30;
  rowHeights.push(headerRowHeight);
  for(var r=1;r<wsData.length;r++){
    var needHeight=16;
    for(var c=0;c<maxCols;c++){
      var cell=String(wsData[r][c]||'');
      if(cell.length>colWidths[c]) colWidths[c]=Math.min(cell.length, 60);
      var lines=Math.ceil(cell.length / Math.max(colWidths[c], 8));
      if(lines>1 && needHeight < lines*14+6) needHeight=lines*14+6;
    }
    rowHeights.push(Math.max(needHeight, 16));
  }

  var cellStyle={ alignment:{ wrapText:true, vertical:'top', horizontal:'left' } };
  var range=XLSX.utils.decode_range(ws['!ref']||'A1');
  for(var R=range.s.r;R<=range.e.r;R++){
    for(var C=range.s.c;C<=range.e.c;C++){
      var cellRef=XLSX.utils.encode_cell({r:R,c:C});
      var cell=ws[cellRef];
      if(!cell) continue;
      cell.s=cell.s||{};
      cell.s.alignment=cellStyle.alignment;
    }
  }

  ws['!cols']=colWidths.map(function(w){ return {wch:w}; });
  ws['!rows']=rowHeights.map(function(h){ return {h:h}; });

  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nodarbības');
  XLSX.writeFile(wb, filename||'nodarbibas_'+new Date().toISOString().slice(0,10)+'.xlsx');
}
document.addEventListener('DOMContentLoaded', function(){
  var btnSel=byId('exportSelectedBtn');
  var btnAll=byId('exportExcelBtn');
  if(btnSel){
    btnSel.addEventListener('click', async function(){
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
      await exportNodarbibasToExcel(data, 'nodarbibu_klienti_'+new Date().toISOString().slice(0,10)+'.xlsx');
    });
  }
  if(btnAll){
    btnAll.addEventListener('click', async function(){
      var nodarbibas = window._hist || [];
      if(!nodarbibas.length){
        var msg=byId('pageMsg'); if(msg){ msg.textContent='Nav datu eksportam.'; msg.style.display='block'; }
        return;
      }
      await exportNodarbibasToExcel(nodarbibas, 'nodarbibu_visiem_'+new Date().toISOString().slice(0,10)+'.xlsx');
    });
  }
});
