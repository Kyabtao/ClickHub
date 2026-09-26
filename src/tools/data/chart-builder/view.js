import { parseChartData, layoutChart, formatNumber } from './logic.js';
const NS = 'http://www.w3.org/2000/svg';
const SAMPLE = 'Month, Income, Spending\nJan, 4200, 3100\nFeb, 4100, 3350\nMar, 4600, 2900\nApr, 4400, 3700\nMay, 4800, 3200\nJun, 5000, 3600';
function svgElement(tag, attributes = {}) { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attributes)) el.setAttribute(k, String(v)); return el; }
function buildSVG(layout, title) {
 const legendHeight = layout.type === 'pie' ? 0 : 28;
 const height = layout.height + legendHeight + (title ? 32 : 0), offset = title ? 32 : 0;
 const svg = svgElement('svg', { xmlns: NS, viewBox: `0 0 ${layout.width} ${height}`, width: layout.width, height, role: 'img', 'font-family': 'Inter, Arial, sans-serif', 'font-size': 12 });
 svg.append(svgElement('rect', { x: 0, y: 0, width: layout.width, height, fill: '#ffffff' }));
 const heading = svgElement('title'); heading.textContent = title || `${layout.type} chart`; svg.append(heading);
 if (title) { const text = svgElement('text', { x: layout.width / 2, y: 22, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#1f2521' }); text.textContent = title; svg.append(text); }
 const plot = svgElement('g', { transform: `translate(0 ${offset})` }); svg.append(plot);
 for (const shape of layout.shapes) {
  let el;
  if (shape.kind === 'rect') el = svgElement('rect', { x: shape.x, y: shape.y, width: shape.width, height: shape.height, fill: shape.fill });
  else if (shape.kind === 'line') el = svgElement('line', { x1: shape.x1, x2: shape.x2, y1: shape.y1, y2: shape.y2, stroke: shape.stroke, 'stroke-width': 1 });
  else if (shape.kind === 'polyline') el = svgElement('polyline', { points: shape.points, fill: 'none', stroke: shape.stroke, 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  else if (shape.kind === 'circle') el = svgElement('circle', { cx: shape.cx, cy: shape.cy, r: shape.r, fill: shape.fill, stroke: '#ffffff', 'stroke-width': 1.5 });
  else el = svgElement('path', { d: shape.d, fill: shape.fill, stroke: '#ffffff', 'stroke-width': 1.5 });
  if (shape.title) { const tip = svgElement('title'); tip.textContent = shape.title; el.append(tip); }
  plot.append(el);
 }
 for (const item of layout.texts) { const text = svgElement('text', { x: item.x, y: item.y, 'text-anchor': item.anchor, fill: '#4b534d' }); text.textContent = item.text; plot.append(text); }
 const legend = svgElement('g'); plot.append(legend);
 if (layout.type === 'pie') layout.legend.slice(0, 16).forEach((entry, i) => {
  const y = 28 + i * 20; legend.append(svgElement('rect', { x: layout.width * 0.7, y: y - 10, width: 12, height: 12, fill: entry.color }));
  const text = svgElement('text', { x: layout.width * 0.7 + 18, y, fill: '#1f2521' }); text.textContent = entry.name.length > 28 ? entry.name.slice(0, 27) + '…' : entry.name; legend.append(text);
 });
 else { let x = 64; for (const entry of layout.legend) { const y = layout.height + 12; legend.append(svgElement('rect', { x, y: y - 10, width: 12, height: 12, fill: entry.color })); const text = svgElement('text', { x: x + 18, y, fill: '#1f2521' }); text.textContent = entry.name; legend.append(text); x += 36 + entry.name.length * 7; } }
 return svg;
}
export function mount(container, feedback) {
 let active = true, urls = [];
 container.innerHTML = `<label class="field-label" for="chart-title">Chart title (optional)</label><input id="chart-title" type="text" maxlength="80" value="Monthly budget"><label class="field-label" for="chart-type">Chart type</label><select id="chart-type"><option value="bar">Bar</option><option value="line">Line</option><option value="pie">Pie (one value column)</option></select><label class="field-label" for="input">Data (CSV: label, then 1–5 value columns; optional header row)</label><textarea id="input" spellcheck="false"></textarea><p>Up to 100 rows. Values containing commas must be quoted. Charts are drawn locally as SVG; PNG export renders that SVG in your browser.</p><div class="actions"><button id="run-tool" class="primary">Draw chart</button><button id="chart-svg" disabled>Download SVG</button><button id="chart-png" disabled>Download PNG</button></div><div id="chart-output" class="chart-output"></div><details id="chart-table-wrap" hidden><summary>Chart data table</summary><div id="chart-table" class="table-scroll" role="region" aria-label="Chart data" tabindex="0"></div></details>`;
 const $ = selector => container.querySelector(selector);
 $('#input').value = SAMPLE;
 let svg = null;
 function clear() { svg = null; $('#chart-output').replaceChildren(); $('#chart-table').replaceChildren(); $('#chart-table-wrap').hidden = true; $('#chart-svg').disabled = $('#chart-png').disabled = true; feedback.textContent = ''; }
 function download(blob, name) { const url = URL.createObjectURL(blob); urls.push(url); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); }
 $('#run-tool').onclick = () => {
  clear();
  try {
   const data = parseChartData($('#input').value), type = $('#chart-type').value, title = $('#chart-title').value.trim();
   const layout = layoutChart(data, type);
   svg = buildSVG(layout, title);
   svg.setAttribute('aria-label', `${title || 'Chart'}: ${type} chart of ${data.labels.length} items${data.series.length > 1 ? ` across ${data.series.length} series` : ''}. Values are listed in the data table below.`);
   $('#chart-output').append(svg);
   const table = document.createElement('table'), caption = document.createElement('caption'); caption.textContent = title || 'Chart data'; table.append(caption);
   const head = document.createElement('tr'); for (const name of ['Label', ...data.series.map(s => s.name)]) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = name; head.append(th); }
   const thead = document.createElement('thead'); thead.append(head); table.append(thead);
   const body = document.createElement('tbody');
   data.labels.forEach((label, i) => { const tr = document.createElement('tr'); const th = document.createElement('th'); th.scope = 'row'; th.textContent = label; tr.append(th); for (const s of data.series) { const td = document.createElement('td'); td.textContent = formatNumber(s.values[i]); tr.append(td); } body.append(tr); });
   table.append(body); $('#chart-table').append(table); $('#chart-table-wrap').hidden = false;
   $('#chart-svg').disabled = $('#chart-png').disabled = false;
   feedback.textContent = 'Chart ready.';
  } catch (error) { feedback.textContent = error.message; }
 };
 const serialized = () => new XMLSerializer().serializeToString(svg);
 $('#chart-svg').onclick = () => { if (!svg) return; download(new Blob([serialized()], { type: 'image/svg+xml' }), 'clickhub-chart.svg'); feedback.textContent = 'SVG downloaded.'; };
 $('#chart-png').onclick = async () => {
  if (!svg) return;
  const current = svg;
  try {
   const url = URL.createObjectURL(new Blob([serialized()], { type: 'image/svg+xml' })); urls.push(url);
   const image = new Image(); image.src = url; await image.decode();
   const width = Number(svg.getAttribute('width')), height = Number(svg.getAttribute('height'));
   const canvas = document.createElement('canvas'); canvas.width = width * 2; canvas.height = height * 2;
   const context = canvas.getContext('2d'); context.scale(2, 2); context.drawImage(image, 0, 0, width, height);
   const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
   if (!active || svg !== current) return;
   if (!blob) throw new Error('PNG export failed.');
   download(blob, 'clickhub-chart.png'); feedback.textContent = 'PNG downloaded.';
  } catch (error) { if (active) feedback.textContent = error.message || 'PNG export failed in this browser. Download the SVG instead.'; }
 };
 container.oninput = event => { if (['input', 'chart-title'].includes(event.target.id)) clear(); };
 container.onchange = event => { if (event.target.id === 'chart-type') clear(); };
 return () => { active = false; urls.forEach(url => URL.revokeObjectURL(url)); };
}
