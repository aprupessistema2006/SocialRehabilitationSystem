const SS_ID = "1RaPuUUcr7YY3vCBT7zwbsvt_ZRR0B1Tv5SCRvZSa35A";
const APP_VERSION = "1.0.6";

function getAccessPassword() {
  try {
    var sh = getSheet('Iestatijumi');
    var d = sh.getDataRange().getValues();
    for (var i = 1; i < d.length; i++) {
      if (String(d[i][0]) === 'access_password' && d[i][1] != null && String(d[i][1]).trim() !== '') {
        return String(d[i][1]).trim();
      }
    }
  } catch (e) {}
  var props = PropertiesService.getScriptProperties();
  var p = props.getProperty('ACCESS_PASSWORD');
  if (p) return p;
  return 'VainodeSAC123*';
}

function checkAccess(data) {
  if (!data) return false;
  if (data.access_token) return validateToken(data.access_token);
  if (data.access_password) return data.access_password === getAccessPassword();
  return false;
}

function grantToken() {
  var token = 'tok_' + Utilities.getUuid().replace(/-/g, '') + '_' + Date.now();
  var exp = Date.now() + 8 * 60 * 60 * 1000;
  var props = PropertiesService.getScriptProperties();
  props.setProperty('TOKEN_' + token, String(exp));
  return { ok: true, token: token, expires_in: 8 * 60 * 60 };
}

function validateToken(token) {
  if (!token) return false;
  var props = PropertiesService.getScriptProperties();
  var exp = props.getProperty('TOKEN_' + token);
  if (!exp) return false;
  if (Number(exp) < Date.now()) { props.deleteProperty('TOKEN_' + token); return false; }
  return true;
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SS_ID);
  return ss.getSheetByName(sheetName);
}

function getAppVersion(){
  try{
    var sh=getSheet('Iestatijumi'); var d=sh.getDataRange().getValues();
    for(var i=1;i<d.length;i++){ if(String(d[i][0])==='app_version' && d[i][1]!=null && String(d[i][1]).trim()!=='') return String(d[i][1]).trim(); }
  }catch(e){}
  return APP_VERSION;
}
function getAppInfo(){ return {ok:true, app_version:getAppVersion()}; }
function getAktivieDarbinieki() {
  const sh = getSheet("Darbinieki");
  const data = sh.getDataRange().getValues();
  const res = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[4]).toUpperCase() === "TRUE") {
      res.push({
        employee_id: row[0],
        employee_name: row[1],
        role: row[3]
      });
    }
  }
  return res;
}

function pieteiktiesArPinUnId(employee_id, pin) {
  const sh = getSheet("Darbinieki");
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]) === String(employee_id) && String(row[2]) === String(pin)) {
      if (String(row[4]).toUpperCase() === "TRUE") {
        return {
          ok: true,
          employee_id: row[0],
          employee_name: row[1],
          role: row[3],
          app_version: getAppVersion()
        };
      } else {
        return { ok: false, reason: "konts_neaktivs" };
      }
    }
  }
  return { ok: false, reason: "nepareizs_pin" };
}

