// A deliberately small CommonMark-inspired subset. Raw HTML is never interpreted.
export const MAX_MARKDOWN = 200000;
const SAFE_LINK = /^(https?:\/\/|mailto:|#)/i;
export function safeHref(value) {
 const href = value.trim();
 return SAFE_LINK.test(href) ? href : null;
}
export function parseInline(text) {
 const nodes = [];
 let buffer = '';
 const flush = () => { if (buffer) { nodes.push({ type: 'text', value: buffer }); buffer = ''; } };
 let i = 0;
 while (i < text.length) {
  const rest = text.slice(i);
  if (rest[0] === '\\' && /[\\`*_[\]()#+\-.!>~]/.test(rest[1] || '')) { buffer += rest[1]; i += 2; continue; }
  let m;
  if ((m = /^(`+)([\s\S]*?[^`])\1(?!`)/.exec(rest))) { flush(); nodes.push({ type: 'code', value: m[2].replace(/^ (.+) $/, '$1') }); i += m[0].length; continue; }
  if ((m = /^\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(rest))) {
   const href = safeHref(m[2]);
   flush();
   nodes.push(href ? { type: 'link', href, children: parseInline(m[1]) } : { type: 'text', value: m[1] });
   i += m[0].length; continue;
  }
  if ((m = /^(\*\*|__)(?=\S)([\s\S]*?\S)\1/.exec(rest))) { flush(); nodes.push({ type: 'strong', children: parseInline(m[2]) }); i += m[0].length; continue; }
  if ((m = /^~~(?=\S)([\s\S]*?\S)~~/.exec(rest))) { flush(); nodes.push({ type: 'del', children: parseInline(m[1]) }); i += m[0].length; continue; }
  if ((m = /^(\*|_)(?=\S)([\s\S]*?\S)\1(?!\1)/.exec(rest)) && !(m[1] === '_' && /\w/.test(text[i - 1] || ''))) { flush(); nodes.push({ type: 'em', children: parseInline(m[2]) }); i += m[0].length; continue; }
  if ((m = /^ {2,}\n/.exec(rest)) || (m = /^\\\n/.exec(rest))) { flush(); nodes.push({ type: 'break' }); i += m[0].length; continue; }
  buffer += rest[0]; i++;
 }
 flush();
 return nodes;
}
const HEADING = /^(#{1,6})\s+(.*?)(?:\s+#+\s*)?$/, FENCE = /^(```|~~~)\s*([\w+-]*)\s*$/, RULE = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const BULLET = /^\s{0,3}([-*+])\s+(.*)$/, ORDERED = /^\s{0,3}(\d{1,9})[.)]\s+(.*)$/, QUOTE = /^\s{0,3}>\s?(.*)$/, TASK = /^\[([ xX])\]\s+(.*)$/;
function startsBlock(line) { return HEADING.test(line) || FENCE.test(line) || RULE.test(line) || BULLET.test(line) || ORDERED.test(line) || QUOTE.test(line); }
function parseLines(lines) {
 const blocks = [];
 let i = 0;
 while (i < lines.length) {
  const line = lines[i];
  if (!line.trim()) { i++; continue; }
  let m;
  if ((m = FENCE.exec(line))) {
   const body = []; i++;
   while (i < lines.length && !lines[i].startsWith(m[1])) body.push(lines[i++]);
   i++;
   blocks.push({ type: 'code', language: m[2], value: body.join('\n') });
   continue;
  }
  if ((m = HEADING.exec(line))) { blocks.push({ type: 'heading', level: m[1].length, children: parseInline(m[2]) }); i++; continue; }
  if (RULE.test(line)) { blocks.push({ type: 'rule' }); i++; continue; }
  if (QUOTE.test(line)) {
   const inner = [];
   while (i < lines.length && lines[i].trim() && (m = QUOTE.exec(lines[i]))) { inner.push(m[1]); i++; }
   blocks.push({ type: 'quote', children: parseLines(inner) });
   continue;
  }
  const bullet = BULLET.test(line), ordered = !bullet && ORDERED.test(line);
  if (bullet || ordered) {
   const pattern = bullet ? BULLET : ORDERED, items = [];
   const start = ordered ? Number(ORDERED.exec(line)[1]) : 1;
   while (i < lines.length && (m = pattern.exec(lines[i]))) {
    let text = bullet ? m[2] : m[2];
    i++;
    while (i < lines.length && lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && !BULLET.test(lines[i]) && !ORDERED.test(lines[i])) text += '\n' + lines[i++].trim();
    const task = TASK.exec(text);
    items.push(task ? { checked: task[1] !== ' ', children: parseInline(task[2]) } : { checked: null, children: parseInline(text) });
   }
   blocks.push({ type: 'list', ordered, start, items });
   continue;
  }
  const paragraph = [line.replace(/^\s+/, '')]; i++;
  while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) paragraph.push(lines[i++].replace(/^\s+/, ''));
  blocks.push({ type: 'paragraph', children: parseInline(paragraph.join('\n')) });
 }
 return blocks;
}
export function parseMarkdown(source) {
 if (typeof source !== 'string') throw new Error('Markdown text is required.');
 if (source.length > MAX_MARKDOWN) throw new Error(`Markdown limit: ${MAX_MARKDOWN.toLocaleString('en-US')} characters.`);
 return parseLines(source.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n'));
}
const escapeHTML = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function inlineHTML(nodes) {
 return nodes.map(node => {
  if (node.type === 'text') return escapeHTML(node.value);
  if (node.type === 'code') return `<code>${escapeHTML(node.value)}</code>`;
  if (node.type === 'break') return '<br>';
  if (node.type === 'link') return `<a href="${escapeHTML(node.href)}">${inlineHTML(node.children)}</a>`;
  return `<${node.type}>${inlineHTML(node.children)}</${node.type}>`;
 }).join('');
}
export function toHTML(blocks) {
 return blocks.map(block => {
  if (block.type === 'heading') return `<h${block.level}>${inlineHTML(block.children)}</h${block.level}>`;
  if (block.type === 'paragraph') return `<p>${inlineHTML(block.children)}</p>`;
  if (block.type === 'code') return `<pre><code${block.language ? ` class="language-${escapeHTML(block.language)}"` : ''}>${escapeHTML(block.value)}</code></pre>`;
  if (block.type === 'rule') return '<hr>';
  if (block.type === 'quote') return `<blockquote>\n${toHTML(block.children)}\n</blockquote>`;
  const tag = block.ordered ? 'ol' : 'ul', start = block.ordered && block.start !== 1 ? ` start="${block.start}"` : '';
  return `<${tag}${start}>\n${block.items.map(item => `<li>${item.checked === null ? '' : `<input type="checkbox" disabled${item.checked ? ' checked' : ''}> `}${inlineHTML(item.children)}</li>`).join('\n')}\n</${tag}>`;
 }).join('\n');
}
export function markdownStats(source) {
 const words = source.trim() ? source.trim().split(/\s+/).length : 0;
 return { words, characters: source.length, minutes: Math.max(words ? 1 : 0, Math.round(words / 200)) };
}
