// backend/Activities.gs
function Activities_save(data, user) {
  data = data || {};
  if (!user) user = Authentication.getCurrentUser();
  if (!user) throw new Error('Nav pieteicies');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = genId('N', 'Nodarbibas', 'activity_id');
    const row = {
      activity_id: id,
      client_id: data.client_id,
      activity_date: data.activity_date,
      activity_area: data.activity_area,
      activity_goal: data.activity_goal,
      client_problem: data.client_problem,
      activity_task: data.activity_task,
      activity_reflection: data.activity_reflection || '',
      client_motivation: data.client_motivation || '',
      activity_process: data.activity_process || '',
      client_mood: data.client_mood || '',
      activity_eval: data.activity_eval || '',
      activity_implementation: data.activity_implementation || '',
      activity_comment: data.activity_comment || '',
      act_employee_id: user.employee_id,
      act_employee_name: user.employee_name,
      created_at: now(),
      updated_at: now(),
      created_by: user.email,
      updated_by: user.email,
      status: 'Aktīvs'
    };
    appendRow('Nodarbibas', row);
    Audit.log(user, 'Izveide', 'nodarbība', id, 'Jauna nodarbība');
    return { ok: true, activity_id: id };
  } finally { lock.releaseLock(); }
}
const Activities = { save: Activities_save };

function Activities_update(data, user) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = data.activity_id;
    const updates = Object.assign({}, data);
    delete updates.activity_id;
    updates.updated_at = now();
    updates.updated_by = user.email;
    updateRow('Nodarbibas', 'activity_id', id, updates);
    Audit.log(user, 'Labošana', 'nodarbība', id, 'Ieraksts labots');
    return { ok: true };
  } finally { lock.releaseLock(); }
}
Activities.update = Activities_update;

function Activities_get(data, user) {
  const rows = readAll('Nodarbibas');
  return { ok: true, record: rows.find(r => r.activity_id === data.activity_id) || null };
}
Activities.get = Activities_get;

function Activities_clientHistory(data, user) {
  const rows = readAll('Nodarbibas').filter(r => r.client_id === data.client_id);
  return { ok: true, records: rows };
}
Activities.clientHistory = Activities_clientHistory;

