/* Statistika - analīze ar reālajiem datiem no API */
var ST = { charts: [], nodarbibas: [], klienti: [], sakums: {} };

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

function destroyCharts(){ ST.charts.forEach(function(c){ try { c.destroy(); } catch (e) {} }); ST.charts = []; }
function getCtx(id){ var el = document.getElementById(id); return el ? el.getContext('2d') : null; }

function renderCharts(){
  destroyCharts();
  var nb = ST.nodarbibas || [];
  if (!nb.length) { document.getElementById('statMsg').textContent = 'Nav ierakstu analīzei. Pievienojiet darbus un atgriežieties šeit.'; return; }

  // Iestata explicitais kanva augstums, lai Chart.js neizvelktu stabus bezgalībai
  ['chartClients','chartWorkers','chartTimeline','chartTypes','chartStatus'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.height=280;
  });

  // 1. Bar: nodarbības pēc klienta
  var byClient = groupBy(nb, function(r){ return r.klients || 'Nezināms'; });
  var clientLabels = Object.keys(byClient).sort(function(a, b){ return byClient[b] - byClient[a]; }).slice(0, 8);
  var clientData = clientLabels.map(function(l){ return byClient[l]; });
  var c1 = getCtx('chartClients');
  if (c1) {
    ST.charts.push(new Chart(c1, {
      type: 'bar',
      data: {
        labels: clientLabels,
        datasets: [{
          label: 'Nodarbības',
          data: clientData,
          backgroundColor: 'rgba(168,85,247,.7)',
          borderColor: '#a855f7',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#cbd5e1', font: { size: 11 } },
            grid: { color: 'rgba(168,85,247,.15)' }
          },
          x: {
            ticks: { color: '#cbd5e1', font: { size: 11 } },
            grid: { display: false }
          }
        }
      }
    }));
  }

  // 2. Pie: nodarbības pēc darbinieka
  var byWorker = groupBy(nb, function(r){ return r.darbinieks || 'Nezināms'; });
  var workerLabels = Object.keys(byWorker);
  var workerData = workerLabels.map(function(l){ return byWorker[l]; });
  var c2 = getCtx('chartWorkers');
  if (c2) {
    ST.charts.push(new Chart(c2, {
      type: 'pie',
      data: {
        labels: workerLabels,
        datasets: [{
          data: workerData,
          backgroundColor: ['#a855f7', '#ec4899', '#818cf8', '#f472b6', '#c4b5fd', '#fbcfe8'],
          borderColor: 'rgba(15,10,30,.8)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 12 }, padding: 20 } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                var total = ctx.dataset.data.reduce(function(a, b){ return a + b; }, 0);
                var val = ctx.parsed || ctx.raw;
                var pct = ((val / total) * 100).toFixed(1);
                return ctx.label + ': ' + val + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    }));
  }

  // 3. Line: nodarbības laika gaitā (pēdējie 14 dienas)
  var byDate = groupBy(nb, function(r){ return r.datums || '-'; });
  var dates = Object.keys(byDate).sort().slice(-14);
  var dateData = dates.map(function(d){ return byDate[d] || 0; });
  var c3 = getCtx('chartTimeline');
  if (c3) {
    ST.charts.push(new Chart(c3, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Ieraksti dienā',
          data: dateData,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168,85,247,.15)',
          borderWidth: 3,
          pointBackgroundColor: '#a855f7',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#cbd5e1', font: { size: 11 } },
            grid: { color: 'rgba(168,85,247,.15)' }
          },
          x: {
            ticks: { color: '#cbd5e1', font: { size: 10, maxRotation: 45, minRotation: 45 } },
            grid: { display: false }
          }
        }
      }
    }));
  }

  // 4. Doughnut: nodarbību veidu sadalījums
  var byType = groupBy(nb, function(r){ return r.nodarbiba_nosaukums || 'Nezināms'; });
  var typeLabels = Object.keys(byType).sort(function(a, b){ return byType[b] - byType[a]; }).slice(0, 6);
  var typeData = typeLabels.map(function(l){ return byType[l]; });
  var c4 = getCtx('chartTypes');
  if (c4) {
    ST.charts.push(new Chart(c4, {
      type: 'doughnut',
      data: {
        labels: typeLabels,
        datasets: [{
          data: typeData,
          backgroundColor: ['#a855f7', '#ec4899', '#818cf8', '#f472b6', '#c4b5fd', '#fbcfe8'],
          borderColor: 'rgba(15,10,30,.8)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 12 }, padding: 20 } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                var total = ctx.dataset.data.reduce(function(a, b){ return a + b; }, 0);
                var val = ctx.parsed || ctx.raw;
                var pct = ((val / total) * 100).toFixed(1);
                return ctx.label + ': ' + val + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    }));
  }

  // 5. Pie: pildības statuss
  var pildits = 0, nepildits = 0;
  nb.forEach(function(r){
    if (String(r.pildits || '').toLowerCase().indexOf('piln') >= 0 || String(r.pildits || '').toLowerCase() === 'jā') {
      pildits++;
    } else {
      nepildits++;
    }
  });
  var c5 = getCtx('chartStatus');
  if (c5) {
    ST.charts.push(new Chart(c5, {
      type: 'pie',
      data: {
        labels: ['Pildīts', 'Nepildīts'],
        datasets: [{
          data: [pildits, nepildits],
          backgroundColor: ['#22c55e', '#f43f5e'],
          borderColor: 'rgba(15,10,30,.8)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 13 }, padding: 20 } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                var total = ctx.dataset.data.reduce(function(a, b){ return a + b; }, 0);
                var val = ctx.parsed || ctx.raw;
                var pct = total ? ((val / total) * 100).toFixed(1) : '0';
                return ctx.label + ': ' + val + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    }));
  }
}

function groupBy(arr, keyFn){
  var out = {};
  arr.forEach(function(r){
    var k = keyFn(r);
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}
document.addEventListener('DOMContentLoaded', function(){
  if (byId('chartClients')) initStatistika();
});
