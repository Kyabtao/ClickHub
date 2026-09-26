import { buildZip, parseZip, extractEntry, baseName, formatBytes, MAX_ZIP_INPUT, MAX_ENTRIES } from './logic.js';
export function mount(container, feedback) {
 let active = true, revision = 0, chosen = [], archive = null, zipURL = null, entryURLs = [];
 container.innerHTML = '<fieldset class="mode-switch"><legend class="field-label">Mode</legend><label class="check-label"><input type="radio" name="zip-mode" value="create" checked> Create a ZIP</label><label class="check-label"><input type="radio" name="zip-mode" value="extract"> Open a ZIP</label></fieldset><div id="zip-create"><label class="field-label" for="zip-files">Files to add</label><input id="zip-files" type="file" multiple><label class="field-label" for="zip-folder">Or add a folder (keeps sub-folders)</label><input id="zip-folder" type="file" webkitdirectory multiple><p id="zip-chosen" role="status">No files added.</p><ul id="zip-list" class="file-list"></ul><label class="field-label" for="zip-name">Archive name</label><input id="zip-name" type="text" value="clickhub-archive" maxlength="100"><label class="check-label"><input id="zip-compress" type="checkbox" checked> Compress (deflate). Files that would not shrink are stored as-is.</label><div class="actions"><button id="zip-build" class="primary" disabled>Create ZIP</button><button id="zip-clear" type="button" disabled>Clear files</button><a id="zip-download" hidden>Download ZIP</a></div></div><div id="zip-extract" hidden><label class="field-label" for="zip-archive">ZIP file (up to 100 MiB)</label><input id="zip-archive" type="file" accept=".zip,application/zip,application/x-zip-compressed"><p id="zip-summary" role="status"></p><label class="field-label" for="zip-filter" hidden id="zip-filter-label">Filter entries</label><input id="zip-filter" type="search" hidden><div id="zip-entries" class="table-scroll" role="region" aria-label="ZIP contents" tabindex="0" hidden></div></div><p>Everything happens on your device. Up to 1,000 files and 100 MiB in total. Standard ZIP only: password-protected, ZIP64 (over 4 GiB), split, and non-deflate (e.g. LZMA) archives are not supported. Extracted files download one at a time and are checked with CRC-32.</p>';
 const $ = selector => container.querySelector(selector);
 const revoke = () => { if (zipURL) URL.revokeObjectURL(zipURL); zipURL = null; entryURLs.forEach(url => URL.revokeObjectURL(url)); entryURLs = []; };
 function clearZip() { revision++; if (zipURL) URL.revokeObjectURL(zipURL); zipURL = null; $('#zip-download').hidden = true; $('#zip-download').removeAttribute('href'); }
 function renderChosen() {
  const total = chosen.reduce((sum, item) => sum + item.file.size, 0), list = $('#zip-list');
  list.replaceChildren();
  chosen.forEach((item, index) => {
   const li = document.createElement('li'), name = document.createElement('span'), remove = document.createElement('button');
   name.textContent = `${item.path} · ${formatBytes(item.file.size)}`; remove.type = 'button'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${item.path}`);
   remove.onclick = () => { chosen.splice(index, 1); clearZip(); renderChosen(); ($('#zip-list button') || $('#zip-files')).focus(); };
   li.append(name, remove); list.append(li);
  });
  $('#zip-chosen').textContent = chosen.length ? `${chosen.length} file${chosen.length === 1 ? '' : 's'} · ${formatBytes(total)}${total > MAX_ZIP_INPUT ? ' — over the 100 MiB limit' : ''}` : 'No files added.';
  $('#zip-build').disabled = $('#zip-clear').disabled = !chosen.length;
 }
 function addFiles(input, useRelative) {
  const incoming = [...input.files].map(file => ({ file, path: useRelative && file.webkitRelativePath ? file.webkitRelativePath : file.name }));
  if (chosen.length + incoming.length > MAX_ENTRIES) feedback.textContent = `Only the first ${MAX_ENTRIES} files were added.`; else feedback.textContent = '';
  chosen = [...chosen, ...incoming].slice(0, MAX_ENTRIES); input.value = ''; clearZip(); renderChosen();
 }
 $('#zip-files').onchange = () => addFiles($('#zip-files'), false);
 $('#zip-folder').onchange = () => addFiles($('#zip-folder'), true);
 $('#zip-clear').onclick = () => { chosen = []; clearZip(); renderChosen(); feedback.textContent = 'File list cleared.'; $('#zip-files').focus(); };
 $('#zip-name').oninput = $('#zip-compress').onchange = clearZip;
 $('#zip-build').onclick = async () => {
  clearZip(); const current = revision, button = $('#zip-build');
  button.disabled = true; feedback.textContent = 'Creating ZIP…';
  try {
   if (chosen.reduce((sum, item) => sum + item.file.size, 0) > MAX_ZIP_INPUT) throw new Error('Files exceed 100 MiB in total. Remove some files.');
   const files = await Promise.all(chosen.map(async item => ({ name: item.path, data: new Uint8Array(await item.file.arrayBuffer()), date: new Date(item.file.lastModified) })));
   const result = await buildZip(files, { compress: $('#zip-compress').checked });
   if (!active || current !== revision) return;
   zipURL = URL.createObjectURL(new Blob([result.bytes], { type: 'application/zip' }));
   const name = ($('#zip-name').value.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-') || 'clickhub-archive').replace(/\.zip$/i, '');
   const link = $('#zip-download'); link.href = zipURL; link.download = `${name}.zip`; link.hidden = false;
   const renamed = result.names.filter((n, i) => n !== chosen[i].path).length;
   feedback.textContent = `ZIP ready: ${result.names.length} files, ${formatBytes(result.bytes.length)}${result.saved > 0 ? `, saved ${formatBytes(result.saved)}` : ''}.${renamed ? ` ${renamed} name${renamed === 1 ? ' was' : 's were'} adjusted to avoid duplicates or unsafe paths.` : ''}`;
  } catch (error) { if (active && current === revision) feedback.textContent = error.message; }
  finally { if (active) button.disabled = !chosen.length; }
 };
 function renderEntries() {
  const wrap = $('#zip-entries'); wrap.replaceChildren();
  if (!archive) return;
  const query = $('#zip-filter').value.trim().toLowerCase();
  const visible = archive.entries.filter(entry => !entry.directory && entry.name.toLowerCase().includes(query));
  const table = document.createElement('table'), caption = document.createElement('caption'); caption.textContent = `Files in ${archive.name}`; table.append(caption);
  const head = document.createElement('tr'); for (const label of ['File', 'Size', 'Packed', 'Modified', 'Action']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; head.append(th); }
  const thead = document.createElement('thead'); thead.append(head); table.append(thead);
  const body = document.createElement('tbody');
  for (const entry of visible) {
   const tr = document.createElement('tr');
   for (const value of [entry.name, formatBytes(entry.size), formatBytes(entry.compressedSize), entry.modified.toLocaleString()]) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
   const action = document.createElement('td'), button = document.createElement('button');
   button.type = 'button'; button.textContent = 'Download'; button.setAttribute('aria-label', `Download ${entry.name}`);
   if (entry.encrypted || ![0, 8].includes(entry.method)) { button.disabled = true; button.textContent = entry.encrypted ? 'Encrypted' : 'Unsupported'; }
   button.onclick = async () => {
    const current = revision; button.disabled = true; feedback.textContent = `Extracting ${entry.name}…`;
    try {
     const data = await extractEntry(archive.bytes, entry);
     if (!active || current !== revision) return;
     const url = URL.createObjectURL(new Blob([data])); entryURLs.push(url);
     const link = document.createElement('a'); link.href = url; link.download = baseName(entry.name); link.click();
     feedback.textContent = `Extracted ${entry.name} (${formatBytes(data.length)}, checksum verified).`;
    } catch (error) { if (active && current === revision) feedback.textContent = error.message; }
    finally { if (active) button.disabled = false; }
   };
   action.append(button); tr.append(action); body.append(tr);
  }
  if (!visible.length) { const tr = document.createElement('tr'), td = document.createElement('td'); td.colSpan = 5; td.textContent = 'No files match.'; tr.append(td); body.append(tr); }
  table.append(body); wrap.append(table);
 }
 $('#zip-archive').onchange = async () => {
  revision++; const current = revision; archive = null; entryURLs.forEach(url => URL.revokeObjectURL(url)); entryURLs = [];
  for (const id of ['#zip-entries', '#zip-filter', '#zip-filter-label']) $(id).hidden = true;
  $('#zip-entries').replaceChildren(); $('#zip-summary').textContent = ''; feedback.textContent = '';
  const file = $('#zip-archive').files[0]; if (!file) return;
  try {
   if (file.size > MAX_ZIP_INPUT) throw new Error('ZIP file exceeds 100 MiB.');
   const bytes = new Uint8Array(await file.arrayBuffer());
   if (!active || current !== revision) return;
   const entries = parseZip(bytes), files = entries.filter(entry => !entry.directory);
   archive = { name: file.name, bytes, entries };
   const unsupported = files.filter(entry => entry.encrypted || ![0, 8].includes(entry.method)).length;
   $('#zip-summary').textContent = `${files.length} file${files.length === 1 ? '' : 's'} · ${formatBytes(files.reduce((sum, entry) => sum + entry.size, 0))} uncompressed${unsupported ? ` · ${unsupported} cannot be extracted` : ''}`;
   for (const id of ['#zip-entries', '#zip-filter', '#zip-filter-label']) $(id).hidden = false;
   $('#zip-filter').value = ''; renderEntries(); feedback.textContent = 'Archive opened locally.';
  } catch (error) { if (active && current === revision) feedback.textContent = error.message; }
 };
 $('#zip-filter').oninput = renderEntries;
 container.querySelectorAll('[name="zip-mode"]').forEach(radio => radio.onchange = () => { const extract = container.querySelector('[name="zip-mode"]:checked').value === 'extract'; $('#zip-create').hidden = extract; $('#zip-extract').hidden = !extract; feedback.textContent = ''; });
 return () => { active = false; revision++; revoke(); };
}
