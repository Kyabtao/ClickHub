import { readImage } from '../../../lib/images/process.js';
import { OCR_LANGUAGES } from './languages.js';
import { languageString, workerOptions, ocrScale, tidyText, summarize, progressLabel } from './logic.js';
export function mount(container, feedback) {
 let active = true, revision = 0, bitmap = null, previewURL = null, textURL = null, worker = null, workerLangs = '', running = false, rawText = '';
 const languageBoxes = OCR_LANGUAGES.map(({ code, name }) => `<label class="check-label"><input type="checkbox" name="ocr-lang" value="${code}"${code === 'eng' ? ' checked' : ''}> ${name}</label>`).join('');
 container.innerHTML = `<label class="field-label" for="image-file">Image with text (PNG, JPEG, or WebP; up to 10 MiB)</label><input id="image-file" type="file" accept="image/png,image/jpeg,image/webp"><p class="subtle-note">Tip: you can also paste a screenshot with Ctrl+V / ⌘V while this tool is open.</p><p id="image-info">No image loaded.</p><div id="ocr-preview" class="ocr-preview"></div><fieldset class="mode-switch ocr-langs"><legend class="field-label">Languages in the image (up to 3)</legend>${languageBoxes}</fieldset><label class="field-label" for="ocr-layout">Output layout</label><select id="ocr-layout"><option value="lines">Keep line breaks</option><option value="paragraphs">Join lines into paragraphs</option></select><p>Recognition runs entirely in your browser with Tesseract. The engine (about 4 MB) and each language (0.7–3 MB) load from this site the first time you run OCR; nothing is uploaded. Works best on clear, straight, printed text. Handwriting, stylised fonts, and low-resolution photos may produce errors, so check the result.</p><div class="actions"><button id="run-tool" class="primary" disabled>Extract text</button><button id="ocr-cancel" type="button" hidden>Cancel</button></div><div id="ocr-progress-wrap" hidden><label class="field-label" for="ocr-progress" id="ocr-progress-label">Working…</label><progress id="ocr-progress" max="1" value="0"></progress></div><p id="ocr-summary" role="status"></p><label class="field-label" for="result">Extracted text (editable)</label><textarea id="result" spellcheck="true"></textarea><div class="actions"><button id="copy">Copy text</button><button id="ocr-download" disabled>Download .txt</button></div>`;
 const $ = selector => container.querySelector(selector);
 const selected = () => [...container.querySelectorAll('[name="ocr-lang"]:checked')].map(box => box.value);
 function setRunning(value) {
  running = value; $('#ocr-cancel').hidden = !value; $('#ocr-progress-wrap').hidden = !value;
  $('#run-tool').disabled = value || !bitmap; $('#image-file').disabled = value;
  container.querySelectorAll('[name="ocr-lang"],#ocr-layout').forEach(el => { el.disabled = value; });
 }
 function clearResult() { rawText = ''; $('#result').value = ''; $('#ocr-summary').textContent = ''; $('#ocr-download').disabled = true; if (textURL) URL.revokeObjectURL(textURL); textURL = null; }
 async function stopWorker() { const current = worker; worker = null; workerLangs = ''; if (current) await current.terminate().catch(() => {}); }
 async function loadFile(file) {
  if (running) return;
  revision++; const current = revision; clearResult(); feedback.textContent = '';
  bitmap?.close(); bitmap = null; $('#run-tool').disabled = true; $('#ocr-preview').replaceChildren(); if (previewURL) URL.revokeObjectURL(previewURL); previewURL = null;
  $('#image-info').textContent = 'Loading…';
  try {
   const loaded = await readImage(file);
   if (!active || current !== revision) { loaded.close(); return; }
   bitmap = loaded; previewURL = URL.createObjectURL(file);
   const img = document.createElement('img'); img.src = previewURL; img.alt = 'Selected image for text recognition'; $('#ocr-preview').append(img);
   $('#image-info').textContent = `Image: ${bitmap.width} × ${bitmap.height} pixels`;
   $('#run-tool').disabled = false; feedback.textContent = 'Image ready. Choose languages, then extract text.';
  } catch (error) { if (active && current === revision) { $('#image-info').textContent = 'No image loaded.'; feedback.textContent = error.message; } }
 }
 $('#image-file').onchange = () => { const file = $('#image-file').files[0]; if (file) loadFile(file); };
 const onPaste = event => {
  if (!active || !container.isConnected) return;
  const item = [...(event.clipboardData?.items || [])].find(entry => entry.kind === 'file' && entry.type.startsWith('image/'));
  if (!item) return;
  event.preventDefault();
  const file = item.getAsFile();
  if (file) { $('#image-file').value = ''; loadFile(new File([file], file.name || 'pasted-image.png', { type: file.type })); }
 };
 document.addEventListener('paste', onPaste);
 container.querySelectorAll('[name="ocr-lang"]').forEach(box => { box.onchange = () => { clearResult(); feedback.textContent = ''; }; });
 $('#ocr-layout').onchange = () => { if (rawText) { $('#result').value = tidyText(rawText, $('#ocr-layout').value); feedback.textContent = 'Layout updated.'; } };
 $('#run-tool').onclick = async () => {
  if (!bitmap || running) return;
  revision++; const current = revision; clearResult();
  let langs;
  try { langs = languageString(selected()); } catch (error) { feedback.textContent = error.message; return; }
  setRunning(true); feedback.textContent = 'Starting…';
  const progress = message => { if (!active || current !== revision) return; $('#ocr-progress').value = Number.isFinite(message.progress) ? message.progress : 0; $('#ocr-progress-label').textContent = progressLabel(message.status, message.progress); };
  try {
   const size = ocrScale(bitmap.width, bitmap.height), canvas = document.createElement('canvas');
   canvas.width = size.width; canvas.height = size.height;
   const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is not available in this browser.');
   context.fillStyle = '#ffffff'; context.fillRect(0, 0, size.width, size.height);
   context.imageSmoothingQuality = 'high'; context.drawImage(bitmap, 0, 0, size.width, size.height);
   if (!worker || workerLangs !== langs) {
    await stopWorker();
    const { createWorker } = (await import('tesseract.js/dist/tesseract.esm.min.js')).default; // only a default export
    if (!active || current !== revision) return;
    worker = await createWorker(langs.split('+'), 1, workerOptions(import.meta.env.BASE_URL, location.origin, progress));
    workerLangs = langs;
   }
   if (!active || current !== revision) return;
   const { data } = await worker.recognize(canvas);
   if (!active || current !== revision) return;
   rawText = data.text || '';
   const text = tidyText(rawText, $('#ocr-layout').value), info = summarize(text, data.confidence);
   $('#result').value = text;
   $('#ocr-download').disabled = !text;
   $('#ocr-summary').textContent = text ? `${info.words} words · ${info.lines} lines · confidence ${info.confidence ?? '—'}% (${info.quality})${info.quality === 'low' ? '. Try a sharper, straighter, or higher-resolution image.' : ''}` : '';
   feedback.textContent = text ? 'Text extracted. Review it for mistakes before use.' : 'No text was found. Check the language selection or try a clearer image.';
  } catch (error) {
   if (active && current === revision) { await stopWorker(); feedback.textContent = `Text recognition failed: ${error?.message || error}`; }
  } finally { if (active && current === revision) setRunning(false); }
 };
 $('#ocr-cancel').onclick = async () => { revision++; await stopWorker(); if (!active) return; setRunning(false); feedback.textContent = 'Recognition cancelled.'; $('#run-tool').focus(); };
 $('#result').oninput = () => { $('#ocr-download').disabled = !$('#result').value; };
 $('#ocr-download').onclick = () => {
  if (!$('#result').value) return;
  if (textURL) URL.revokeObjectURL(textURL);
  textURL = URL.createObjectURL(new Blob([$('#result').value], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = textURL; link.download = 'clickhub-ocr.txt'; link.click();
  feedback.textContent = 'Text downloaded.';
 };
 return () => { active = false; revision++; document.removeEventListener('paste', onPaste); stopWorker(); bitmap?.close(); if (previewURL) URL.revokeObjectURL(previewURL); if (textURL) URL.revokeObjectURL(textURL); };
}
