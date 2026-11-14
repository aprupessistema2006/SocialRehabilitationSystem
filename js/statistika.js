/* Statistika - uber profesionāla vizualizācijas panele, augstākās klases standarts */
var ST = {
  nodarbibas: [],
  klienti: [],
  darbinieki: [],
  sakums: {},
  charts: [],
  colors: ['#a855f7','#ec4899','#818cf8','#f472b6','#c4b5fd','#fbcfe8','#22c55e','#f43f5e','#6366f1','#3b82f6'],
  fsTarget: null,
  filters: { dateFrom: '', dateTo: '', client: '', worker: '' },
  modalChart: null
};

Chart.register(ChartDataLabels);
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 10, 30, 0.92)';
Chart.defaults.plugins.tooltip.titleColor = '#f8fafc';
Chart.defaults.plugins.tooltip.bodyColor = '#cbd5e1';
Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold', size: 13 };
Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
Chart.defaults.animation.duration = 1200;
Chart.defaults.animation.easing = 'easeOutQuart';

async function initStatistika(){
  var u = requireUser();
  byId('statMsg').textContent = 'Ielādē analītiku...';
  try {
    await Promise.all([
      api('getSakums', { employee_id: u.id }).then(function(r){ if (r.ok) ST.sakums = r; }),
      api('getNodarbibas', { access_token: getToken() }).then(function(r){ ST.nodarbibas = (r.ok && r.nodarbibas) ? r.nodarbibas : []; }),
      api('getKlienti', { access_token: getToken() }).then(function(r){ ST.klienti = (r.ok && r.klienti) ? r.klienti : []; }),
      api('getEmployees', { access_password: ACCESS_PASSWORD }).then(function(r){ ST.darbinieki = (r.ok && r.employees) ? r.employees : []; })
    ]);
    populateFilters();
    renderKPI(u);
    renderCharts();
    renderInsights();
    initExport();
    byId('statMsg').textContent = '';
  } catch (e) {
    byId('statMsg').textContent = 'Neizdevās ielādēt analītiku: ' + esc(String(e.message || e));
  }
}

function populateFilters(){
  var clientSel = byId('filterClient');
  var workerSel = byId('filterWorker');
  if (!clientSel || !workerSel) return;

  var clients = {};
  ST.nodarbibas.forEach(function(r){ var c = r.klients || 'Nezināms'; clients[c] = (clients[c] || 0) + 1; });
  Object.keys(clients).sort().forEach(function(c){
    var opt = document.createElement('option'); opt.value = c; opt.textContent = c + ' (' + clients[c] + ')';
    clientSel.appendChild(opt);
  });

  var workers = {};
  ST.nodarbibas.forEach(function(r){ var w = r.darbinieks || 'Nezināms'; workers[w] = (workers[w] || 0) + 1; });
  Object.keys(workers).sort().forEach(function(w){
    var opt = document.createElement('option'); opt.value = w; opt.textContent = w + ' (' + workers[w] + ')';
    workerSel.appendChild(opt);
  });

  byId('btnApplyFilters').addEventListener('click', applyFilters);
  byId('btnResetFilters').addEventListener('click', resetFilters);
}

function applyFilters(){
  ST.filters.dateFrom = byId('filterDateFrom').value || '';
  ST.filters.dateTo = byId('filterDateTo').value || '';
  ST.filters.client = byId('filterClient').value || '';
  ST.filters.worker = byId('filterWorker').value || '';
  renderKPI(requireUser());
  renderCharts();
  renderInsights();
}

function resetFilters(){
  byId('filterDateFrom').value = '';
  byId('filterDateTo').value = '';
  byId('filterClient').value = '';
  byId('filterWorker').value = '';
  ST.filters = { dateFrom: '', dateTo: '', client: '', worker: '' };
  renderKPI(requireUser());
  renderCharts();
  renderInsights();
}

