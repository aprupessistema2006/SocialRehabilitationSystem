// backend/Authentication.gs
function Authentication_getUserEmail() { return Session.getActiveUser().getEmail(); }
function Authentication_getAllowed() { return readAll('Darbinieki'); }
function Authentication_getCurrentUser() {
  const email = Authentication_getUserEmail();
  const list = Authentication_getAllowed();
  const emp = list.find(e => e.email === email && e.is_active === true);
  if (!emp) return null;
  return { email: email, employee_id: emp.employee_id, employee_name: emp.employee_name, role: emp.role };
}
function Authentication_login(data) {
  const u = Authentication_getCurrentUser();
  if (!u) return { ok: false, error: 'Piekļuve liegta' };
  return { ok: true, user: u };
}
const Authentication = { getCurrentUser: Authentication_getCurrentUser, login: Authentication_login };
// Audit helper
const Audit = {
  log: function(user, action, type, id, details) {
    try { appendRow('Audita_zurnals', { log_id: genId('L','Audita_zurnals','log_id'), timestamp: now(), user_id: user.email, action: action, record_type: type, record_id: id, details: details }); } catch(e){}
  },
  getLog: function(user) {
    if (user.role !== 'ADMIN') return { ok: false, error: 'Nav tiesību' };
    return { ok: true, logs: readAll('Audita_zurnals') };
  }
};
