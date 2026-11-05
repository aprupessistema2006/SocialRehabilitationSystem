const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const mustExist = [
  'index.html','css/style.css','js/config.js','js/api.js','js/layout.js','js/auth.js','code.gs',
  'pages/sakums.html','pages/jauna-nodarbiba.html','pages/klienti.html','pages/nodarbibu-vesture.html','pages/kaskades.html','pages/lietotaji.html','pages/iestatijumi.html','pages/klienta-profilis.html',
  'js/sakums.js','js/jauna-nodarbiba.js','js/klienti.js','js/nodarbibu-vesture.js','js/kaskades.js','js/lietotaji.js','js/iestatijumi.js','js/klienta-profilis.js',
  'css/sakums.css','css/jauna-nodarbiba.css','css/klienti.css','css/nodarbibu-vesture.css','css/kaskades.css','css/lietotaji.css','css/iestatijumi.css',
];
let fail = 0;
for (const f of mustExist) { const ok = fs.existsSync(path.join(root,f)); console.log(ok?'PASS':'FAIL', f); if(!ok) fail++; }
const checks = [
  ['pages/klienti.html', /config\.js.*api\.js.*layout\.js.*klienti\.js/s, 'klienti scripts'],
  ['pages/klienti.html', /href="\.\.\/css\/klienti\.css"/, 'klienti css'],
  ['pages/kaskades.html', /admin-only|ADMIN/, 'kaskades admin hint'],
  ['code.gs', /seedTestData/, 'seedTestData action'],
  ['code.gs', /getKaskade/, 'getKaskade action'],
  ['code.gs', /saveNodarbiba/, 'saveNodarbiba action'],
  ['code.gs', /action === 'getSakums'|getSakums/, 'getSakums routed'],
  ['js/jauna-nodarbiba.js', /wireCascade/, 'cascade logic'],
];
for (const [f,re,name] of checks) { const s=fs.readFileSync(path.join(root,f),'utf8'); const ok=re.test(s); console.log(ok?'PASS':'FAIL', name); if(!ok) fail++; }
console.log('\nSummary:', mustExist.length+checks.length-fail, '/', mustExist.length+checks.length, 'passed');
process.exit(fail?1:0);
