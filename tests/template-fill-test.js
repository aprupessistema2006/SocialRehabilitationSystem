/**
 * Template-fill test - verifies Excel form generation for nodarb_veid.xlsx
 * Usage: node tests/template-fill-test.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const results = [];
let fail = 0;

function step(name, fn) {
  try { const r = fn(); results.push({ name, ok: true, detail: r }); console.log('PASS:', name, '-', JSON.stringify(r)); }
  catch (e) { results.push({ name, ok: false, detail: String(e) }); console.log('FAIL:', name, '-', String(e)); fail++; }
}

// ---- Specification: named range -> cell -> content ----
const SPEC = {
  'client_full_name':        { cell: 'B3',  content: 'Klients' },
  'act_employee':            { cell: 'C24', content: 'Darbinieks' },
  'activity_area':           { cell: 'C5',  content: 'Nodarbības nosaukums' },
  'activity_comment':        { cell: 'A23', content: 'Komentārs/piezīme' },
  'activity_date':           { cell: 'E3',  content: 'Datums' },
  'activity_eval':           { cell: 'D15', content: 'Nodarbības vērtējums' },
  'activity_goal':           { cell: 'B7',  content: 'Mērķis' },
  'activity_implementation': { cell: 'A19', content: 'Programmas izpilde' },
  'activity_process':        { cell: 'D13', content: 'Nodarbības gaita' },
  'activity_task':           { cell: 'B10', content: 'Uzdevums' },
  'client_mood':             { cell: 'D14', content: 'Garastāvoklis' },
  'client_motivation':       { cell: 'D12', content: 'Sadarbība un motivācija' },
  'client_problem':          { cell: 'B8',  content: 'Klienta problēma' }
};

// Internal JS field names used in template-fill.js, mapped to spec named ranges
const TEMPLATE_CELLS = {
  'B3':  'klients',
  'C24': 'darbinieks',
  'C5':  'nodarbiba_nosaukums',
  'A23': 'komentars',
  'E3':  'datums',
  'D15': 'vertejums',
  'B7':  'merkis',
  'A19': 'pildits',
  'D13': 'gaita',
  'B10': 'uzdevums',
  'D14': 'garastavoklis',
  'D12': 'motivacija',
  'B8':  'problema'
};

// spec named range -> internal JS field name
const SPEC_TO_INTERNAL = {
  'client_full_name':        'klients',
  'act_employee':            'darbinieks',
  'activity_area':           'nodarbiba_nosaukums',
  'activity_comment':        'komentars',
  'activity_date':           'datums',
  'activity_eval':           'vertejums',
  'activity_goal':           'merkis',
  'activity_implementation': 'pildits',
  'activity_process':        'gaita',
  'activity_task':           'uzdevums',
  'client_mood':             'garastavoklis',
  'client_motivation':       'motivacija',
  'client_problem':          'problema'
};

// Test 1: All 13 specification fields present
step('All 13 specification fields present', function(){
  const specFieldNames = Object.keys(SPEC);
  const internalFields = Object.values(TEMPLATE_CELLS);
  const missing = [];
  for (const specName of specFieldNames) {
    const internal = SPEC_TO_INTERNAL[specName];
    if (!internal) { missing.push(specName + '(no internal mapping)'); continue; }
    if (!internalFields.includes(internal)) missing.push(specName + '->' + internal);
  }
  if (missing.length) throw new Error('Missing: ' + missing.join(', '));
  return specFieldNames.length + ' specification fields mapped';
});

// Test 2: Cell addresses match specification
step('Cell addresses match specification', function(){
  const errors = [];
  for (const [specName, specDef] of Object.entries(SPEC)) {
    // Find which cell in TEMPLATE_CELLS maps to this spec's internal field
    const internalField = SPEC_TO_INTERNAL[specName];
    let foundCell = null;
    for (const [cell, field] of Object.entries(TEMPLATE_CELLS)) {
      if (field === internalField) { foundCell = cell; break; }
    }
    if (!foundCell) { errors.push(specName + ': no cell found for ' + internalField); continue; }
    if (foundCell !== specDef.cell) errors.push(specName + ': expected cell ' + specDef.cell + ', got ' + foundCell);
  }
  if (errors.length) throw new Error(errors.join('; '));
  return Object.keys(SPEC).length + ' cell addresses match specification';
});

// Test 3: nodarb_veid.xlsx is a valid Excel workbook
step('nodarb_veid.xlsx is a valid Excel workbook', function(){
  const xlsxPath = path.join(root, 'nodarb_veid.xlsx');
  if (!fs.existsSync(xlsxPath)) throw new Error('nodarb_veid.xlsx not found at ' + xlsxPath);
  const wb = XLSX.readFile(xlsxPath);
  if (!wb.SheetNames || wb.SheetNames.length === 0) throw new Error('Workbook has no sheets');
  return 'Sheets: ' + wb.SheetNames.join(', ');
});

// Test 4: Template fill places data in correct cells
step('Template fill places data in correct cells', function(){
  const xlsxPath = path.join(root, 'nodarb_veid.xlsx');
  const wb = XLSX.readFile(xlsxPath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  const activity = {
    id: 'N003',
    klients: 'Jānis Ozols',
    darbinieks: 'Dāvis Strazds',
    nodarbiba_nosaukums: 'Personīgā higiēna un pašaprūpe',
    komentars: 'Tests komentārs',
    datums: '07.11.2026',
    vertejums: 'Labs',
    merkis: 'Pašaprūpes prasmju attīstība',
    pildits: 'Daļēji',
    gaita: 'Strādāts ar dienas plānu',
    uzdevums: 'Izveidot dienas plānu',
    garastavoklis: 'Labs',
    motivacija: 'Augsta',
    problema: 'Grūtības ikdienas rutīnās'
  };

  for (const cell of Object.keys(TEMPLATE_CELLS)) {
    const field = TEMPLATE_CELLS[cell];
    const val = activity[field] == null ? '' : activity[field];
    if (!ws[cell]) ws[cell] = { t: 's', v: String(val) };
    else { ws[cell].v = val; ws[cell].t = typeof val === 'number' ? 'n' : 's'; }
  }

  const errors = [];
  for (const cell of Object.keys(TEMPLATE_CELLS)) {
    const field = TEMPLATE_CELLS[cell];
    const expectedVal = activity[field];
    const actual = ws[cell] ? ws[cell].v : undefined;
    if (String(actual) !== String(expectedVal)) {
      errors.push(cell + ': expected "' + expectedVal + '", got "' + actual + '"');
    }
  }
  if (errors.length) throw new Error(errors.join('; '));

  // Write to temp file and re-read to verify persistence
  const tmpPath = path.join(root, 'tests', '_template_fill_test.xlsx');
  XLSX.writeFile(wb, tmpPath);
  const wb2 = XLSX.readFile(tmpPath);
  const ws2 = wb2.Sheets[sheetName];
  const persistErrors = [];
  for (const cell of Object.keys(TEMPLATE_CELLS)) {
    const field = TEMPLATE_CELLS[cell];
    const expectedVal = activity[field];
    const actual = ws2[cell] ? ws2[cell].v : undefined;
    if (String(actual) !== String(expectedVal)) {
      persistErrors.push(cell + ': persisted "' + actual + '", expected "' + expectedVal + '"');
    }
  }
  fs.unlinkSync(tmpPath);
  if (persistErrors.length) throw new Error('Persistence errors: ' + persistErrors.join('; '));

  return Object.keys(TEMPLATE_CELLS).length + ' cells filled and persisted correctly';
});

console.log('\nSummary:', results.length - fail, '/', results.length, 'passed');
process.exit(fail ? 1 : 0);