function isRecordIncluded(r){
  if (ST.filters.dateFrom && r.datums && String(r.datums) < ST.filters.dateFrom) return false;
  if (ST.filters.dateTo && r.datums && String(r.datums) > ST.filters.dateTo) return false;
  if (ST.filters.client && String(r.klients || '') !== ST.filters.client) return false;
  if (ST.filters.worker && String(r.darbinieks || '') !== ST.filters.worker) return false;
  return true;
}

function getFiltered(){
  return (ST.nodarbibas || []).filter(isRecordIncluded);
}

function renderKPI(u){
  var nb = getFiltered();
  var s = ST.sakums || {};

  var total = nb.length;
  var today = countToday(nb);
  var activeClients = ST.klienti.filter(function(k){ return String(k.statuss || '').toLowerCase().indexOf('akt') === 0; }).length;
  var mine = nb.filter(function(r){ return String(r.employee_id || r.darbinieks_id || '') === String(u.id || ''); }).length;
  var pctComplete = total > 0 ? Math.round((nb.filter(function(r){ return String(r.pildits || '').toLowerCase().indexOf('piln') >= 0 || String(r.pildits || '').toLowerCase() === 'jā'; }).length / total) * 100) : 0;
  var ratings = nb.map(function(r){ return parseFloat(r.vertejums); }).filter(function(v){ return !isNaN(v) && v > 0; });
  var avgRating = ratings.length > 0 ? (ratings.reduce(function(a,b){ return a + b; }, 0) / ratings.length).toFixed(1) : '-';

  animateValue('statTotal', getElText('statTotal'), total);
  animateValue('statToday', getElText('statToday'), today);
  animateValue('statClients', getElText('statClients'), activeClients);
  animateValue('statMine', getElText('statMine'), mine);
  setText('statPctComplete', pctComplete + '%');
  setText('statAvgRating', avgRating);

  setDelta('statTotalDelta', total, s.kopskaits);
  setDelta('statTodayDelta', today, s.sodien);
  setDelta('statClientsDelta', activeClients, s.aktivie);
  setDelta('statMineDelta', mine, s.mani);
  setDelta('statPctCompleteDelta', pctComplete + '%', '-');
  setDelta('statAvgRatingDelta', avgRating, '-');
}

function getElText(id){ var el=byId(id); return el ? el.textContent : '0'; }

function setText(id, v){ var el = byId(id); if (el) el.textContent = (v == null ? '0' : v); }

function animateValue(id, start, end, duration){
  var el = byId(id);
  if (!el) return;
  if (end == null) end = 0;
  start = parseFloat(String(start).replace(/[^\d.-]/g,'')) || 0;
  end = parseFloat(end) || 0;
  if (duration === undefined) duration = 900;
  var startTime = null;
  function step(timestamp){
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    var current = Math.floor(progress * (end - start) + start);
    el.textContent = current;
    if (progress < 1) { window.requestAnimationFrame(step); }
  }
  window.requestAnimationFrame(step);
}

function setDelta(id, current, baseline){
  var el = byId(id);
  if (!el) return;
  if (baseline == null || baseline === '-' || baseline === '') { el.textContent = ''; el.className = 'kpi-delta kpi-delta-neutral'; return; }
  var curNum = parseFloat(String(current).replace('%','').replace(',','.'));
  var baseNum = parseFloat(String(baseline).replace('%','').replace(',','.'));
  if (isNaN(curNum) || isNaN(baseNum)) { el.textContent = ''; el.className = 'kpi-delta kpi-delta-neutral'; return; }
  var diff = curNum - baseNum;
  var pct = baseNum === 0 ? (curNum > 0 ? 100 : 0) : Math.round((diff / baseNum) * 100);
  var cls = 'kpi-delta kpi-delta-neutral';
  var sign = '';
  if (diff > 0) { cls = 'kpi-delta kpi-delta-up'; sign = '+'; }
  else if (diff < 0) { cls = 'kpi-delta kpi-delta-down'; sign = ''; }
  el.textContent = sign + pct + '%';
  el.className = cls;
}

