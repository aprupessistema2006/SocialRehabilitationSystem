// backend/Documents.gs
function Documents_export(data, user) {
  const templateId = Settings.getTemplateId();
  const folderId = Settings.getExportFolderId();
  const copy = DriveApp.getFileById(templateId).makeCopy(data.filename || 'nodarbiba', DriveApp.getFolderById(folderId));
  const ss = SpreadsheetApp.openById(copy.getId());
  const sh = ss.getSheets()[0];
  const ranges = {
    client_full_name: '$B$3', act_employee: '$C$24', activity_area: '$C$5',
    activity_comment: '$A$23', activity_date: '$E$3', activity_eval: '$D$15',
    activity_goal: '$B$7', activity_implementation: '$A$19', activity_process: '$D$13',
    activity_task: '$B$10', client_mood: '$D$14', client_motivation: '$D$12',
    client_problem: '$B$8', activity_reflection: '$A$20'
  };
  Object.keys(ranges).forEach(k => {
    if (data[k] !== undefined) sh.getRange(ranges[k]).setValue(data[k]);
  });
  let url;
  if (data.format === 'pdf') {
    url = 'https://docs.google.com/spreadsheets/d/' + copy.getId() + '/export?format=pdf';
  } else {
    url = 'https://docs.google.com/spreadsheets/d/' + copy.getId() + '/export?format=xlsx';
  }
  Audit.log(user, 'Eksports', 'dokuments', data.activity_id || '', 'Eksports ' + data.format);
  return { ok: true, url: url, fileId: copy.getId() };
}
const Documents = { export: Documents_export };
