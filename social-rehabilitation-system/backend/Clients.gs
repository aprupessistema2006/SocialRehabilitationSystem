// backend/Clients.gs
function Clients_list(user) {
  return { ok: true, clients: readAll('Klienti') };
}
function Clients_add(data, user) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const id = genId('K', 'Klienti', 'client_id');
    appendRow('Klienti', {
      client_id: id, client_full_name: data.client_full_name, status: 'Aktīvs',
      created_at: now(), updated_at: now(), created_by: user.email, notes: data.notes || ''
    });
    Audit.log(user, 'Izveide', 'klients', id, 'Jauns klients');
    return { ok: true, client_id: id };
  } finally { lock.releaseLock(); }
}
function Clients_update(data, user) {
  const updates = Object.assign({}, data); delete updates.client_id;
  updates.updated_at = now();
  updateRow('Klienti', 'client_id', data.client_id, updates);
  Audit.log(user, 'Labošana', 'klients', data.client_id, 'Klienta dati laboti');
  return { ok: true };
}
function Clients_deactivate(data, user) {
  updateRow('Klienti', 'client_id', data.client_id, { status: 'Neaktīvs', updated_at: now() });
  Audit.log(user, 'Deaktivizēšana', 'klients', data.client_id, 'Klients deaktivizēts');
  return { ok: true };
}
const Clients = { list: Clients_list, add: Clients_add, update: Clients_update, deactivate: Clients_deactivate };