function countToday(arr){
  var d = new Date();
  var dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, 0);
  var today = dd + '.' + mm + '.' + d.getFullYear();
  return (arr || []).filter(function(r){ return String(r.datums) === today; }).length;
}

function groupBy(arr, keyFn){
  var out = {};
  arr.forEach(function(r){
    var k = keyFn(r);
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

function destroyCharts(){
  ST.charts.forEach(function(c){ try{ c.destroy(); }catch(e){} });
  ST.charts = [];
}

function renderCharts(){
  destroyCharts();
  var nb = getFiltered();
  var ids = ['chartClients','chartWorkers','chartTimeline','chartTypes','chartStatus','chartMood'];
  if (!nb.length){
    ids.forEach(function(id){
      var el = byId(id); if(el) el.innerHTML = '<div class="css-empty">Nav ierakstu analīzei.</div>';
    });
    return;
  }

  // 1. Bar: clients (horizontal, top 8)
  var byClient = groupBy(nb, function(r){ return r.klients || 'Nezināms'; });
  var clientItems = Object.entries(byClient).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 8).reverse();
  createChart('chartClients', 'bar', 'Nodarbības pēc klienta', clientItems.map(function(i){return i[0];}), clientItems.map(function(i){return i[1];}), false);

  // 2. Pie: workers
  var byWorker = groupBy(nb, function(r){ return r.darbinieks || 'Nezināms'; });
  var workerItems = Object.entries(byWorker);
  createChart('chartWorkers', 'pie', 'Nodarbības pēc darbinieka', workerItems.map(function(i){return i[0];}), workerItems.map(function(i){return i[1];}), true);

  // 3. Line: timeline
  var byDate = groupBy(nb, function(r){ return r.datums || '-'; });
  var dates = Object.keys(byDate).sort().slice(-14);
  var dateItems = dates.map(function(d){ return [d, byDate[d] || 0]; });
  createChart('chartTimeline', 'line', 'Nodarbības laika gaitā', dateItems.map(function(i){return i[0];}), dateItems.map(function(i){return i[1];}), false);

  // 4. Doughnut: types
  var byType = groupBy(nb, function(r){ return r.nodarbiba_nosaukums || 'Nezināms'; });
  var typeItems = Object.entries(byType).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 6);
  createChart('chartTypes', 'doughnut', 'Nodarbību veidu sadalījums', typeItems.map(function(i){return i[0];}), typeItems.map(function(i){return i[1];}), true);

  // 5. Pie: status
  var pildits = 0, nepildits = 0;
  nb.forEach(function(r){
    if (String(r.pildits || '').toLowerCase().indexOf('piln') >= 0 || String(r.pildits || '').toLowerCase() === 'jā') pildits++;
    else nepildits++;
  });
  createChart('chartStatus', 'pie', 'Pildības statuss', ['Pildīts','Nepildīts'], [pildits, nepildits], true);

  // 6. Bar: mood (horizontal, top 8)
  var byMood = groupBy(nb, function(r){ return r.garastavoklis || 'Nezināms'; });
  var moodItems = Object.entries(byMood).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 8).reverse();
  createChart('chartMood', 'bar', 'Klienta garastāvoklis', moodItems.map(function(i){return i[0];}), moodItems.map(function(i){return i[1];}), false);
}

