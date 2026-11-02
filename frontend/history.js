// frontend/history.js
function renderHistory() {
  const c = document.getElementById('content');
  c.innerHTML = `<h2>Nodarbību vēsture</h2>
  <input id="histClient" placeholder="Klients">
  <input type="date" id="histFrom"> <input type="date" id="histTo">
  <button onclick="searchHistory()">Meklēt</button>
  <div id="histResults"></div>`;
}
async function searchHistory() {
  const res = await api('searchActivities', { date_from: document.getElementById('histFrom').value, date_to: document.getElementById('histTo').value });
  const d = document.getElementById('histResults');
  d.innerHTML = (res.records||[]).map(r => `<div class="card">${r.activity_date} - ${r.activity_area} - ${r.act_employee_name} <button onclick="openActivity('${r.activity_id}')">Atvērt</button></div>`).join('');
}
async function openActivity(id) {
  const res = await api('getActivity', { activity_id: id });
  const r = res.record;
  document.getElementById('content').innerHTML = `<h2>Ieraksts ${r.activity_id}</h2><pre>${JSON.stringify(r, null, 2)}</pre>`;
}
