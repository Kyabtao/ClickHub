export const PALETTE = ['#2f6f4e', '#3b5bdb', '#c2410c', '#7c3aed', '#0e7490', '#a21caf', '#4d7c0f', '#b91c1c'];
export const MAX_POINTS = 100, MAX_SERIES = 5;
// Lenient single-line CSV: trims spaces around cells and allows spaces before quoted values.
export function splitRow(line, number) {
 const cells = []; let cell = '', quoted = false, wasQuoted = false;
 for (let i = 0; i < line.length; i++) {
  const c = line[i];
  if (quoted) {
   if (c === '"' && line[i + 1] === '"') { cell += '"'; i++; }
   else if (c === '"') quoted = false;
   else cell += c;
  } else if (c === '"' && !cell.trim() && !wasQuoted) { quoted = true; wasQuoted = true; cell = ''; }
  else if (c === ',') { cells.push(wasQuoted ? cell : cell.trim()); cell = ''; wasQuoted = false; }
  else if (wasQuoted && c.trim()) throw new Error(`Row ${number}: unexpected text after a closing quote.`);
  else if (!wasQuoted) cell += c;
 }
 if (quoted) throw new Error(`Row ${number}: a quoted value is not closed.`);
 cells.push(wasQuoted ? cell : cell.trim());
 return cells;
}
function number(text, where) {
 const clean = String(text).trim().replace(/,/g, '');
 if (!/^[-+]?(\d+(\.\d*)?|\.\d+)(e[-+]?\d+)?$/i.test(clean)) throw new Error(`${where}: “${text}” is not a number.`);
 const value = Number(clean);
 if (!Number.isFinite(value) || Math.abs(value) > 1e15) throw new Error(`${where}: number is out of range.`);
 return value;
}
// First column holds labels; up to five numeric columns are series. A non-numeric first row is treated as a header.
export function parseChartData(text) {
 if (typeof text !== 'string' || !text.trim()) throw new Error('Enter data such as “Month, Sales” rows.');
 if (text.length > 50000) throw new Error('Data limit: 50,000 characters.');
 const rows = text.split(/\r?\n/).filter(line => line.trim()).map((line, i) => splitRow(line, i + 1)).map(row => row.map(cell => cell.trim()));
 if (!rows.length) throw new Error('No data rows found.');
 const width = rows[0].length;
 if (width < 2) throw new Error('Each row needs a label and at least one value, separated by commas.');
 if (width > MAX_SERIES + 1) throw new Error(`Use at most ${MAX_SERIES} value columns.`);
 rows.forEach((row, index) => { if (row.length !== width) throw new Error(`Row ${index + 1} has ${row.length} columns; expected ${width}.`); });
 const looksNumeric = cell => { try { number(cell, ''); return true; } catch { return false; } };
 const header = rows[0].slice(1).some(cell => !looksNumeric(cell));
 const body = header ? rows.slice(1) : rows;
 if (!body.length) throw new Error(`Row 1 was read as a header because “${rows[0].slice(1).find(cell => !looksNumeric(cell))}” is not a number. Add numeric data rows below it.`);
 if (body.length > MAX_POINTS) throw new Error(`Use at most ${MAX_POINTS} data rows.`);
 const names = header ? rows[0].slice(1).map((name, i) => name || `Series ${i + 1}`) : Array.from({ length: width - 1 }, (_, i) => width === 2 ? 'Value' : `Series ${i + 1}`);
 return {
  labels: body.map((row, i) => row[0] || `Item ${i + 1}`),
  series: names.map((name, s) => ({ name, values: body.map((row, i) => number(row[s + 1], `Row ${i + 1 + (header ? 1 : 0)}, column ${s + 2}`)) })),
 };
}
export function niceScale(min, max, ticks = 5) {
 let lo = Math.min(0, min), hi = Math.max(0, max);
 if (lo === hi) hi = lo + 1;
 const raw = (hi - lo) / ticks, magnitude = 10 ** Math.floor(Math.log10(raw)), residual = raw / magnitude;
 const step = (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;
 lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
 const values = [];
 for (let v = lo; v <= hi + step / 2; v += step) values.push(Number(v.toPrecision(12)));
 return { min: lo, max: hi, step, ticks: values };
}
export function formatNumber(value) {
 return Math.abs(value) >= 1e6 || (Math.abs(value) > 0 && Math.abs(value) < 1e-3) ? value.toExponential(2) : Number(value.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: 3 });
}
// Returns a renderer-agnostic description of shapes so layout can be unit tested without a DOM.
export function layoutChart(data, type, width = 640, height = 380) {
 const shapes = [], texts = [];
 const legend = data.series.map((s, i) => ({ name: s.name, color: PALETTE[i % PALETTE.length] }));
 if (type === 'pie') {
  if (data.series.length !== 1) throw new Error('Pie charts use exactly one value column.');
  const values = data.series[0].values;
  if (values.some(v => v < 0)) throw new Error('Pie charts cannot show negative values.');
  const total = values.reduce((a, b) => a + b, 0);
  if (!(total > 0)) throw new Error('Pie chart values must add up to more than zero.');
  const cx = width * 0.34, cy = height / 2, r = Math.min(width * 0.3, height / 2 - 24);
  let angle = -Math.PI / 2;
  const slices = values.map((value, i) => {
   const sweep = value / total * Math.PI * 2, end = angle + sweep, color = PALETTE[i % PALETTE.length];
   const point = a => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
   const d = sweep >= Math.PI * 2 - 1e-9 ? `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z` : `M ${cx} ${cy} L ${point(angle)} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${point(end)} Z`;
   angle = end;
   return { label: data.labels[i], value, percent: value / total * 100, color, d };
  });
  for (const slice of slices) if (slice.value > 0) shapes.push({ kind: 'path', d: slice.d, fill: slice.color, title: `${slice.label}: ${formatNumber(slice.value)} (${slice.percent.toFixed(1)}%)` });
  return { type, width, height, shapes, texts, legend: slices.map(s => ({ name: `${s.label} · ${s.percent.toFixed(1)}%`, color: s.color })) };
 }
 if (!['bar', 'line'].includes(type)) throw new Error('Choose bar, line, or pie.');
 const all = data.series.flatMap(s => s.values), scale = niceScale(Math.min(...all), Math.max(...all));
 const left = 64, right = 16, top = 16, bottom = 64, plotW = width - left - right, plotH = height - top - bottom;
 const y = v => top + plotH - (v - scale.min) / (scale.max - scale.min) * plotH;
 for (const tick of scale.ticks) {
  shapes.push({ kind: 'line', x1: left, x2: width - right, y1: y(tick), y2: y(tick), stroke: tick === 0 ? '#5b635d' : '#dfe3dc' });
  texts.push({ x: left - 8, y: y(tick) + 4, anchor: 'end', text: formatNumber(tick) });
 }
 const n = data.labels.length, band = plotW / n, every = Math.ceil(n / Math.max(1, Math.floor(plotW / 56)));
 data.labels.forEach((label, i) => { if (i % every === 0) texts.push({ x: left + band * (i + 0.5), y: height - bottom + 18, anchor: 'middle', text: label.length > 12 ? label.slice(0, 11) + '…' : label }); });
 if (type === 'bar') {
  const groupW = band * 0.8, barW = groupW / data.series.length;
  data.series.forEach((series, s) => series.values.forEach((value, i) => {
   const x = left + band * i + band * 0.1 + barW * s, y0 = y(0), yv = y(value);
   shapes.push({ kind: 'rect', x, y: Math.min(y0, yv), width: Math.max(1, barW - 1), height: Math.max(value === 0 ? 0 : 1, Math.abs(y0 - yv)), fill: legend[s].color, title: `${series.name} · ${data.labels[i]}: ${formatNumber(value)}` });
  }));
 } else {
  data.series.forEach((series, s) => {
   const points = series.values.map((value, i) => [left + band * (i + 0.5), y(value)]);
   shapes.push({ kind: 'polyline', points: points.map(p => p.map(v => v.toFixed(2)).join(',')).join(' '), stroke: legend[s].color });
   points.forEach(([cx, cy], i) => shapes.push({ kind: 'circle', cx, cy, r: 4, fill: legend[s].color, title: `${series.name} · ${data.labels[i]}: ${formatNumber(series.values[i])}` }));
  });
 }
 return { type, width, height, shapes, texts, legend, scale };
}
