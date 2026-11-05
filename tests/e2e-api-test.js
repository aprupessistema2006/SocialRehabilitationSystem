/**
 * End-to-end API test for SocialRehabilitationSystem.
 * Requires: updated code.gs deployed to Apps Script Web App (same URL as js/config.js).
 * Usage: node tests/e2e-api-test.js
 *
 * Seeds/checks: 2 employees (D001 ADMIN/1234, D002 USER/5678), 2 clients,
 * filled cascade (NV/M/P/U), 1 sample activity — via seedTestData action.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const config = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');
const m = config.match(/WEBAPP_URL\s*=\s*"([^"]+)"/);
if (!m) throw new Error('WEBAPP_URL not found in js/config.js');
const WEBAPP_URL = m[1];

function post(action, payload = {}) {
  const body = new URLSearchParams({ data: JSON.stringify({ action, ...payload }) }).toString();
  return new Promise((resolve, reject) => {
    const req = https.request(WEBAPP_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
      if ([301,302,303,307].includes(res.statusCode) && res.headers.location) {
        https.get(res.headers.location, (g) => {
          let data = ''; g.on('data', c => data += c); g.on('end', () => {
            try { resolve({ status: g.statusCode, json: JSON.parse(data), raw: data }); }
            catch (e) { resolve({ status: g.statusCode, json: null, raw: data, parseError: String(e) }); }
          });
        }).on('error', reject);
        return;
      }
      let data = ''; res.on('data', c => data += c); res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data), raw: data }); }
        catch (e) { resolve({ status: res.statusCode, json: null, raw: data, parseError: String(e) }); }
      });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function run() {
  const results = [];
  const step = async (name, fn) => {
    try { const r = await fn(); results.push({ name, ok: true, detail: r }); console.log('PASS:', name, '-', r); }
    catch (e) { results.push({ name, ok: false, detail: String(e) }); console.log('FAIL:', name, '-', String(e)); }
  };

  console.log('WEBAPP_URL:', WEBAPP_URL);
  await step('login D001/1234', async () => {
    const r = await post('login', { employee_id: 'D001', pin: '1234' });
    if (!r.json || !r.json.ok) throw new Error('login failed: ' + r.raw.slice(0, 200));
    if (r.json.role !== 'ADMIN') throw new Error('expected ADMIN role');
    return r.json.employee_name;
  });
  await step('seedTestData', async () => {
    const r = await post('seedTestData');
    if (!r.json || !r.json.ok) throw new Error('seed failed: ' + r.raw.slice(0, 200));
    return 'seeded';
  });
  await step('getLietotaji has 2 employees', async () => {
    const r = await post('getLietotaji'); if (!r.json?.ok) throw new Error(r.raw.slice(0, 200));
    const ids = (r.json.lietotaji||[]).map(x=>x.employee_id);
    if (!ids.includes('D001') || !ids.includes('D002')) throw new Error('missing D001/D002: ' + ids.join(','));
    return ids.join(',');
  });
  await step('getKlienti has 2 clients', async () => {
    const r = await post('getKlienti'); if (!r.json?.ok) throw new Error(r.raw.slice(0, 200));
    const names = (r.json.klienti||[]).map(x=>x.vards);
    if (names.length < 2) throw new Error('expected >=2 clients: ' + names.join(','));
    return names.slice(0,2).join(' | ');
  });
  await step('getKaskade filled', async () => {
    const r = await post('getKaskade'); if (!r.json?.ok) throw new Error(r.raw.slice(0, 200));
    const c = [r.json.nodarbibu_veidi?.length,r.json.merki?.length,r.json.problemas?.length,r.json.uzdevumi?.length];
    if (c.some(n => !n || n < 1)) throw new Error('cascade incomplete: NV/M/P/U=' + c.join('/'));
    return 'NV/M/P/U=' + c.join('/');
  });
  await step('getNodarbibas has records', async () => {
    const r = await post('getNodarbibas'); if (!r.json?.ok) throw new Error(r.raw.slice(0, 200));
    if (!(r.json.nodarbibas||[]).length) throw new Error('no activities');
    return 'count=' + r.json.nodarbibas.length;
  });
  await step('getSakums for D001', async () => {
    const r = await post('getSakums', { employee_id: 'D001' }); if (!r.json?.ok) throw new Error(r.raw.slice(0, 200));
    return JSON.stringify({ aktivie:r.json.aktivie, sodien:r.json.sodien, kopskaits:r.json.kopskaits, mani:r.json.mani, ped:(r.json.ped||[]).length });
  });

  const failed = results.filter(r=>!r.ok).length;
  console.log('\nSummary:', results.length - failed, '/', results.length, 'passed');
  if (failed) {
    console.log('\nNOTE: Failures usually mean code.gs is not deployed to Apps Script with the new actions (getKlienti/getKaskade/seedTestData/etc.). Copy local code.gs to Apps Script and deploy a new Web App version, then rerun.');
    process.exitCode = 1;
  }
}
run().catch(e => { console.error('Fatal:', e); process.exit(1); });