function Activities_search(data, user) {
  let rows = readAll('Nodarbibas');
  if (data.date_from) rows = rows.filter(r => new Date(r.activity_date) >= new Date(data.date_from));
  if (data.date_to) rows = rows.filter(r => new Date(r.activity_date) <= new Date(data.date_to));
  if (data.employee) rows = rows.filter(r => r.act_employee_name === data.employee);
  if (data.area) rows = rows.filter(r => r.activity_area === data.area);
  return { ok: true, records: rows };
}
Activities.search = Activities_search;
// backend/Authentication.gs
function Authentication_getUserEmail() { return Session.getActiveUser().getEmail(); }
function Authentication_getAllowed() { return readAll('Darbinieki'); }
function Authentication_getCurrentUser() {
  const email = Authentication_getUserEmail();
  let list = Authentication_getAllowed();
  if (list.length === 0 && email) {
    appendRow('Darbinieki', { employee_id: 'E00001', employee_name: email, email: email, role: 'ADMIN', is_active: true, created_at: now(), last_login: now() });
    list = Authentication_getAllowed();
  }
  const emp = list.find(e => e.email === email && e.is_active === true);
  if (!emp) return null;
  return { email: email, employee_id: emp.employee_id, employee_name: emp.employee_name, role: emp.role };
}
function Authentication_login(data) {
  const u = Authentication_getCurrentUser();
  if (!u) return { ok: false, error: 'Piekļuve liegta' };
  return { ok: true, user: u };
}
const Authentication = { getCurrentUser: Authentication_getCurrentUser, login: Authentication_login };
// Audit helper
const Audit = {
  log: function(user, action, type, id, details) {
    try { appendRow('Audita_zurnals', { log_id: genId('L','Audita_zurnals','log_id'), timestamp: now(), user_id: user.email, action: action, record_type: type, record_id: id, details: details }); } catch(e){}
  },
  getLog: function(user) {
    if (user.role !== 'ADMIN') return { ok: false, error: 'Nav tiesību' };
    return { ok: true, logs: readAll('Audita_zurnals') };
  }
};
// backend/Cascades.gs
function Cascades_getAll(user) {
  return {
    ok: true,
    areas: readAll('Nodarbibu_veidi'),
    goals: readAll('Merki'),
    problems: readAll('Problemas'),
    tasks: readAll('Uzdevumi')
  };
}
function Cascades_add(data, user) {
  const map = { area: ['Nodarbibu_veidi','activity_area_id'], goal: ['Merki','goal_id'], problem: ['Problemas','problem_id'], task: ['Uzdevumi','task_id'] };
  const [sheet, col] = map[data.type];
  const prefix = data.type === 'area' ? 'A' : data.type === 'goal' ? 'G' : data.type === 'problem' ? 'P' : 'T';
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = genId(prefix, sheet, col);
    const row = { [col]: id, name: data.name, active: true, sort_order: data.sort_order || 0 };
    if (data.parent_id) {
      const parentCol = data.type === 'goal' ? 'activity_area_id' : data.type === 'problem' ? 'goal_id' : 'problem_id';
      row[parentCol] = data.parent_id;
    }
    appendRow(sheet, row);
    Audit.log(user, 'Izveide', 'kaskāde', id, 'Jauns elements');
    return { ok: true, id: id };
  } finally { lock.releaseLock(); }
}
function Cascades_update(data, user) {
  const map = { area: 'Nodarbibu_veidi', goal: 'Merki', problem: 'Problemas', task: 'Uzdevumi' };
  const idCol = { area: 'activity_area_id', goal: 'goal_id', problem: 'problem_id', task: 'task_id' }[data.type];
  updateRow(map[data.type], idCol, data.id, data.updates || {});
  return { ok: true };
}
function Cascades_deactivate(data, user) {
  const map = { area: 'Nodarbibu_veidi', goal: 'Merki', problem: 'Problemas', task: 'Uzdevumi' };
  const idCol = { area: 'activity_area_id', goal: 'goal_id', problem: 'problem_id', task: 'task_id' }[data.type];
  updateRow(map[data.type], idCol, data.id, { active: false });
  Audit.log(user, 'Deaktivizēšana', 'kaskāde', data.id, 'Elements deaktivizēts');
  return { ok: true };
}
const Cascades = { getAll: Cascades_getAll, add: Cascades_add, update: Cascades_update, deactivate: Cascades_deactivate };
// backend/Clients.gs
function Clients_list(user) {
  return { ok: true, clients: readAll('Klienti') };
}
function Clients_add(data, user) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = genId('K', 'Klienti', 'client_id');
    appendRow('Klienti', {
      client_id: id, client_full_name: data.client_full_name, status: 'Aktīvs',
      created_at: now(), updated_at: now(), created_by: user.email, notes: data.notes || ''
    });
    Audit.log(user, 'Izveide', 'klients', id, 'Jauns klients');
    return { ok: true, client_id: id };
  } finally { lock.releaseLock(); }
}
function Clients_update(data, user) {
  const updates = Object.assign({}, data); delete updates.client_id;
  updates.updated_at = now();
  updateRow('Klienti', 'client_id', data.client_id, updates);
  Audit.log(user, 'Labošana', 'klients', data.client_id, 'Klienta dati laboti');
  return { ok: true };
}
function Clients_deactivate(data, user) {
  updateRow('Klienti', 'client_id', data.client_id, { status: 'Neaktīvs', updated_at: now() });
  Audit.log(user, 'Deaktivizēšana', 'klients', data.client_id, 'Klients deaktivizēts');
  return { ok: true };
}
const Clients = { list: Clients_list, add: Clients_add, update: Clients_update, deactivate: Clients_deactivate };
// backend/Database.gs — datubāzes pārvaldība
const DB_NAME = 'SocialRehabilitationSystem_Database';

function getSpreadsheet() {
  let id = Settings.getDbId();
  if (!id) {
    const files = DriveApp.getFilesByName('SocialRehabilitationSystem_Database');
    if (files.hasNext()) { id = files.next().getId(); }
  }
  if (!id) {
    const ss = SpreadsheetApp.create('SocialRehabilitationSystem_Database');
    id = ss.getId();
    initDatabase(ss);
  }
  PropertiesService.getScriptProperties().setProperty('DB_ID', id);
  return SpreadsheetApp.openById(id);
}

