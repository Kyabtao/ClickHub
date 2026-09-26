export const MAX_DIFF_LINES = 5000;
export const MAX_DIFF_CELLS = 4000000;
function splitLines(value) {
 if (typeof value !== 'string') throw new Error('Text is required.');
 if (value === '') return [];
 const lines = value.replace(/\r\n?/g, '\n').split('\n');
 if (lines.at(-1) === '') lines.pop();
 return lines;
}
// Line-based LCS diff. Common prefixes/suffixes are trimmed before the quadratic step.
export function diffLines(before, after, options = {}) {
 const a = splitLines(before), b = splitLines(after);
 if (a.length > MAX_DIFF_LINES || b.length > MAX_DIFF_LINES) throw new Error(`Each text is limited to ${MAX_DIFF_LINES.toLocaleString('en-US')} lines.`);
 const key = line => {
  let value = line;
  if (options.ignoreWhitespace) value = value.trim().replace(/\s+/g, ' ');
  if (options.ignoreCase) value = value.toLowerCase();
  return value;
 };
 const ka = a.map(key), kb = b.map(key);
 let start = 0;
 while (start < a.length && start < b.length && ka[start] === kb[start]) start++;
 let endA = a.length, endB = b.length;
 while (endA > start && endB > start && ka[endA - 1] === kb[endB - 1]) { endA--; endB--; }
 const n = endA - start, m = endB - start;
 if (n * m > MAX_DIFF_CELLS) throw new Error('These texts differ too much to compare in the browser. Compare smaller sections.');
 const width = m + 1, table = new Uint32Array((n + 1) * width);
 for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
  table[i * width + j] = ka[start + i] === kb[start + j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
 }
 const ops = [];
 const equal = (i, j) => ops.push({ type: 'equal', text: b[j], oldLine: i + 1, newLine: j + 1 });
 for (let i = 0; i < start; i++) equal(i, i);
 let i = 0, j = 0;
 while (i < n || j < m) {
  if (i < n && j < m && ka[start + i] === kb[start + j]) { equal(start + i, start + j); i++; j++; }
  else if (i < n && (j === m || table[(i + 1) * width + j] >= table[i * width + j + 1])) { ops.push({ type: 'remove', text: a[start + i], oldLine: start + i + 1, newLine: null }); i++; }
  else { ops.push({ type: 'add', text: b[start + j], oldLine: null, newLine: start + j + 1 }); j++; }
 }
 for (let k = 0; k < a.length - endA; k++) equal(endA + k, endB + k);
 const added = ops.filter(op => op.type === 'add').length, removed = ops.filter(op => op.type === 'remove').length;
 return { ops, added, removed, unchanged: ops.length - added - removed, identical: added === 0 && removed === 0 };
}
export function unifiedText(result) {
 return result.ops.map(op => `${op.type === 'add' ? '+' : op.type === 'remove' ? '-' : ' '} ${op.text}`).join('\n');
}