function createChart(canvasId, type, title, labels, values, isRound){
  var canvas = byId(canvasId);
  if (!canvas) return;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  var ctx = canvas.getContext('2d');
  var total = values.reduce(function(a,b){ return a + b; }, 0);
  var chart = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: 'Ieraksti',
        data: values,
        backgroundColor: ST.colors.slice(0, values.length),
        borderColor: ST.colors.slice(0, values.length),
        borderWidth: isRound ? 4 : 0,
        borderRadius: isRound ? 0 : 6,
        borderSkipped: false,
        hoverOffset: isRound ? 20 : 10,
        barPercentage: 0.7,
        categoryPercentage: 0.85,
        barThickness: isRound ? undefined : 20,
        maxBarThickness: 28
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isRound ? undefined : 'y',
      layout: { padding: 24 },
      plugins: {
        legend: { display: false },
        title: { display: false },
        datalabels: {
          color: '#fff',
          font: { weight: '800', size: 11 },
          formatter: function(value, ctx){
            var sum = ctx.chart.data.datasets[0].data.reduce(function(a,b){ return a + b; }, 0);
            return sum > 0 ? (value * 100 / sum).toFixed(1) + '%' : '';
          },
          display: function(ctx){ return ctx.dataset.data[ctx.dataIndex] > 0; },
          anchor: isRound ? 'center' : 'end',
          align: isRound ? 'center' : 'start',
          offset: isRound ? 0 : 6,
          clip: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(15, 10, 30, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          titleFont: { weight: 'bold', size: 13 },
          bodyFont: { size: 12 },
          padding: 14,
          cornerRadius: 12,
          displayColors: false,
          usePointStyle: true,
          callbacks: {
            label: function(ctx){
              return ctx.parsed + ' (' + ((ctx.parsed / total) * 100).toFixed(1) + '%)';
            }
          }
        }
      },
      scales: isRound ? undefined : {
        x: { beginAtZero: true, grid: { color: 'rgba(168,85,247,0.10)', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
        y: { grid: { display: false }, ticks: { color: '#cbd5e1', font: { size: 11 } } }
      },
      animation: { duration: 1400, easing: 'easeOutQuart' }
    }
  });
  canvas.parentElement.style.cursor = 'zoom-in';
  canvas.parentElement.onclick = function(){ openModal(chart, title); };
  ST.charts.push(chart);
}

function openModal(chartInstance, title){
  var modal = byId('fsModal');
  if (!modal) return;
  var fsBody = byId('fsBody');
  var fsTitle = byId('fsTitle');
  fsTitle.textContent = title;
  fsBody.innerHTML = '';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(function(){
    var canvas = document.createElement('canvas');
    canvas.id = 'modalCanvas';
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.width = 900;
    canvas.height = 600;
    fsBody.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var clone = new Chart(ctx, {
      type: chartInstance.config.type,
      data: JSON.parse(JSON.stringify(chartInstance.config.data)),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: chartInstance.config.options.indexAxis,
        layout: { padding: 30 },
        plugins: {
          legend: { display: false },
          title: { display: true, text: title, font: { size: 22, weight: 'bold' }, color: '#f8fafc', padding: 24 },
          datalabels: chartInstance.config.options.plugins.datalabels,
          tooltip: chartInstance.config.options.plugins.tooltip
        },
        scales: chartInstance.config.options.scales,
        animation: { duration: 1200, easing: 'easeOutQuart' }
      }
    });
    ST.modalChart = clone;
    setTimeout(function(){ if (ST.modalChart) ST.modalChart.resize(); }, 50);
  }, 0);
  byId('fsClose').onclick = closeModal;
  modal.onclick = function(e){ if(e.target === modal) closeModal(); };
  document.onkeydown = function(e){ if(e.key === 'Escape') closeModal(); };
}

