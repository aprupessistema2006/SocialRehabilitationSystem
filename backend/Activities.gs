// backend/Activities.gs
function Activities_save(data, user) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = genId('N', 'Nodarbibas', 'activity_id');
    const row = {
      activity_id: id,
      client_id: data.client_id,
      activity_date: data.activity_date,
      activity_area: data.activity_area,
      activity_goal: data.activity_goal,
      client_problem: data.client_problem,
      activity_task: data.activity_task,
      activity_reflection: data.activity_reflection || '',
      client_motivation: data.client_motivation || '',
      activity_process: data.activity_process || '',
      client_mood: data.client_mood || '',
      activity_eval: data.activity_eval || '',
      activity_implementation: data.activity_implementation || '',
      activity_comment: data.activity_comment || '',
      act_employee_id: user.employee_id,
      act_employee_name: user.employee_name,
      created_at: now(),
      updated_at: now(),
      created_by: user.email,
      updated_by: user.email,
      status: 'Aktīvs'
    };
    appendRow('Nodarbibas', row);
    Audit.log(user, 'Izveide', 'nodarbība', id, 'Jauna nodarbība');
    return { ok: true, activity_id: id };
  } finally { lock.releaseLock(); }
}
const Activities = { save: Activities_save };

function Activities_update(data, user) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = data.activity_id;
    const updates = Object.assign({}, data);
    delete updates.activity_id;
    updates.updated_at = now();
    updates.updated_by = user.email;
    updateRow('Nodarbibas', 'activity_id', id, updates);
    Audit.log(user, 'Labošana', 'nodarbība', id, 'Ieraksts labots');
    return { ok: true };
  } finally { lock.releaseLock(); }
}
Activities.update = Activities_update;

function Activities_get(data, user) {
  const rows = readAll('Nodarbibas');
  return { ok: true, record: rows.find(r => r.activity_id === data.activity_id) || null };
}
Activities.get = Activities_get;

function Activities_clientHistory(data, user) {
  const rows = readAll('Nodarbibas').filter(r => r.client_id === data.client_id);
  return { ok: true, records: rows };
}
Activities.clientHistory = Activities_clientHistory;

function Activities_search(data, user) {
  let rows = readAll('Nodarbibas');
  if (data.date_from) rows = rows.filter(r => new Date(r.activity_date) >= new Date(data.date_from));
  if (data.date_to) rows = rows.filter(r => new Date(r.activity_date) <= new Date(data.date_to));
  if (data.employee) rows = rows.filter(r => r.act_employee_name === data.employee);
  if (data.area) rows = rows.filter(r => r.activity_area === data.area);
  return { ok: true, records: rows };
}
Activities.search = Activities_search;