// --- Extended backend (local source; deploy to Apps Script manually) ---
function doPost(e) {
  try {
    var data = {};
    if (e.parameter && e.parameter.data) data = JSON.parse(e.parameter.data);
    else if (e.postData && e.postData.contents) { try { data = JSON.parse(e.postData.contents); } catch(err) { data = {}; } }
    var a = data.action;
    if (a === 'getAppInfo') return corsJsonOut(getAppInfo());
    if (!checkAccess(data)) return corsJsonOut({ok:false, reason:'nav_kopējā_parole'});
    if (a === 'getEmployees') return corsJsonOut({ok:true, employees:getAktivieDarbinieki()});
    if (a === 'login' && data.employee_id && data.pin) {
    var r = pieteiktiesArPinUnId(data.employee_id, data.pin);
    if (r && r.ok) {
      var t = grantToken();
      r.token = t.token;
      r.expires_in = t.expires_in;
    }
    return corsJsonOut(r);
  }
    if (a === 'getSakums') return corsJsonOut(JSON.parse(getSakums({ parameter:{data:JSON.stringify(data)} }).getContent()));
    if (a === 'getKlienti') return getKlienti();
    if (a === 'saveKlients') return saveKlients(data);
    if (a === 'getKaskade') return getKaskade();
    if (a === 'saveNodarbibasVeids') return saveNodarbibasVeids(data);
    if (a === 'saveMerkis') return saveMerkis(data);
    if (a === 'saveProblema') return saveProblema(data);
    if (a === 'saveUzdevums') return saveUzdevums(data);
    if (a === 'deleteKaskadeItem') return deleteKaskadeItem(data);
    if (a === 'getNodarbibas') return getNodarbibas(data);
    if (a === 'saveNodarbiba') return saveNodarbiba(data);
    if (a === 'fillVeidne') return fillVeidne(data);
    if (a === 'createFirstEmployee') return createFirstEmployee(data);
    if (a === 'getLietotaji') return getLietotaji();
    if (a === 'saveLietotajs') return saveLietotajs(data);
    if (a === 'getIestatijumi') return getIestatijumi();
    if (a === 'saveIestatijumi') return saveIestatijumi(data);
    if (a === 'seedTestData') return corsJsonOut(seedTestData());
    return corsJsonOut({ok:false, reason:'nepareizs_pieprasījums', action:a||null});
  } catch(err) { return corsJsonOut({ok:false, reason:'kļūda', err:String(err)}); }
}
// --- CORS helpers ---
function addCorsHeaders(output) {
  return output;
}
function corsJsonOut(obj){
  return addCorsHeaders(ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON));
}
function corsPlainOut(txt){
  return addCorsHeaders(ContentService.createTextOutput(txt).setMimeType(ContentService.MimeType.TEXT));
}

function doGet(e){
  if(e && e.parameter && e.parameter._method === 'OPTIONS'){
    return corsPlainOut('');
  }
  return corsJsonOut({ok:false, reason:'izlasi_POST', allow:'POST'});
}
function rows(sh){ if(!sh) return []; var d=sh.getDataRange().getValues(); return d.length>1?d.slice(1):[]; }
function nextId(prefix, existing){ var n=1; existing.forEach(function(id){ var m=String(id).match(/(\d+)/); if(m){ var v=parseInt(m[1],10); if(v>=n) n=v+1; } }); return prefix+String(n).padStart(3,'0'); }
function getKaskade(){
  try{
    var sheets={nv:'Nodarbibu_veidi',m:'Merki',p:'Problemas',u:'Uzdevumi'};
    var out={};
    Object.keys(sheets).forEach(function(key){
      var sh=getSheet(sheets[key]);
      if(!sh){
        sh=SpreadsheetApp.openById(SS_ID).insertSheet(sheets[key]);
        sh.appendRow(['id','nosaukums','aktivs']);
      }
      out[key]=rows(sh);
    });
    var nv=out.nv.map(function(r){return {id:r[0],nosaukums:r[1],aktivs:String(r[2]).toUpperCase()!=='FALSE'};});
    var m=out.m.map(function(r){return {id:r[0],nv_id:r[1],nosaukums:r[2],aktivs:String(r[3]).toUpperCase()!=='FALSE'};});
    var p=out.p.map(function(r){return {id:r[0],merkis_id:r[1],nosaukums:r[2],aktivs:String(r[3]).toUpperCase()!=='FALSE'};});
    var u=out.u.map(function(r){return {id:r[0],problema_id:r[1],nosaukums:r[2],aktivs:String(r[3]).toUpperCase()!=='FALSE'};});
    return corsJsonOut({ok:true,nodarbibu_veidi:nv,merki:m,problemas:p,uzdevumi:u});
  }catch(e){
    return corsJsonOut({ok:true,nodarbibu_veidi:[],merki:[],problemas:[],uzdevumi:[]});
  }
}
function saveNodarbibasVeids(data){
  var sh=getSheet('Nodarbibu_veidi'); var id=data.id||nextId('NV', rows(sh).map(function(r){return r[0];}));
  if(data.id){ var d=sh.getDataRange().getValues(); for(var i=1;i<d.length;i++){ if(String(d[i][0])===String(id)){ sh.getRange(i+1,2,1,2).setValues([[data.nosaukums||'',data.aktivs!==false]]); return corsJsonOut({ok:true,id:id}); } } }
  sh.appendRow([id,data.nosaukums||'',data.aktivs!==false]); return corsJsonOut({ok:true,id:id});
}
function saveMerkis(data){ var sh=getSheet('Merki'); var id=data.id||nextId('M', rows(sh).map(function(r){return r[0];}));
  if(data.id){ var d=sh.getDataRange().getValues(); for(var i=1;i<d.length;i++){ if(String(d[i][0])===String(id)){ sh.getRange(i+1,2,1,3).setValues([[data.nv_id||'',data.nosaukums||'',data.aktivs!==false]]); return corsJsonOut({ok:true,id:id}); } } }
  sh.appendRow([id,data.nv_id||'',data.nosaukums||'',data.aktivs!==false]); return corsJsonOut({ok:true,id:id}); }
