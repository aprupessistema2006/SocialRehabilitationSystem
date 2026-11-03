const SS_ID = "1RaPuUUcr7YY3vCBT7zwbsvt_ZRR0B1Tv5SCRvZSa35A";

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SS_ID);
  return ss.getSheetByName(sheetName);
}

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
          role: row[3]
        };
      } else {
        return { ok: false, reason: "konts_neaktivs" };
      }
    }
  }
  return { ok: false, reason: "nepareizs_pin" };
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({status: "ok", message: "WebApp darbojas"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let data = {};
    
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch(err) {
        data = {};
      }
    }
    
    console.log("POST DATA:", JSON.stringify(data));
    
    if (data.action === "getEmployees") {
      return ContentService
        .createTextOutput(JSON.stringify({ok: true, employees: getAktivieDarbinieki()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "login" && data.employee_id && data.pin) {
      const res = pieteiktiesArPinUnId(data.employee_id, data.pin);
      return ContentService
        .createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, reason: "nepareizs_pieprasījums"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, reason: "kļūda", err: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSakums(e){
  try{
    let data={};
    if(e.parameter&&e.parameter.data){data=JSON.parse(e.parameter.data);}
    else if(e.postData&&e.postData.contents){try{data=JSON.parse(e.postData.contents);}catch(err){data={};}}
    const empId=data.employee_id||'';
    const shKlienti=getSheet('Klienti');
    const shNod=getSheet('Nodarbibas');
    const klientiData=shKlienti.getDataRange().getValues();
    let aktivie=0;
    for(let i=1;i<klientiData.length;i++){if(String(klientiData[i][2]).toUpperCase()==='AKTĪVS')aktivie++;}
    const nodData=shNod.getDataRange().getValues();
    let kopskaits=nodData.length>1?nodData.length-1:0;
    let sodien=0,mani=0;
    const today=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd.MM.yyyy');
    for(let i=1;i<nodData.length;i++){if(String(nodData[i][2])===today)sodien++;if(String(nodData[i][14])===empId)mani++;}
    let ped=[];
    for(let i=Math.max(1,nodData.length-5);i<nodData.length;i++){ped.push({datums:nodData[i][2],klients:nodData[i][1],nodarbiba:nodData[i][3],darbinieks:nodData[i][15],id:nodData[i][0]});}
    return ContentService.createTextOutput(JSON.stringify({ok:true,aktivie:aktivie,sodien:sodien,kopskaits:kopskaits,mani:mani,ped:ped})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,err:err.toString()})).setMimeType(ContentService.MimeType.JSON);}
}