function closeModal(){
  var modal = byId('fsModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  if (ST.modalChart){ try{ ST.modalChart.destroy(); }catch(e){} ST.modalChart = null; }
}

function renderInsights(){
  var nb = getFiltered();
  var container = byId('insightsContent');
  if (!container) return;
  if (!nb.length) { container.innerHTML = '<p style="color:#94a3b8;">Nav datu secinājumu ģenerēšanai.</p>'; return; }

  var total = nb.length;
  var insights = [];

  var byClient = groupBy(nb, function(r){ return r.klients || 'Nezināms'; });
  var topClient = Object.entries(byClient).sort(function(a,b){ return b[1] - a[1]; })[0];
  if (topClient) {
    var pct = Math.round((topClient[1] / total) * 100);
    insights.push('<div class="insight-item"><span class="insight-dot"></span><div><strong>Aktīvākais klients:</strong> <strong>' + esc(topClient[0]) + '</strong> veido <strong>' + pct + '%</strong> no visiem ierakstiem (' + topClient[1] + ' nodarbības).</div></div>');
  }

  var byWorker = groupBy(nb, function(r){ return r.darbinieks || 'Nezināms'; });
  var topWorker = Object.entries(byWorker).sort(function(a,b){ return b[1] - a[1]; })[0];
  if (topWorker) {
    var pct = Math.round((topWorker[1] / total) * 100);
    insights.push('<div class="insight-item"><span class="insight-dot"></span><div><strong>Visaktivākais darbinieks:</strong> <strong>' + esc(topWorker[0]) + '</strong> ir reģistrējis <strong>' + pct + '%</strong> no visiem ierakstiem (' + topWorker[1] + ').</div></div>');
  }

  var pildits = nb.filter(function(r){ return String(r.pildits || '').toLowerCase().indexOf('piln') >= 0 || String(r.pildits || '').toLowerCase() === 'jā'; }).length;
  var pctComplete = total > 0 ? Math.round((pildits / total) * 100) : 0;
  var statusText = pctComplete >= 80 ? 'Augsta pildības disciplīna' : pctComplete >= 50 ? 'Vidēja pildības līmenis' : 'Zemā pildības līmenis, nepieciešams uzlabojums';
  insights.push('<div class="insight-item"><span class="insight-dot"></span><div><strong>Pildības statuss:</strong> <strong>' + pctComplete + '%</strong> no ierakstiem ir pilnībā pildītas. ' + statusText + '.</div></div>');

  var ratings = nb.map(function(r){ return parseFloat(r.vertejums); }).filter(function(v){ return !isNaN(v) && v > 0; });
  if (ratings.length > 0) {
    var avg = ratings.reduce(function(a,b){ return a + b; }, 0) / ratings.length;
    var ratingText = avg >= 4.5 ? 'Izcili' : avg >= 3.5 ? 'Labi' : avg >= 2.5 ? 'Vidēji' : 'Vajag uzlabojumu';
    insights.push('<div class="insight-item"><span class="insight-dot"></span><div><strong>Vidējais vērtējums:</strong> <strong>' + avg.toFixed(1) + '/5</strong> (' + ratings.length + ' ieraksti). ' + ratingText + '.</div></div>');
  }

  var today = countToday(nb);
  insights.push('<div class="insight-item"><span class="insight-dot"></span><div><strong>Šodienas aktivitāte:</strong> <strong>' + today + '</strong> nodarbība(-es) reģistrētas šodien.</div></div>');

  container.innerHTML = insights.join('');
}

function initExport(){
  var btn = byId('btnExportStats');
  if (!btn) return;
  btn.addEventListener('click', function(){
    var nb = getFiltered();
    if (!nb.length) { alert('Nav datu eksportam.'); return; }
    var headers = ['ID','Klients','Datums','Nodarbība','Mērķis','Problēma','Uzdevums','Darbinieks','Vērtējums','Pildīts','Komentārs'];
    var rows = nb.map(function(r){
      return [
        r.id || '', r.klients || '', r.datums || '', r.nodarbiba_nosaukums || '',
        r.merkis || '', r.problema || '', r.uzdevums || '', r.darbinieks || '',
        r.vertejums || '', r.pildits || '', r.komentars || ''
      ];
    });
    var csv = [headers.join(';')].concat(rows.map(function(row){
      return row.map(function(cell){ return '"' + String(cell || '').replace(/"/g, '""') + '"'; }).join(';');
    })).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'statistika_' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
document.addEventListener('DOMContentLoaded', function(){
  if (byId('chartClients')) initStatistika();
});
