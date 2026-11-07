/* Statistika - tīra CSS analīze, bez kanva un ārpusējām bibliotēmām */
var ST = { nodarbibas: [], klienti: [], sakums: {}, colors: ['#a855f7','#ec4899','#818cf8','#f472b6','#c4b5fd','#fbcfe8','#22c55e','#f43f5e'] };

async function initStatistika(){
  var u = requireUser();
  byId('statMsg').textContent = 'Ielādē statistiku...';
  try {
    await Promise.all([
      api('getSakums', { employee_id: u.id }).then(function(r){ if (r.ok) ST.sakums = r; }),
      api('getNodarbibas', { access_token: getToken() }).then(function(r){ ST.nodarbibas = (r.ok && r.nodarbibas) ? r.nodarbibas : []; }),
      api('getKlienti', { access_token: getToken() }).then(function(r){ ST.klienti = (r.ok && r.klienti) ? r.klienti : []; })
    ]);
    renderKPI(u);
    renderCharts();
    byId('statMsg').textContent = '';
  } catch (e) {
    byId('statMsg').textContent = 'Neizdevās ielādēt statistiku.';
  }
}

function renderKPI(u){
  var s = ST.sakums || {};
  setText('statTotal', s.kopskaits != null ? s.kopskaits : (ST.nodarbibas ? ST.nodarbibas.length : 0));
  setText('statToday', s.sodien != null ? s.sodien : countToday());
  setText('statClients', s.aktivie != null ? s.aktivie : (ST.klienti ? ST.klienti.filter(function(k){ return String(k.statuss).toLowerCase().indexOf('akt') === 0; }).length : 0));
  setText('statMine', s.mani != null ? s.mani : countMine(u.id));
}
function setText(id, v){ var el = byId(id); if (el) el.textContent = (v == null ? '0' : v); }
function countToday(){ var d = new Date(); var dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0'); var today = dd + '.' + mm + '.' + d.getFullYear(); return (ST.nodarbibas || []).filter(function(r){ return String(r.datums) === today; }).length; }
function countMine(empId){ return (ST.nodarbibas || []).filter(function(r){ return String(r.employee_id || r.darbinieks_id || '') === String(empId || ''); }).length; }

function renderCharts(){
  var nb = ST.nodarbibas || [];
  if (!nb.length){
    ['chartClients','chartWorkers','chartTimeline','chartTypes','chartStatus'].forEach(function(id){
      var el = byId(id); if(el) el.innerHTML = '<div class="css-empty">Nav ierakstu analīzei.</div>';
    });
    return;
  }

  // 1. Bar chart: nodarbības pēc klienta
  var byClient = groupBy(nb, function(r){ return r.klients || 'Nezināms'; });
  var clientItems = Object.entries(byClient).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 8);
  renderBarChart('chartClients', clientItems, clientItems.length);

  // 2. Pie chart: nodarbības pēc darbinieka
  var byWorker = groupBy(nb, function(r){ return r.darbinieks || 'Nezināms'; });
  var workerItems = Object.entries(byWorker);
  renderPieChart('chartWorkers', workerItems);

  // 3. Line chart: nodarbības laika gaitā (pēdējie 14 dienas)
  var byDate = groupBy(nb, function(r){ return r.datums || '-'; });
  var dates = Object.keys(byDate).sort().slice(-14);
  var dateItems = dates.map(function(d){ return [d, byDate[d] || 0]; });
  renderLineChart('chartTimeline', dateItems, dateItems.length);

  // 4. Pie chart: nodarbību veidu sadalījums
  var byType = groupBy(nb, function(r){ return r.nodarbiba_nosaukums || 'Nezināms'; });
  var typeItems = Object.entries(byType).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 6);
  renderPieChart('chartTypes', typeItems);

  // 5. Pie chart: pildības statuss
  var pildits = 0, nepildits = 0;
  nb.forEach(function(r){
    if (String(r.pildits || '').toLowerCase().indexOf('piln') >= 0 || String(r.pildits || '').toLowerCase() === 'jā') pildits++;
    else nepildits++;
  });
  renderPieChart('chartStatus', [['Pildīts', pildits], ['Nepildīts', nepildits]]);
}

