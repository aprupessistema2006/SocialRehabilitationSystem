// backend/Cascades.gs
function Cascades_getAll(user) {
  return {
    ok: true,
    areas: readAll('Nodarbibu_veidi'),
    goals: readAll('Merki'),
    problems: readAll('Problemas'),
    tasks: readAll('Uzdevumi')
  };
}
function Cascades_add(data, user) {
  const map = { area: ['Nodarbibu_veidi','activity_area_id'], goal: ['Merki','goal_id'], problem: ['Problemas','problem_id'], task: ['Uzdevumi','task_id'] };
  const [sheet, col] = map[data.type];
  const prefix = data.type === 'area' ? 'A' : data.type === 'goal' ? 'G' : data.type === 'problem' ? 'P' : 'T';
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = genId(prefix, sheet, col);
    const row = { [col]: id, name: data.name, active: true, sort_order: data.sort_order || 0 };
    if (data.parent_id) {
      const parentCol = data.type === 'goal' ? 'activity_area_id' : data.type === 'problem' ? 'goal_id' : 'problem_id';
      row[parentCol] = data.parent_id;
    }
    appendRow(sheet, row);
    Audit.log(user, 'Izveide', 'kaskāde', id, 'Jauns elements');
    return { ok: true, id: id };
  } finally { lock.releaseLock(); }
}
function Cascades_update(data, user) {
  const map = { area: 'Nodarbibu_veidi', goal: 'Merki', problem: 'Problemas', task: 'Uzdevumi' };
  const idCol = { area: 'activity_area_id', goal: 'goal_id', problem: 'problem_id', task: 'task_id' }[data.type];
  updateRow(map[data.type], idCol, data.id, data.updates || {});
  return { ok: true };
}
function Cascades_deactivate(data, user) {
  const map = { area: 'Nodarbibu_veidi', goal: 'Merki', problem: 'Problemas', task: 'Uzdevumi' };
  const idCol = { area: 'activity_area_id', goal: 'goal_id', problem: 'problem_id', task: 'task_id' }[data.type];
  updateRow(map[data.type], idCol, data.id, { active: false });
  Audit.log(user, 'Deaktivizēšana', 'kaskāde', data.id, 'Elements deaktivizēts');
  return { ok: true };
}
const Cascades = { getAll: Cascades_getAll, add: Cascades_add, update: Cascades_update, deactivate: Cascades_deactivate };
