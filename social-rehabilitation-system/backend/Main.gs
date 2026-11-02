// backend/Main.gs — galvenais servera ieejas punkts (Apps Script Web App)
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('frontend/index')
    .setTitle('Sociālās rehabilitācijas sistēma')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const action = data.action;
    const user = Authentication.getCurrentUser();
    if (!user) return jsonResponse({ ok: false, error: 'Nav pieteicies' });
    return jsonResponse(dispatch(action, data, user));
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function dispatch(action, data, user) {
  switch (action) {
    case 'login': return Authentication.login(data);
    case 'getClients': return Clients.list(user);
    case 'addClient': return Clients.add(data, user);
    case 'updateClient': return Clients.update(data, user);
    case 'deactivateClient': return Clients.deactivate(data, user);
    case 'getCascades': return Cascades.getAll(user);
    case 'addCascade': return Cascades.add(data, user);
    case 'updateCascade': return Cascades.update(data, user);
    case 'deactivateCascade': return Cascades.deactivate(data, user);
    case 'saveActivity': return Activities.save(data, user);
    case 'updateActivity': return Activities.update(data, user);
    case 'getActivity': return Activities.get(data, user);
    case 'getClientHistory': return Activities.clientHistory(data, user);
    case 'searchActivities': return Activities.search(data, user);
    case 'exportDocument': return Documents.export(data, user);
    case 'getSettings': return Settings.get(user);
    case 'updateSettings': return Settings.update(data, user);
    case 'getAuditLog': return Audit.getLog(user);
    default: return { ok: false, error: 'Nezināma darbība: ' + action };
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
