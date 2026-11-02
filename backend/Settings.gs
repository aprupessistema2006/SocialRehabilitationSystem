// backend/Settings.gs
function Settings_getDbId() { return PropertiesService.getScriptProperties().getProperty('DB_ID') || ''; }
function Settings_getTemplateId() { return PropertiesService.getScriptProperties().getProperty('TEMPLATE_ID') || ''; }
function Settings_getExportFolderId() { return PropertiesService.getScriptProperties().getProperty('EXPORT_FOLDER_ID') || ''; }
function Settings_get(user) {
  return { ok: true, dbId: Settings_getDbId(), templateId: Settings_getTemplateId(), exportFolderId: Settings_getExportFolderId() };
}
function Settings_update(data, user) {
  if (user.role !== 'ADMIN') return { ok: false, error: 'Nav tiesību' };
  const p = PropertiesService.getScriptProperties();
  if (data.dbId) p.setProperty('DB_ID', data.dbId);
  if (data.templateId) p.setProperty('TEMPLATE_ID', data.templateId);
  if (data.exportFolderId) p.setProperty('EXPORT_FOLDER_ID', data.exportFolderId);
  return { ok: true };
}
const Settings = { getDbId: Settings_getDbId, getTemplateId: Settings_getTemplateId, getExportFolderId: Settings_getExportFolderId, get: Settings_get, update: Settings_update };