function initDatabase(ss) {
  const sheets = {
    'Klienti': ['client_id','client_full_name','status','created_at','updated_at','created_by','notes'],
    'Nodarbibas': ['activity_id','client_id','activity_date','activity_area','activity_goal','client_problem','activity_task','activity_reflection','client_motivation','activity_process','client_mood','activity_eval','activity_implementation','activity_comment','act_employee_id','act_employee_name','created_at','updated_at','created_by','updated_by','status'],
    'Nodarbibu_veidi': ['activity_area_id','name','active','sort_order'],
    'Merki': ['goal_id','activity_area_id','name','active','sort_order'],
    'Problemas': ['problem_id','goal_id','name','active','sort_order'],
    'Uzdevumi': ['task_id','problem_id','name','active','sort_order'],
    'Darbinieki': ['employee_id','employee_name','email','role','is_active','created_at','last_login'],
    'Iestatijumi': ['setting_key','setting_value','description','updated_at','updated_by'],
    'Audita_zurnals': ['log_id','timestamp','user_id','action','record_type','record_id','details'],
    'Rezerves_kopijas': ['backup_id','created_at','file_id','created_by','status','description']
  };
  Object.keys(sheets).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    sh.getRange(1,1,1,sheets[name].length).setValues([sheets[name]]);
    sh.getRange(1,1,1,sheets[name].length).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  const def = ss.getSheetByName('Sheet1'); if (def) ss.deleteSheet(def);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function readAll(sheetName) {
  const sh = getSheet(sheetName);
  const rows = sh.getDataRange().getValues();
  const header = rows.shift();
  return rows.map(r => {
    const o = {};
    header.forEach((h, i) => o[h] = r[i]);
    return o;
  });
}

function appendRow(sheetName, rowObj) {
  const sh = getSheet(sheetName);
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const row = header.map(h => rowObj[h] !== undefined ? rowObj[h] : '');
  sh.appendRow(row);
}

function findRow(sheetName, keyCol, value) {
  const sh = getSheet(sheetName);
  const data = sh.getDataRange().getValues();
  const header = data[0];
  const idx = header.indexOf(keyCol);
  for (let i = 1; i < data.length; i++) {
    if (data[i][idx] === value) return i + 1;
  }
  return -1;
}

function updateRow(sheetName, keyCol, value, updates) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const row = findRow(sheetName, keyCol, value);
    if (row < 0) throw new Error('Ieraksts nav atrasts');
    const sh = getSheet(sheetName);
    const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    Object.keys(updates).forEach(k => {
      const ci = header.indexOf(k);
      if (ci >= 0) sh.getRange(row, ci + 1).setValue(updates[k]);
    });
  } finally { lock.releaseLock(); }
}

function genId(prefix, sheetName, idCol) {
  const sh = getSheet(sheetName);
  const last = sh.getLastRow();
  let max = 0;
  if (last > 1) {
    const col = sh.getRange(2, sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].indexOf(idCol)+1, last-1, 1).getValues();
    col.forEach(r => {
      const n = parseInt(String(r[0]).replace(/\D/g,''), 10);
      if (!isNaN(n) && n > max) max = n;
    });
  }
  return prefix + String(max + 1).padStart(5, '0');
}

