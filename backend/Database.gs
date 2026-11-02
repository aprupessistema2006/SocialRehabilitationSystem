// backend/Database.gs — datubāzes pārvaldība
const DB_NAME = 'SocialRehabilitationSystem_Database';

function getSpreadsheet() {
  const id = Settings.getDbId();
  return SpreadsheetApp.openById(id);
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
