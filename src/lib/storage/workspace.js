export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
export const MAX_RECORDS = 500;
export function requiredText(value, label, max = 200) {
 if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} is required (maximum ${max} characters).`);
 return value.trim();
}
export function dateOnly(value, optional = false) {
 if (optional && value === '') return '';
 if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use a date in YYYY-MM-DD format.');
 const date = new Date(value + 'T00:00:00Z');
 if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Invalid calendar date.');
 return value;
}
export function localToday(date = new Date()) {
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validateBackup(value, config) {
 if (!value || value.version !== 1 || value.tool !== config.id || !Array.isArray(value.records)) throw new Error('Wrong tool or unsupported backup format.');
 if (value.records.length > MAX_RECORDS) throw new Error(`Maximum ${MAX_RECORDS} records per tool.`);
 const ids = new Set();
 const records = value.records.map(record => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid record.');
  const id = requiredText(record.id, 'Record ID', 100);
  if (ids.has(id)) throw new Error('Duplicate record ID.');
  ids.add(id);
  return { ...config.validate(record), id };
 });
 return { version: 1, tool: config.id, records };
}
export function parseBackup(text, config) {
 if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new Error('Backup exceeds 2 MiB.');
 return validateBackup(JSON.parse(text), config);
}
export function createStore(config, storage = localStorage) {
 const key = `clickhub:workspace:${config.id}`;
 // Do not silently replace corrupt or unreadable data with an empty list.
 let baseline = storage.getItem(key);
 let data = baseline === null ? {version:1,tool:config.id,records:[]} : parseBackup(baseline, config);
 return {
  get records() { return structuredClone(data.records); },
  export() { return JSON.stringify(data, null, 2); },
  replace(records) {
   const next = validateBackup({version:1,tool:config.id,records}, config);
   const text = JSON.stringify(next);
   if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new Error('Data exceeds 2 MiB. Export a backup and reduce the content.');
   if (storage.getItem(key) !== baseline) throw new Error('Data changed in another tab. Close and reopen this tool before editing.');
   try { storage.setItem(key, text); } catch { throw new Error('Not saved: browser storage is blocked or full. Your previous saved data is unchanged.'); }
   baseline = text; data = next;
  },
 };
}