function saveProblema(data){ var sh=getSheet('Problemas'); var id=data.id||nextId('P', rows(sh).map(function(r){return r[0];}));
  if(data.id){ var d=sh.getDataRange().getValues(); for(var i=1;i<d.length;i++){ if(String(d[i][0])===String(id)){ sh.getRange(i+1,2,1,3).setValues([[data.merkis_id||'',data.nosaukums||'',data.aktivs!==false]]); return corsJsonOut({ok:true,id:id}); } } }
  sh.appendRow([id,data.merkis_id||'',data.nosaukums||'',data.aktivs!==false]); return corsJsonOut({ok:true,id:id}); }
function saveUzdevums(data){ var sh=getSheet('Uzdevumi'); var id=data.id||nextId('U', rows(sh).map(function(r){return r[0];}));
  if(data.id){ var d=sh.getDataRange().getValues(); for(var i=1;i<d.length;i++){ if(String(d[i][0])===String(id)){ sh.getRange(i+1,2,1,3).setValues([[data.problema_id||'',data.nosaukums||'',data.aktivs!==false]]); return corsJsonOut({ok:true,id:id}); } } }
  sh.appendRow([id,data.problema_id||'',data.nosaukums||'',data.aktivs!==false]); return corsJsonOut({ok:true,id:id}); }
function deleteKaskadeItem(data){
  var map={NV:'Nodarbibu_veidi',M:'Merki',P:'Problemas',U:'Uzdevumi'}; var sh=getSheet(map[data.type]); if(!sh) return corsJsonOut({ok:false,reason:'tips'});
  var d=sh.getDataRange().getValues(); for(var i=1;i<d.length;i++){ if(String(d[i][0])===String(data.id)){ sh.deleteRow(i+1); return corsJsonOut({ok:true}); } }
  return corsJsonOut({ok:false,reason:'nav_atrasts'});
}
function getKlienti(){ var sh=getSheet('Klienti'); var list=rows(sh).map(function(r){return {id:r[0],vards:r[1],statuss:r[2],piezimes:r[3]};}); return corsJsonOut({ok:true,klienti:list}); }
function saveKlients(data){ var sh=getSheet('Klienti'); var id=data.id||nextId('K', rows(sh).map(function(r){return r[0];}));
  if(data.id){ var d=sh.getDataRange().getValues(); for(var i=1;i<d.length;i++){ if(String(d[i][0])===String(id)){ sh.getRange(i+1,2,1,3).setValues([[data.vards||'',data.statuss||'Aktīvs',data.piezimes||'']]); return corsJsonOut({ok:true,id:id}); } } }
  sh.appendRow([id,data.vards||'',data.statuss||'Aktīvs',data.piezimes||'']); return corsJsonOut({ok:true,id:id}); }
