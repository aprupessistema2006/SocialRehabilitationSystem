// ============================================================
// excel-veidne.gs  —  Apps Script serverpusējais veidņa aizpildītājs
// Pievieno šo failu savā Apps Script projektā (kopā ar code.gs).
// Nemaina formatēšanu, ieliek tikai vērtības konkrētajās šūnās.
// ============================================================

// Google Sheet ar veidni (1:1 aizpildei un eksportam)
const VEIDNE_SS_ID = "1RaPuUUcr7YY3vCBT7zwbsvt_ZRR0B1Tv5SCRvZSa35A";
const VEIDNE_LAPA = "Nodarbību gaita";
const VEIDNE_GID = "871346066"; // lapas gid (no URL #gid=...)

// Precīzas šūnu adreses (1:1 ar veidni)
const VEIDNE_CELLS = {
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

// Iestatījumu konfigurācijas atslēgas un to saistība ar veidņu šūnām
const CFG_KEYS = {
  activity_eval: 'cfg_vertejums',
  activity_implementation: 'cfg_pildits',
  activity_process: 'cfg_gaita',
  client_mood: 'cfg_garastavoklis',
  client_motivation: 'cfg_motivacija'
};
// cfg_refleksija nav veidņu šūnā, tā tiek parādīta citā veidnē / eksportā

function getIestatijumiFromSheet(ss){
  try{
    var sh = ss.getSheetByName('Iestatijumi');
    if(!sh) return {};
    var d = sh.getDataRange().getValues();
    var obj = {};
    d.forEach(function(r){ if(r[0]) obj[String(r[0])] = r[1]; });
    return obj;
  }catch(e){ return {}; }
}

function cfgLabel(cfg, key, value){
  if(value==null || value==='') return value;
  var raw = cfg[key];
  if(!raw) return value;
  var items = [];
  try{ items = JSON.parse(raw); }catch(e){ return value; }
  if(!Array.isArray(items)) return value;
  var match = items.find(function(it){
    var v = it.value !== undefined ? it.value : it.id;
    return String(v) === String(value);
  });
  return match && match.label ? match.label : value;
}

function mapRecordToCells(record, cfg){
  record = record || {};
  cfg = cfg || {};
  return {
    client_full_name: record.klients || '',
    act_employee: record.darbinieks || '',
    activity_area: record.nodarbiba_nosaukums || '',
    activity_comment: record.komentars || '',
    activity_date: record.datums || '',
    activity_eval: cfgLabel(cfg, 'cfg_vertejums', record.vertejums) || record.vertejums || '',
    activity_goal: record.merkis || '',
    activity_implementation: cfgLabel(cfg, 'cfg_pildits', record.pildits) || record.pildits || '',
    activity_implementation_after: '',
    activity_process: cfgLabel(cfg, 'cfg_gaita', record.gaita) || record.gaita || '',
    activity_task: record.uzdevums || '',
    client_mood: cfgLabel(cfg, 'cfg_garastavoklis', record.garastavoklis) || record.garastavoklis || '',
    client_motivation: cfgLabel(cfg, 'cfg_motivacija', record.motivacija) || record.motivacija || '',
    client_problem: record.problema || ''
  };
}

function sanitizeFilePart_(s){
  var v = String(s == null ? '' : s).replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return v || 'Klients';
}
function formatFileDate_(d){
  var s = String(d == null ? '' : d).trim();
  if(/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m) return m[3]+'.'+m[2]+'.'+m[1];
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s.replace(/\//g,'.');
  try{ return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Riga', 'dd.MM.yyyy'); }catch(e){ return s || ''; }
}

function exportSheetAsXlsxBase64_(ssId){
  // Primāri: Drive konvertācija (parasti neprasa script.external_request)
  try{
    var file = DriveApp.getFileById(ssId);
    var xblob = file.getAs(MimeType.MICROSOFT_EXCEL);
    return {
      ok: true,
      mimeType: xblob.getContentType() || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      data: Utilities.base64Encode(xblob.getBytes())
    };
  }catch(driveErr){
    // Rezerves variants: tiešs Sheets export caur UrlFetch (vajag external_request atļauju)
    try{
      var token = ScriptApp.getOAuthToken();
      var url = 'https://docs.google.com/spreadsheets/d/' + ssId + '/export?format=xlsx';
      var resp = UrlFetchApp.fetch(url, {
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true
      });
      var code = resp.getResponseCode();
      if(code >= 200 && code < 300){
        var blob = resp.getBlob();
        return {
          ok: true,
          mimeType: blob.getContentType() || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          data: Utilities.base64Encode(blob.getBytes())
        };
      }
      return { ok:false, reason:'export_http_' + code, err:String(driveErr) };
    }catch(urlErr){
      return { ok:false, reason:'export_klaida', err:String(driveErr) + ' | ' + String(urlErr) };
    }
  }
}

function fillVeidne(data){
  if(!VEIDNE_SS_ID){
    return {ok:false, reason:'nav_konfigurets_veidne_ss_id', hint:'Iestatiet VEIDNE_SS_ID excel-veidne.gs'};
  }
  var tempSheet = null;
  var tempSsId = null;
  try{
    var ss = SpreadsheetApp.openById(VEIDNE_SS_ID);
    var sh = ss.getSheetByName(VEIDNE_LAPA);
    if(!sh){
      return {ok:false, reason:'nav_lapa:' + VEIDNE_LAPA};
    }
    // Ielādē iestatījumus, lai konvertētu skaitļus uz tekstu labeliem
    var cfg = getIestatijumiFromSheet(ss);

    // 1) Pagaidu kopija oriģinālajā izklājlapā (1:1 formatējums), lai neaiztiktu veidni
    tempSheet = sh.copyTo(ss);
    var tmpName = '_tmp_veidne_' + Utilities.getUuid().slice(0, 8);
    tempSheet.setName(tmpName);

    // 2) Ieraksta tikai vērtības noteiktajās šūnām (tekstlabeli vietā, kas būtu skaitļi)
    var values = mapRecordToCells(data || {}, cfg);
    var pildito = 0;
    Object.keys(values).forEach(function(name){
      var addr = VEIDNE_CELLS[name];
      if(addr){
        var range = tempSheet.getRange(addr);
        range.setValue(values[name]);
        // Teksta slāps un rindu augstuma pielāgošana
        range.setWrap(true);
        range.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
        range.setVerticalAlignment('top');
        pildito++;
      }
    });

    // 3) Rindu augstuma pielāgošana satura garumam (wrapText atbalstīts)
    Object.keys(VEIDNE_CELLS).forEach(function(name){
      var addr = VEIDNE_CELLS[name];
      var range = tempSheet.getRange(addr);
      var val = String(values[name] || '');
      if(val.length > 0){
        var row = range.getRow();
        var col = range.getColumn();
        var colWidth = tempSheet.getColumnWidth(col) || 100;
        var charsPerLine = Math.max(8, Math.floor(colWidth / 7));
        var lines = Math.ceil(val.length / charsPerLine);
        var estHeight = Math.max(18, lines * 14 + 6);
        var currentHeight = tempSheet.getRowHeight(row) || 18;
        if(estHeight > currentHeight){
          tempSheet.setRowHeight(row, estHeight);
        }
      }
    });

    SpreadsheetApp.flush();

    // 4) Atsevišķa īslaicīga izklājlapa ar tikai šo aizpildīto lapu -> drošs 1:1 XLSX eksports
    var tempSs = SpreadsheetApp.create('tmp_veidne_' + Utilities.getUuid().slice(0, 8));
    tempSsId = tempSs.getId();
    var copied = tempSheet.copyTo(tempSs);
    copied.setName(VEIDNE_LAPA);
    var sheets = tempSs.getSheets();
    for(var i=0;i<sheets.length;i++){
      if(sheets[i].getSheetId() !== copied.getSheetId()){
        try{ tempSs.deleteSheet(sheets[i]); }catch(eDel){}
      }
    }
    SpreadsheetApp.flush();

    var exp = exportSheetAsXlsxBase64_(tempSsId);
    var out = {
      ok:true,
      filled:pildito,
      sheet:VEIDNE_LAPA,
      ssId: VEIDNE_SS_ID
    };
    if(exp && exp.ok && exp.data){
      out.fileBase64 = exp.data;
      var klienta = sanitizeFilePart_(values.client_full_name || (data && data.klients) || 'Klients');
      var dat = formatFileDate_(values.activity_date || (data && data.datums) || '');
      out.fileName = klienta + '_Nodarbibas_veidne_' + dat + '.xlsx';
      out.mimeType = exp.mimeType;
    } else {
      if(exp && !exp.ok){
        out.exportWarning = exp.reason || 'export_failed';
        if(exp.err) out.err = exp.err;
      } else {
        out.exportWarning = 'export_failed';
      }
    }
    return out;
  }catch(err){
    return {ok:false, reason:'klaida', err:String(err)};
  }finally{
    // Tīrīšana: pagaidu lapa oriģinālajā un pagaidu izklājlapa
    try{
      if(tempSheet){
        var ss2 = SpreadsheetApp.openById(VEIDNE_SS_ID);
        ss2.deleteSheet(tempSheet);
      }
    }catch(cleanErr){}
    try{
      if(tempSsId){
        try{ DriveApp.getFileById(tempSsId).setTrashed(true); }
        catch(d1){ Drive.Files.remove(tempSsId); }
      }
    }catch(cleanErr2){}
  }
}
