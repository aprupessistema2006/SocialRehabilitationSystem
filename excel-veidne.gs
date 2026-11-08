// ============================================================
// excel-veidne.gs  —  Apps Script serverpusējais veidņa aizpildītājs
// Pievieno šo failu savā Apps Script projektā (kopā ar code.gs).
// Nemaina formatēšanu, ieliek tikai vērtības konkrētajās šūnās.
// ============================================================

// Ierakstīt savu Google Sheet ID (atļauj piekļuvi no šim Apps Scriptam)
const VEIDNE_SS_ID = "";   // piemēram: "1RaPuUUcr7YY3vCBT7zwbsvt_ZRR0B1Tv5SCRvZSa35A"
const VEIDNE_LAPA = "Nodarbību gaita";

// Precīzas šūnu adreses (par šo pamatom, 1:1 ar lietotāja specifikāciju)
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

function mapRecordToCells(record){
  return {
    client_full_name: record.klients || '',
    act_employee: record.darbinieks || '',
    activity_area: record.nodarbiba_nosaukums || '',
    activity_comment: record.komentars || '',
    activity_date: record.datums || '',
    activity_eval: record.vertejums || '',
    activity_goal: record.merkis || '',
    activity_implementation: record.pildits || '',
    activity_implementation_after: '',
    activity_process: record.gaita || '',
    activity_task: record.uzdevums || '',
    client_mood: record.garastavoklis || '',
    client_motivation: record.motivacija || '',
    client_problem: record.problema || ''
  };
}

function fillVeidne(data){
  if(!VEIDNE_SS_ID){
    return {ok:false, reason:'nav_konfigurets_veidne_ss_id', hint:'Iestatiet VEIDNE_SS_ID excel-veidne.gs'};
  }
  try{
    var ss = SpreadsheetApp.openById(VEIDNE_SS_ID);
    var sh = ss.getSheetByName(VEIDNE_LAPA);
    if(!sh){
      return {ok:false, reason:'nav_lapa:' + VEIDNE_LAPA};
    }
    var values = mapRecordToCells(data);
    var pildito = 0;
    Object.keys(values).forEach(function(name){
      var addr = VEIDNE_CELLS[name];
      if(addr){
        sh.getRange(addr).setValue(values[name]);
        pildito++;
      }
    });
    return {ok:true, filled:pildito, sheet:VEIDNE_LAPA};
  }catch(err){
    return {ok:false, reason:'klaida', err:String(err)};
  }
}
