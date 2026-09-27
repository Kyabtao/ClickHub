// Minimal ZIP (PKWARE APPNOTE) reader/writer: stored + deflate, UTF-8 names, no ZIP64 or encryption.
export const MAX_ZIP_INPUT = 100 * 1024 * 1024;
export const MAX_ENTRY_OUTPUT = 200 * 1024 * 1024;
export const MAX_ENTRIES = 1000;
const TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(bytes) {
 let crc = 0xffffffff;
 for (let i = 0; i < bytes.length; i++) crc = TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
 return (crc ^ 0xffffffff) >>> 0;
}
export function dosDateTime(date) {
 const d = date instanceof Date && Number.isFinite(date.getTime()) ? date : new Date();
 const year = Math.min(2107, Math.max(1980, d.getFullYear()));
 return { time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2), date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
}
export function fromDosDateTime(date, time) {
 return new Date(((date >> 9) & 0x7f) + 1980, ((date >> 5) & 0x0f) - 1, date & 0x1f, (time >> 11) & 0x1f, (time >> 5) & 0x3f, (time & 0x1f) * 2);
}
async function transform(bytes, stream) {
 return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
export const deflateRaw = bytes => transform(bytes, new CompressionStream('deflate-raw'));
// Normalises a path for storage: forward slashes, no leading slash, no "." or ".." segments.
export function safeEntryName(name) {
 const parts = String(name).replace(/\\/g, '/').split('/').filter(part => part && part !== '.' && part !== '..');
 const clean = parts.map(part => part.replace(/[\u0000-\u001f]/g, '')).filter(Boolean).join('/');
 if (!clean) throw new Error('A file name is empty after removing unsafe path parts.');
 if (new TextEncoder().encode(clean).length > 0xffff) throw new Error('A file name is too long.');
 return clean;
}
export function uniqueNames(names) {
 const seen = new Set();
 return names.map(name => {
  let candidate = name, n = 2;
  const dot = name.lastIndexOf('.'), slash = name.lastIndexOf('/');
  const [stem, ext] = dot > slash + 1 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
  while (seen.has(candidate.toLowerCase())) candidate = `${stem} (${n++})${ext}`;
  seen.add(candidate.toLowerCase());
  return candidate;
 });
}
export async function buildZip(files, { compress = true, deflate = deflateRaw } = {}) {
 if (!files.length) throw new Error('Choose at least one file.');
 if (files.length > MAX_ENTRIES) throw new Error(`Add at most ${MAX_ENTRIES} files.`);
 const total = files.reduce((sum, file) => sum + file.data.length, 0);
 if (total > MAX_ZIP_INPUT) throw new Error('Files exceed 100 MiB in total.');
 const encoder = new TextEncoder(), names = uniqueNames(files.map(file => safeEntryName(file.name)));
 const locals = [], centrals = [];
 let offset = 0, saved = 0;
 for (let i = 0; i < files.length; i++) {
  const data = files[i].data, name = encoder.encode(names[i]), crc = crc32(data), stamp = dosDateTime(files[i].date);
  let body = data, method = 0;
  if (compress && data.length > 0) { const packed = await deflate(data); if (packed.length < data.length) { body = packed; method = 8; } }
  saved += data.length - body.length;
  const header = new DataView(new ArrayBuffer(30));
  header.setUint32(0, 0x04034b50, true); header.setUint16(4, 20, true); header.setUint16(6, 0x0800, true); header.setUint16(8, method, true);
  header.setUint16(10, stamp.time, true); header.setUint16(12, stamp.date, true); header.setUint32(14, crc, true);
  header.setUint32(18, body.length, true); header.setUint32(22, data.length, true); header.setUint16(26, name.length, true); header.setUint16(28, 0, true);
  locals.push(new Uint8Array(header.buffer), name, body);
  const central = new DataView(new ArrayBuffer(46));
  central.setUint32(0, 0x02014b50, true); central.setUint16(4, 0x031e, true); central.setUint16(6, 20, true); central.setUint16(8, 0x0800, true); central.setUint16(10, method, true);
  central.setUint16(12, stamp.time, true); central.setUint16(14, stamp.date, true); central.setUint32(16, crc, true); central.setUint32(20, body.length, true); central.setUint32(24, data.length, true);
  central.setUint16(28, name.length, true); central.setUint32(38, (0o100644 << 16) >>> 0, true); central.setUint32(42, offset, true);
  centrals.push(new Uint8Array(central.buffer), name);
  offset += 30 + name.length + body.length;
 }
 const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
 const end = new DataView(new ArrayBuffer(22));
 end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
 const parts = [...locals, ...centrals, new Uint8Array(end.buffer)], out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
 let position = 0; for (const part of parts) { out.set(part, position); position += part.length; }
 return { bytes: out, names, saved };
}
export function parseZip(bytes) {
 if (!(bytes instanceof Uint8Array)) throw new Error('ZIP data is required.');
 if (bytes.length > MAX_ZIP_INPUT) throw new Error('ZIP file exceeds 100 MiB.');
 const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
 let end = -1;
 for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
 if (end < 0) throw new Error('This is not a ZIP file, or it is damaged.');
 const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true), start = view.getUint32(end + 16, true);
 if (count === 0xffff || size === 0xffffffff || start === 0xffffffff) throw new Error('ZIP64 archives are not supported.');
 if (view.getUint16(end + 4, true) !== 0 || view.getUint16(end + 6, true) !== 0) throw new Error('Multi-part (split) ZIP archives are not supported.');
 if (count > MAX_ENTRIES) throw new Error(`Archives with more than ${MAX_ENTRIES} entries are not supported.`);
 if (start + size > end) throw new Error('ZIP central directory is damaged.');
 const utf8 = new TextDecoder('utf-8', { fatal: true }), latin = new TextDecoder('windows-1252'), entries = [];
 let p = start;
 for (let i = 0; i < count; i++) {
  if (p + 46 > end || view.getUint32(p, true) !== 0x02014b50) throw new Error('ZIP central directory is damaged.');
  const flags = view.getUint16(p + 8, true), method = view.getUint16(p + 10, true), crc = view.getUint32(p + 16, true);
  const compressedSize = view.getUint32(p + 20, true), size = view.getUint32(p + 24, true), nameLength = view.getUint16(p + 28, true);
  const extraLength = view.getUint16(p + 30, true), commentLength = view.getUint16(p + 32, true), offset = view.getUint32(p + 42, true);
  const rawName = bytes.subarray(p + 46, p + 46 + nameLength);
  // Names are UTF-8 when flag bit 11 is set; many tools also write UTF-8 without the flag, so fall back only if decoding fails.
  let name; try { name = utf8.decode(rawName); } catch { name = latin.decode(rawName); }
  if ([compressedSize, size, offset].includes(0xffffffff)) throw new Error('ZIP64 archives are not supported.');
  entries.push({ name, directory: name.endsWith('/'), method, encrypted: Boolean(flags & 1), crc, compressedSize, size, offset, modified: fromDosDateTime(view.getUint16(p + 14, true), view.getUint16(p + 12, true)) });
  p += 46 + nameLength + extraLength + commentLength;
 }
 return entries;
}
export async function extractEntry(bytes, entry, inflate = data => transform(data, new DecompressionStream('deflate-raw'))) {
 if (entry.directory) throw new Error('Folders have no content to extract.');
 if (entry.encrypted) throw new Error('Encrypted (password-protected) entries are not supported.');
 if (![0, 8].includes(entry.method)) throw new Error(`Compression method ${entry.method} is not supported; only stored and deflate entries can be extracted.`);
 if (entry.size > MAX_ENTRY_OUTPUT) throw new Error('This entry is larger than 200 MiB uncompressed.');
 const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
 if (entry.offset + 30 > bytes.length || view.getUint32(entry.offset, true) !== 0x04034b50) throw new Error('Local file header is damaged.');
 const dataStart = entry.offset + 30 + view.getUint16(entry.offset + 26, true) + view.getUint16(entry.offset + 28, true);
 if (dataStart + entry.compressedSize > bytes.length) throw new Error('Entry data is truncated.');
 const raw = bytes.subarray(dataStart, dataStart + entry.compressedSize);
 let data;
 try { data = entry.method === 0 ? raw.slice() : await inflate(raw); } catch { throw new Error('Entry data is damaged and could not be decompressed.'); }
 if (data.length !== entry.size || crc32(data) !== entry.crc) throw new Error('Checksum mismatch: the entry is damaged.');
 return data;
}
export function baseName(path) { return path.split('/').filter(Boolean).pop() || 'file'; }
export function formatBytes(value) {
 if (value < 1024) return `${value} B`;
 const units = ['KiB', 'MiB', 'GiB']; let n = value / 1024, u = 0;
 while (n >= 1024 && u < units.length - 1) { n /= 1024; u++; }
 return `${n.toFixed(n < 10 ? 1 : 0)} ${units[u]}`;
}