function getLietotaji(){ var sh=getSheet('Darbinieki'); var list=rows(sh).map(function(r){return {employee_id:r[0],employee_name:r[1],pin:String(r[2]),role:r[3],active:String(r[4]).toUpperCase()!=='FALSE'};}); return corsJsonOut({ok:true,lietotaji:list}); }
function saveLietotajs(data){ var sh=getSheet('Darbinieki'); var id=data.employee_id||nextId('D', rows(sh).map(function(r){return r[0];}));
  if(data.employee_id){ var d=sh.getDataRange().getValues(); for(var i=1;i<d.length;i++){ if(String(d[i][0])===String(id)){ sh.getRange(i+1,2,1,4).setValues([[data.employee_name||'',String(data.pin||''),data.role||'USER',data.active!==false]]); return corsJsonOut({ok:true,employee_id:id}); } } }
  sh.appendRow([id,data.employee_name||'',String(data.pin||''),data.role||'USER',data.active!==false]); return corsJsonOut({ok:true,employee_id:id}); }
function getIestatijumi(){ var sh=getSheet('Iestatijumi'); var obj={}; rows(sh).forEach(function(r){ if(r[0]) obj[String(r[0])]=r[1]; }); return corsJsonOut({ok:true,iestatijumi:obj}); }
function saveIestatijumi(data){ var sh=getSheet('Iestatijumi'); var settings=data.iestatijumi||{}; var d=sh.getDataRange().getValues();
  Object.keys(settings).forEach(function(k){ var found=false; for(var i=1;i<d.length;i++){ if(String(d[i][0])===String(k)){ sh.getRange(i+1,2).setValue(settings[k]); found=true; break; } } if(!found) sh.appendRow([k,settings[k]]); });
  return corsJsonOut({ok:true}); }
function saveNodarbiba(data){
  var sh=getSheet('Nodarbibas'); var id=data.id||nextId('N', rows(sh).map(function(r){return r[0];}));
  var row=[id,data.klients||'',data.datums||'',data.nodarbiba_nosaukums||'',data.merkis||'',data.problema||'',data.uzdevums||'',data.refleksija||'',data.motivacija||'',data.gaita||'',data.garastavoklis||'',data.vertejums||'',data.pildits||'',data.komentars||'',data.employee_id||'',data.darbinieks||''];
  if(data.id){ var d=sh.getDataRange().getValues(); for(var i=1;i<d.length;i++){ if(String(d[i][0])===String(id)){ sh.getRange(i+1,1,1,row.length).setValues([row]); return corsJsonOut({ok:true,id:id}); } } }
  sh.appendRow(row); return corsJsonOut({ok:true,id:id});
}
function createFirstEmployee(data){
  if(!checkAccess(data)) return corsJsonOut({ok:false, reason:'nav_kopējā_parole'});
  var sh=getSheet('Darbinieki');
  var d=sh.getDataRange().getValues();
  if(d.length>1){ return corsJsonOut({ok:false, reason:'darbinieks_jau_eksiste'}); }
  var vards=String(data.vards||'').trim();
  var uzvards=String(data.uzvards||'').trim();
  var pin=String(data.pin||'').trim();
  if(!vards || !uzvards || !pin){ return corsJsonOut({ok:false, reason:'nav_dati'}); }
  var id=nextId('D', rows(sh).map(function(r){return r[0];}));
  var name=vards + ' ' + uzvards;
  sh.appendRow([id,name,pin,'ADMIN',true]);
  return corsJsonOut({ok:true,employee_id:id,employee_name:name,role:'ADMIN'});
}
function getNodarbibas(data){ var sh=getSheet('Nodarbibas'); var list=rows(sh).map(function(r){return {id:r[0],klients:r[1],datums:normDateVal(r[2]),nodarbiba_nosaukums:r[3],merkis:r[4],problema:r[5],uzdevums:r[6],refleksija:r[7],motivacija:r[8],gaita:r[9],garastavoklis:r[10],vertejums:r[11],pildits:r[12],komentars:r[13],employee_id:r[14],darbinieks:r[15]};}); return corsJsonOut({ok:true,nodarbibas:list}); }
function seedTestData(){
  /* Versija 2.0: testa dati netiek ievietoti automātiski.
     Lietotājs veido datus patstāvīgi caur Kaskādēm (ADMIN):
     1. Nodarbības veidi (sakne)
     2. Mērķi (saistīti ar veidu)
     3. Problēmas (saistīti ar mērķi)
     4. Uzdevumi (saistīti ar problēmu)
     Pēc tam šie elementi ir pieejami jaunas nodarbības formai. */
  return {ok:true,seeded:false,message:'Testa dati noņemti. Izveido datus caur Kaskādēm (ADMIN).'};
}