function groupBy(arr, keyFn){
  var out = {};
  arr.forEach(function(r){
    var k = keyFn(r);
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

/* ---------- CSS bar chart ---------- */
function renderBarChart(id, items, barCount){
  var container = byId(id);
  if (!container) return;
  container.style.setProperty('--bar-count', barCount);
  if (!items.length) { container.innerHTML = '<div class="css-bar-empty">Nav datu.</div>'; return; }
  var maxVal = Math.max.apply(null, items.map(function(it){ return it[1]; }));
  if (maxVal <= 0) maxVal = 1;
  var html = '';
  items.forEach(function(it, i){
    var pct = Math.round((it[1] / maxVal) * 100);
    var color = ST.colors[i % ST.colors.length];
    var lighter = lightenColor(color, 30);
    var label = String(it[0]).length > 16 ? String(it[0]).slice(0, 15) + '…' : String(it[0]);
    html += '<div class="css-bar" style="--h:' + pct + '%;--c:' + color + ';">' +
      '<div class="css-bar-fill" style="height:' + pct + '%;background:linear-gradient(180deg,' + color + ',' + lighter + ');"></div>' +
      '<span class="css-bar-value">' + it[1] + '</span>' +
      '<span class="css-bar-label" title="' + esc(it[0]) + '">' + esc(label) + '</span>' +
      '</div>';
  });
  container.innerHTML = html;
}

/* ---------- CSS pie chart ---------- */
function renderPieChart(id, items){
  var container = byId(id);
  if (!container) return;
  if (!items.length) { container.innerHTML = '<div class="css-empty">Nav datu.</div>'; return; }
  var total = items.reduce(function(sum, it){ return sum + it[1]; }, 0);
  if (total <= 0) total = 1;
  var startAngle = 0;
  var slicesHtml = '';
  var legendHtml = '';
  items.forEach(function(it, i){
    var pct = total > 0 ? (it[1] / total) * 100 : 0;
    var angle = pct * 3.6;
    var color = ST.colors[i % ST.colors.length];
    var label = String(it[0]).length > 14 ? String(it[0]).slice(0, 13) + '…' : String(it[0]);
    var endAngle = startAngle + angle;
    var largeArc = angle > 180 ? 1 : 0;
    var x1 = Math.cos(toRad(startAngle)) * 65 + 65;
    var y1 = Math.sin(toRad(startAngle)) * 65 + 65;
    var x2 = Math.cos(toRad(endAngle)) * 65 + 65;
    var y2 = Math.sin(toRad(endAngle)) * 65 + 65;
    var pathD = 'M 65 65 L ' + x1 + ' ' + y1 + ' A 65 65 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + ' Z';
    slicesHtml += '<path d="' + pathD + '" fill="' + color + '" />';
    legendHtml += '<div class="css-pie-legend-item"><div class="css-pie-legend-dot" style="background:' + color + '"></div><span>' + esc(label) + '</span><span style="font-weight:700;color:#f8fafc;">' + it[1] + ' (' + pct.toFixed(1) + '%)</span></div>';
    startAngle = endAngle;
  });
  container.innerHTML =
    '<div class="css-pie-chart">' +
    '<svg width="130" height="130" class="css-pie-svg">' + slicesHtml + '</svg>' +
    '<div class="css-pie-center"><div class="css-pie-total">' + total + '</div><div class="css-pie-sub">kopā</div></div>' +
    '</div>' +
    '<div class="css-pie-legend">' + legendHtml + '</div>';
}

function toRad(deg){ return deg * Math.PI / 180; }
function lightenColor(hex, pct){
  hex = hex.replace('#', '');
  var r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
  r = Math.round(r * (100 + pct) / 100); g = Math.round(g * (100 + pct) / 100); b = Math.round(b * (100 + pct) / 100);
  r = Math.min(255, Math.max(0, r)); g = Math.min(255, Math.max(0, g)); b = Math.min(255, Math.max(0, b));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/* ---------- CSS line chart ---------- */
function renderLineChart(id, items, lineCount){
  var container = byId(id);
  if (!container) return;
  container.style.setProperty('--line-count', lineCount);
  if (!items.length) { container.innerHTML = '<div class="css-empty">Nav datu.</div>'; return; }
  var maxVal = Math.max.apply(null, items.map(function(it){ return it[1]; }));
  if (maxVal <= 0) maxVal = 1;
  var dotsHtml = '';
  var labelsHtml = '';
  items.forEach(function(it, i){
    var pct = maxVal > 0 ? (it[1] / maxVal) * 100 : 0;
    var label = String(it[0]).length > 6 ? String(it[0]).slice(0, 5) + '…' : String(it[0]);
    dotsHtml += '<div class="css-line-point">' +
      '<div class="css-line-dot" style="bottom:' + pct + '%;"></div>' +
      '<span class="css-line-value">' + it[1] + '</span>' +
      '<span class="css-line-label" style="transform-origin:' + (i === 0 ? 'left bottom' : i === items.length - 1 ? 'right bottom' : 'center bottom') + ';">' + esc(label) + '</span>' +
      '</div>';
  });
  container.innerHTML = '<div class="css-line-chart">' + dotsHtml + '</div>';
}

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
document.addEventListener('DOMContentLoaded', function(){
  if (byId('chartClients')) initStatistika();
});
