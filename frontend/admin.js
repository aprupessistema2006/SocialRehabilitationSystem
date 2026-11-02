// frontend/admin.js
function renderAdmin() {
  const c = document.getElementById('content');
  c.innerHTML = `<h2>Administrēšana</h2>
  <button onclick="renderClientsAdmin()">Klienti</button>
  <button onclick="renderCascadesAdmin()">Kaskādes</button>
  <button onclick="renderAudit()">Audita žurnāls</button>
  <div id="adminArea"></div>`;
}
async function renderClientsAdmin() {
  const res = await api('getClients');
  document.getElementById('adminArea').innerHTML = (res.clients||[]).map(c => `<div>${c.client_id} ${c.client_full_name} (${c.status})</div>`).join('');
}
async function renderCascadesAdmin() {
  const res = await api('getCascades');
  document.getElementById('adminArea').innerHTML = `<pre>${JSON.stringify(res, null, 2)}</pre>`;
}
async function renderAudit() {
  const res = await api('getAuditLog');
  document.getElementById('adminArea').innerHTML = (res.logs||[]).map(l => `<div>${l.timestamp} ${l.action} ${l.record_type} ${l.record_id}</div>`).join('');
}
