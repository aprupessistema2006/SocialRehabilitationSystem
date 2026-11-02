// frontend/form.js — nodarbības forma
function renderForm() {
  const c = document.getElementById('content');
  c.innerHTML = `<h2>Jauna nodarbība</h2>
  <form id="activityForm">
    <label>Klients <select id="client_id" required></select></label>
    <label>Datums <input type="date" id="activity_date" required></label>
    <label>Nodarbības nosaukums <select id="activity_area" required></select></label>
    <label>Mērķis <select id="activity_goal" required></select></label>
    <label>Klienta problēma <select id="client_problem" required></select></label>
    <label>Uzdevums <select id="activity_task" required></select></label>
    <label>Refleksija <textarea id="activity_reflection"></textarea></label>
    <label>Sadarbība un motivācija <textarea id="client_motivation"></textarea></label>
    <label>Nodarbības gaita <textarea id="activity_process"></textarea></label>
    <label>Garastāvoklis <input id="client_mood"></label>
    <label>Nodarbības vērtējums <input id="activity_eval"></label>
    <label>Programmas izpilde <input id="activity_implementation"></label>
    <label>Komentārs/piezīme <textarea id="activity_comment"></textarea></label>
    <label>Darbinieks <input id="act_employee_name" readonly></label>
    <div class="btn-row">
      <button type="button" onclick="saveActivity()">Saglabāt</button>
      <button type="button" onclick="saveAndExport('pdf')">Saglabāt un eksportēt PDF</button>
      <button type="button" onclick="saveAndExport('xlsx')">Saglabāt un eksportēt Excel</button>
      <button type="button" onclick="clearForm()">Notīrīt formu</button>
      <button type="button" onclick="cancelForm()">Atcelt</button>
    </div>
  </form>`;
  loadClients(); loadCascades(); fillEmployee();
}
async function saveActivity() {
  const data = collectForm();
  const res = await api('saveActivity', data);
  if (res.ok) showToast('Saglabāts. Ieraksta numurs: ' + res.activity_id); else showToast('Kļūda: ' + res.error, true);
}
async function saveAndExport(fmt) {
  const data = collectForm();
  const res = await api('saveActivity', data);
  if (!res.ok) { showToast('Kļūda: ' + res.error, true); return; }
  const exp = await api('exportDocument', Object.assign({ activity_id: res.activity_id, format: fmt === 'pdf' ? 'pdf' : 'xlsx', filename: res.activity_id }, data));
  if (exp.ok) window.open(exp.url, '_blank'); else showToast('Eksporta kļūda: ' + exp.error, true);
}
function collectForm() {
  const ids = ['client_id','activity_date','activity_area','activity_goal','client_problem','activity_task','activity_reflection','client_motivation','activity_process','client_mood','activity_eval','activity_implementation','activity_comment','act_employee_name'];
  const o = {}; ids.forEach(i => { const el = document.getElementById(i); o[i] = el ? el.value : ''; }); return o;
}
function clearForm() { document.getElementById('activityForm').reset(); }
function cancelForm() { document.getElementById('content').innerHTML = ''; }
function fillEmployee() { const el = document.getElementById('act_employee_name'); if (el && window.currentUser) el.value = window.currentUser.employee_name; }
async function loadClients() {
  const res = await api('getClients'); const sel = document.getElementById('client_id'); if (!sel) return;
  sel.innerHTML = '<option value="">-- izvēlies --</option>';
  (res.clients || []).forEach(c => { const o = document.createElement('option'); o.value = c.client_id; o.textContent = c.client_full_name; sel.appendChild(o); });
}
let cascadeData = null;
async function loadCascades() {
  const res = await api('getCascades'); cascadeData = res;
  const sel = document.getElementById('activity_area'); if (!sel) return;
  sel.innerHTML = '<option value="">-- izvēlies --</option>';
  (res.areas || []).filter(a => a.active !== false).forEach(a => { const o = document.createElement('option'); o.value = a.name; o.textContent = a.name; sel.appendChild(o); });
}
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'activity_area') cascadeReset('goal');
  if (e.target && e.target.id === 'activity_goal') cascadeReset('problem');
  if (e.target && e.target.id === 'client_problem') cascadeReset('task');
});
function cascadeReset(level) {
  const g = document.getElementById('activity_goal'); const p = document.getElementById('client_problem'); const t = document.getElementById('activity_task');
  if (!cascadeData) return;
  if (level === 'goal' || level === 'problem' || level === 'task') { g.innerHTML = '<option value="">--</option>'; p.innerHTML = '<option value="">--</option>'; t.innerHTML = '<option value="">--</option>'; }
  const area = document.getElementById('activity_area').value;
  const areaObj = (cascadeData.areas||[]).find(a => a.name === area);
  (cascadeData.goals||[]).filter(x => x.activity_area_id === (areaObj && areaObj.activity_area_id) && x.active !== false).forEach(x => { const o=document.createElement('option'); o.value=x.name; o.textContent=x.name; g.appendChild(o); });
  if (level === 'problem' || level === 'task') { /* handled by change */ }
}
