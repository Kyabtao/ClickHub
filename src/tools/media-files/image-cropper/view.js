import { readImage, exportImage } from '../../../lib/images/process.js';
import { centeredCrop, validateCrop, rectFromDrag, ratioValue } from './logic.js';
const PREVIEW_MAX = 640;
export function mount(container, feedback) {
 let active = true, revision = 0, bitmap = null, outputURL = null, crop = null, scale = 1, drag = null;
 container.innerHTML = '<label class="field-label" for="image-file">PNG, JPEG, or WebP image (up to 10 MiB)</label><input id="image-file" type="file" accept="image/png,image/jpeg,image/webp"><p id="image-info">No image loaded.</p><label class="field-label" for="crop-ratio">Aspect ratio</label><select id="crop-ratio"><option value="free">Free</option><option value="1:1">1:1 square</option><option value="4:3">4:3</option><option value="3:2">3:2</option><option value="16:9">16:9</option><option value="3:4">3:4 portrait</option><option value="9:16">9:16 portrait</option></select><div class="actions"><button id="crop-center" type="button">Centre largest crop</button></div><canvas id="crop-canvas" class="crop-canvas" hidden role="img" aria-label="Image with crop selection. Drag to select, or use the pixel fields."></canvas><p>Drag on the preview to select an area, or type exact values below. Values are in original image pixels.</p><div class="unit-pair"><div><label class="field-label" for="crop-x">Left (x)</label><input id="crop-x" type="number" min="0" step="1"></div><div><label class="field-label" for="crop-y">Top (y)</label><input id="crop-y" type="number" min="0" step="1"></div></div><div class="unit-pair"><div><label class="field-label" for="crop-width">Width</label><input id="crop-width" type="number" min="1" step="1"></div><div><label class="field-label" for="crop-height">Height</label><input id="crop-height" type="number" min="1" step="1"></div></div><label class="field-label" for="image-format">Output format</label><select id="image-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select><label class="field-label" for="image-quality">JPEG/WebP quality (0.1–1; ignored for PNG)</label><input id="image-quality" type="number" min="0.1" max="1" step="0.1" value="0.9"><p>Images stay on your device. Output is a new raster image at the cropped size (up to 8192 px per side and 16 MP); metadata is not preserved.</p><div class="actions"><button id="process-image" class="primary" disabled>Crop image</button><a id="download-image" hidden>Download image</a></div><div id="image-preview"></div>';
 const $ = selector => container.querySelector(selector);
 const canvas = $('#crop-canvas'), fields = ['x', 'y', 'width', 'height'];
 function ready(value) { container.querySelectorAll('input:not(#image-file),select,#process-image,#crop-center').forEach(el => el.disabled = !value); }
 function clearOutput() { revision++; if (outputURL) URL.revokeObjectURL(outputURL); outputURL = null; $('#download-image').hidden = true; $('#download-image').removeAttribute('href'); $('#image-preview').replaceChildren(); }
 function draw() {
  if (!bitmap) return;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (!crop) return;
  const x = crop.x * scale, y = crop.y * scale, w = crop.width * scale, h = crop.height * scale;
  context.fillStyle = 'rgba(0,0,0,0.55)';
  context.fillRect(0, 0, canvas.width, y); context.fillRect(0, y + h, canvas.width, canvas.height - y - h);
  context.fillRect(0, y, x, h); context.fillRect(x + w, y, canvas.width - x - w, h);
  context.lineWidth = 2; context.strokeStyle = '#ffffff'; context.strokeRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
  context.setLineDash([6, 4]); context.strokeStyle = '#1f2a1c'; context.strokeRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2)); context.setLineDash([]);
 }
 function setCrop(rect, announce = false) {
  crop = rect; fields.forEach(key => { $(`#crop-${key}`).value = rect[key]; });
  draw(); clearOutput();
  if (announce) feedback.textContent = `Selection: ${rect.width} × ${rect.height} pixels at (${rect.x}, ${rect.y}).`;
 }
 $('#image-file').onchange = async () => {
  clearOutput(); const current = revision; bitmap?.close(); bitmap = null; crop = null; ready(false); canvas.hidden = true; $('#image-info').textContent = 'Loading…'; feedback.textContent = '';
  try {
   const loaded = await readImage($('#image-file').files[0]);
   if (!active || revision !== current) { loaded.close(); return; }
   bitmap = loaded; scale = Math.min(1, PREVIEW_MAX / bitmap.width, PREVIEW_MAX / bitmap.height);
   canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale)); canvas.hidden = false;
   // Display at a comfortable size (up to ~480 px tall), independent of the internal preview resolution.
   canvas.style.width = `min(100%, ${Math.round(480 * bitmap.width / bitmap.height)}px)`;
   $('#image-info').textContent = `Source: ${bitmap.width} × ${bitmap.height} pixels`;
   ready(true); setCrop(centeredCrop(bitmap.width, bitmap.height, ratioValue($('#crop-ratio').value)));
   feedback.textContent = 'Image loaded. Drag on the preview or enter crop values.';
  } catch (error) { if (active && revision === current) { $('#image-info').textContent = 'No image loaded.'; feedback.textContent = error.message; } }
 };
 $('#crop-ratio').onchange = $('#crop-center').onclick = () => { if (bitmap) setCrop(centeredCrop(bitmap.width, bitmap.height, ratioValue($('#crop-ratio').value)), true); };
 for (const key of fields) $(`#crop-${key}`).oninput = () => {
  if (!bitmap) return; clearOutput();
  try { crop = validateCrop(Object.fromEntries(fields.map(k => [k, $(`#crop-${k}`).value])), bitmap.width, bitmap.height); draw(); feedback.textContent = ''; }
  catch (error) { crop = null; draw(); feedback.textContent = error.message; }
 };
 const point = event => { const box = canvas.getBoundingClientRect(); return { x: (event.clientX - box.left) / box.width * bitmap.width, y: (event.clientY - box.top) / box.height * bitmap.height }; };
 canvas.onpointerdown = event => { if (!bitmap || $('#crop-ratio').disabled) return; drag = point(event); canvas.setPointerCapture(event.pointerId); event.preventDefault(); };
 canvas.onpointermove = event => { if (drag) setCrop(rectFromDrag(drag, point(event), ratioValue($('#crop-ratio').value), bitmap.width, bitmap.height)); };
 canvas.onpointerup = canvas.onpointercancel = event => { if (!drag) return; setCrop(rectFromDrag(drag, point(event), ratioValue($('#crop-ratio').value), bitmap.width, bitmap.height), true); drag = null; };
 $('#image-format').onchange = clearOutput; $('#image-quality').oninput = clearOutput;
 $('#process-image').onclick = async () => {
  clearOutput(); const current = revision;
  if (!bitmap) { feedback.textContent = 'Choose an image first.'; return; }
  feedback.textContent = 'Processing…';
  try {
   const rect = validateCrop(Object.fromEntries(fields.map(k => [k, $(`#crop-${k}`).value])), bitmap.width, bitmap.height), type = $('#image-format').value;
   const result = await exportImage(bitmap, rect.width, rect.height, type, $('#image-quality').value, rect);
   if (!active || revision !== current) return;
   outputURL = URL.createObjectURL(result.blob); const link = $('#download-image'); link.href = outputURL; link.download = `clickhub-crop.${type === 'image/jpeg' ? 'jpg' : type.split('/')[1]}`; link.hidden = false;
   result.canvas.setAttribute('role', 'img'); result.canvas.setAttribute('aria-label', 'Cropped image preview'); $('#image-preview').replaceChildren(result.canvas);
   feedback.textContent = `Ready: ${result.canvas.width} × ${result.canvas.height} pixels, ${result.blob.size.toLocaleString()} bytes.`;
  } catch (error) { if (active && revision === current) feedback.textContent = error.message; }
 };
 ready(false);
 return () => { active = false; revision++; bitmap?.close(); if (outputURL) URL.revokeObjectURL(outputURL); };
}