function now() { return new Date(); }
// backend/Documents.gs
function Documents_export(data, user) {
  const templateId = Settings.getTemplateId();
  const folderId = Settings.getExportFolderId();
  const copy = DriveApp.getFileById(templateId).makeCopy(data.filename || 'nodarbiba', DriveApp.getFolderById(folderId));
  const ss = SpreadsheetApp.openById(copy.getId());
  const sh = ss.getSheets()[0];
  const ranges = {
    client_full_name: '$B$3', act_employee: '$C$24', activity_area: '$C$5',
    activity_comment: '$A$23', activity_date: '$E$3', activity_eval: '$D$15',
    activity_goal: '$B$7', activity_implementation: '$A$19', activity_process: '$D$13',
    activity_task: '$B$10', client_mood: '$D$14', client_motivation: '$D$12',
    client_problem: '$B$8', activity_reflection: '$A$20'
  };
  Object.keys(ranges).forEach(k => {
    if (data[k] !== undefined) sh.getRange(ranges[k]).setValue(data[k]);
  });
  let url;
  if (data.format === 'pdf') {
    url = 'https://docs.google.com/spreadsheets/d/' + copy.getId() + '/export?format=pdf';
  } else {
    url = 'https://docs.google.com/spreadsheets/d/' + copy.getId() + '/export?format=xlsx';
  }
  Audit.log(user, 'Eksports', 'dokuments', data.activity_id || '', 'Eksports ' + data.format);
  return { ok: true, url: url, fileId: copy.getId() };
}
const Documents = { export: Documents_export };
// backend/Main.gs — galvenais servera ieejas punkts (Apps Script Web App)
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Sociālās rehabilitācijas sistēma')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const action = data.action;
    const user = Authentication.getCurrentUser();
    if (!user) return jsonResponse({ ok: false, error: 'Nav pieteicies' });
    return jsonResponse(dispatch(action, data, user));
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function dispatch(action, data, user) {
  switch (action) {
    case 'login': return Authentication.login(data);
    case 'getClients': return Clients.list(user);
    case 'addClient': return Clients.add(data, user);
    case 'updateClient': return Clients.update(data, user);
    case 'deactivateClient': return Clients.deactivate(data, user);
    case 'getCascades': return Cascades.getAll(user);
    case 'addCascade': return Cascades.add(data, user);
    case 'updateCascade': return Cascades.update(data, user);
    case 'deactivateCascade': return Cascades.deactivate(data, user);
    case 'saveActivity': return Activities.save(data, user);
    case 'updateActivity': return Activities.update(data, user);
    case 'getActivity': return Activities.get(data, user);
    case 'getClientHistory': return Activities.clientHistory(data, user);
    case 'searchActivities': return Activities.search(data, user);
    case 'exportDocument': return Documents.export(data, user);
    case 'getSettings': return Settings.get(user);
    case 'updateSettings': return Settings.update(data, user);
    case 'getAuditLog': return Audit.getLog(user);
    default: return { ok: false, error: 'Nezināma darbība: ' + action };
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
// backend/Settings.gs
function Settings_getDbId() { return PropertiesService.getScriptProperties().getProperty('DB_ID') || ''; }
function Settings_getTemplateId() { return PropertiesService.getScriptProperties().getProperty('TEMPLATE_ID') || ''; }
function Settings_getExportFolderId() { return PropertiesService.getScriptProperties().getProperty('EXPORT_FOLDER_ID') || ''; }
function Settings_get(user) {
  return { ok: true, dbId: Settings_getDbId(), templateId: Settings_getTemplateId(), exportFolderId: Settings_getExportFolderId() };
}
function Settings_update(data, user) {
  if (user.role !== 'ADMIN') return { ok: false, error: 'Nav tiesību' };
  const p = PropertiesService.getScriptProperties();
  if (data.dbId) p.setProperty('DB_ID', data.dbId);
  if (data.templateId) p.setProperty('TEMPLATE_ID', data.templateId);
  if (data.exportFolderId) p.setProperty('EXPORT_FOLDER_ID', data.exportFolderId);
  return { ok: true };
}
const Settings = { getDbId: Settings_getDbId, getTemplateId: Settings_getTemplateId, getExportFolderId: Settings_getExportFolderId, get: Settings_get, update: Settings_update };

function saveActivity(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Activities.save(data,u); }
function updateActivity(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Activities.update(data,u); }
function getActivity(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Activities.get(data,u); }
function getClientHistory(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Activities.clientHistory(data,u); }
function searchActivities(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Activities.search(data,u); }
function getClients(){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Clients.list(u); }
function addClient(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Clients.add(data,u); }
function updateClient(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Clients.update(data,u); }
function deactivateClient(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Clients.deactivate(data,u); }
function getCascades(){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Cascades.getAll(u); }
function addCascade(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Cascades.add(data,u); }
function updateCascade(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Cascades.update(data,u); }
function deactivateCascade(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Cascades.deactivate(data,u); }
function exportDocument(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Documents.export(data,u); }
function getSettings(){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Settings.get(u); }
function updateSettings(data){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Settings.update(data,u); }
function getAuditLog(){ const u=Authentication.getCurrentUser(); if(!u) throw new Error('Nav pieteicies'); return Audit.getLog(u); }
function login(){ return Authentication.login({}); }
function checkSession(){ const u=Authentication.getCurrentUser(); return u; }
function renderSection(s){ return '<p>'+s+'</p>'; }
function logout(){ return true; }