function normDateVal(v){
  try{
    if(v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd.MM.yyyy');
    var s=String(v==null?'':v).trim(); if(!s) return '';
    if(/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
    var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return m[3]+'.'+m[2]+'.'+m[1];
    var d=new Date(s); if(!isNaN(d)) return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd.MM.yyyy');
    return s;
  }catch(e){ return String(v==null?'':v); }
}
function getSakums(e){
  try{
    let data={};
    if(e.parameter&&e.parameter.data){data=JSON.parse(e.parameter.data);}
    else if(e.postData&&e.postData.contents){try{data=JSON.parse(e.postData.contents);}catch(err){data={};}}
    const empId=String(data.employee_id||'');
    const shKlienti=getSheet('Klienti');
    const shNod=getSheet('Nodarbibas');
    const klientiData=shKlienti.getDataRange().getValues();
    let aktivie=0;
    for(let i=1;i<klientiData.length;i++){var st=String(klientiData[i][2]||'').toUpperCase(); if(st==='AKTĪVS'||st==='AKTIVS') aktivie++;}
    const nodData=shNod.getDataRange().getValues();
    let kopskaits=nodData.length>1?nodData.length-1:0;
    let sodien=0,mani=0;
    const today=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd.MM.yyyy');
    for(let i=1;i<nodData.length;i++){var dv=normDateVal(nodData[i][2]); if(dv===today)sodien++; if(empId && String(nodData[i][14]||'')===empId)mani++;}
    let ped=[];
    for(let i=Math.max(1,nodData.length-5);i<nodData.length;i++){ped.push({datums:normDateVal(nodData[i][2]),klients:nodData[i][1],nodarbiba:nodData[i][3],darbinieks:nodData[i][15],id:nodData[i][0]});}
    return ContentService.createTextOutput(JSON.stringify({ok:true,aktivie:aktivie,sodien:sodien,kopskaits:kopskaits,mani:mani,ped:ped})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,err:err.toString()})).setMimeType(ContentService.MimeType.JSON);}
}


function atjaunotSistemasLapas() {
  const ss = SpreadsheetApp.openById(SS_ID);

  const lapas = {
    'Iestatijumi': [
      'atslega', 'vertiba'
    ],
    'Darbinieki': [
      'employee_id', 'employee_name', 'pin', 'role', 'active'
    ],
    'Klienti': [
      'id', 'vards', 'statuss', 'piezimes'
    ],
    'Nodarbibas': [
      'id', 'klients', 'datums', 'nodarbiba_nosaukums',
      'merkis', 'problema', 'uzdevums', 'refleksija',
      'motivacija', 'gaita', 'garastavoklis', 'vertejums',
      'pildits', 'komentars', 'employee_id', 'darbinieks'
    ],
    'Nodarbibu_veidi': [
      'id', 'nosaukums', 'aktivs'
    ],
    'Merki': [
      'id', 'nv_id', 'nosaukums', 'aktivs'
    ],
    'Problemas': [
      'id', 'merkis_id', 'nosaukums', 'aktivs'
    ],
    'Uzdevumi': [
      'id', 'problema_id', 'nosaukums', 'aktivs'
    ]
  };

  const rezultats = [];

  Object.keys(lapas).forEach(function(nosaukums) {
    let lapa = ss.getSheetByName(nosaukums);

    if (!lapa) {
      lapa = ss.insertSheet(nosaukums);
      lapa.getRange(1, 1, 1, lapas[nosaukums].length)
        .setValues([lapas[nosaukums]]);
      lapa.setFrozenRows(1);
      rezultats.push(nosaukums + ': izveidota');
    } else if (lapa.getLastRow() === 0) {
      lapa.getRange(1, 1, 1, lapas[nosaukums].length)
        .setValues([lapas[nosaukums]]);
      lapa.setFrozenRows(1);
      rezultats.push(nosaukums + ': pievienotas kolonnas');
    } else {
      rezultats.push(nosaukums + ': jau eksistē, nav mainīta');
    }
  });

  Logger.log(rezultats.join('\n'));

  return rezultats;
}

