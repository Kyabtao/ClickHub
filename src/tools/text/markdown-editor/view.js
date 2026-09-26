import { parseMarkdown, toHTML, markdownStats } from './logic.js';
const SAMPLE = '# Meeting notes\n\nWrite **Markdown** on the left and see a *live* preview.\n\n- [x] Draft agenda\n- [ ] Share `notes.md`\n\n> Raw HTML is shown as text, never run.\n\n[ClickHub on GitHub](https://github.com/Kyabtao/ClickHub)';
function inline(nodes) {
 const fragment = document.createDocumentFragment();
 for (const node of nodes) {
  if (node.type === 'text') fragment.append(document.createTextNode(node.value));
  else if (node.type === 'break') fragment.append(document.createElement('br'));
  else if (node.type === 'code') { const code = document.createElement('code'); code.textContent = node.value; fragment.append(code); }
  else if (node.type === 'link') { const link = document.createElement('a'); link.href = node.href; if (!node.href.startsWith('#')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; } link.append(inline(node.children)); fragment.append(link); }
  else { const element = document.createElement(node.type); element.append(inline(node.children)); fragment.append(element); }
 }
 return fragment;
}
function blocks(list) {
 const fragment = document.createDocumentFragment();
 for (const block of list) {
  let element;
  if (block.type === 'heading') { element = document.createElement(`h${block.level}`); element.append(inline(block.children)); }
  else if (block.type === 'paragraph') { element = document.createElement('p'); element.append(inline(block.children)); }
  else if (block.type === 'code') { element = document.createElement('pre'); const code = document.createElement('code'); code.textContent = block.value; element.append(code); }
  else if (block.type === 'rule') element = document.createElement('hr');
  else if (block.type === 'quote') { element = document.createElement('blockquote'); element.append(blocks(block.children)); }
  else {
   element = document.createElement(block.ordered ? 'ol' : 'ul');
   if (block.ordered && block.start !== 1) element.start = block.start;
   for (const item of block.items) {
    const li = document.createElement('li');
    if (item.checked !== null) { const box = document.createElement('input'); box.type = 'checkbox'; box.disabled = true; box.checked = item.checked; box.setAttribute('aria-label', item.checked ? 'Completed' : 'Not completed'); li.className = 'task-item'; li.append(box, ' '); }
    li.append(inline(item.children)); element.append(li);
   }
  }
  fragment.append(element);
 }
 return fragment;
}
export function mount(container, feedback) {
 let downloadURL = null;
 container.innerHTML = `<div class="markdown-grid"><div><label class="field-label" for="input">Markdown</label><textarea id="input" class="markdown-input" spellcheck="true"></textarea></div><div><span class="field-label" id="preview-label">Preview</span><div id="markdown-preview" class="markdown-preview" role="region" aria-labelledby="preview-label" tabindex="0"></div></div></div><p id="markdown-stats" role="status"></p><p>Supports headings, paragraphs, bold, italic, strikethrough, inline and fenced code, links (http, https, mailto, #), lists, task lists, quotes, and rules. Tables, images, footnotes, and raw HTML are not rendered. Text is not saved; download a copy to keep it.</p><div class="actions"><button id="download-md" class="primary">Download .md</button><button id="copy-html">Copy HTML</button><button id="copy-md">Copy Markdown</button></div><label class="field-label" for="result">Generated HTML</label><textarea id="result" readonly spellcheck="false"></textarea>`;
 const $ = selector => container.querySelector(selector);
 $('#input').value = SAMPLE;
 function render() {
  const source = $('#input').value;
  try {
   const ast = parseMarkdown(source);
   $('#markdown-preview').replaceChildren(blocks(ast));
   $('#result').value = toHTML(ast);
   const stats = markdownStats(source);
   $('#markdown-stats').textContent = `${stats.words} words · ${stats.characters} characters · about ${stats.minutes} min read`;
  } catch (error) { $('#markdown-preview').replaceChildren(); $('#result').value = ''; feedback.textContent = error.message; }
 }
 $('#input').oninput = () => { feedback.textContent = ''; render(); };
 $('#download-md').onclick = () => {
  if (downloadURL) URL.revokeObjectURL(downloadURL);
  downloadURL = URL.createObjectURL(new Blob([$('#input').value], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a'); link.href = downloadURL; link.download = 'clickhub-note.md'; link.click();
  feedback.textContent = 'Markdown downloaded.';
 };
 $('#copy-html').onclick = async () => {
  if (!$('#result').value) { feedback.textContent = 'Nothing to copy yet.'; return; }
  try { await navigator.clipboard.writeText($('#result').value); feedback.textContent = 'HTML copied to clipboard.'; }
  catch { feedback.textContent = 'Clipboard unavailable. Select the HTML and copy manually.'; }
 };
 $('#copy-md').onclick = async () => {
  if (!$('#input').value) { feedback.textContent = 'Nothing to copy yet.'; return; }
  try { await navigator.clipboard.writeText($('#input').value); feedback.textContent = 'Markdown copied to clipboard.'; }
  catch { feedback.textContent = 'Clipboard unavailable. Select the text and copy manually.'; }
 };
 render();
 return () => { if (downloadURL) URL.revokeObjectURL(downloadURL); };
}
