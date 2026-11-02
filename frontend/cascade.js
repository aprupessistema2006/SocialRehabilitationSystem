// frontend/cascade.js — kaskāžu loģika
function cascadeUpdate(selectId, items, parentKey, parentVal) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">-- izvēlies --</option>';
  items.filter(x => x[parentKey] === parentVal && x.active !== false)
       .sort((a,b) => (a.sort_order||0)-(b.sort_order||0))
       .forEach(x => { const o = document.createElement('option'); o.value = x.name; o.textContent = x.name; sel.appendChild(o); });
}
function clearCascade(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = '<option value="">--</option>'; }); }
