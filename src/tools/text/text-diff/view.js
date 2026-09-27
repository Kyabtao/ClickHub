import { diffLines, unifiedText } from './logic.js';
const MAX_RENDERED = 2000;
export function mount(container, feedback) {
 container.innerHTML = '<div class="unit-pair"><div><label class="field-label" for="diff-before">Original text</label><textarea id="diff-before" spellcheck="false"></textarea></div><div><label class="field-label" for="diff-after">Changed text</label><textarea id="diff-after" spellcheck="false"></textarea></div></div><label class="check-label"><input id="diff-whitespace" type="checkbox"> Ignore leading, trailing, and repeated whitespace</label><label class="check-label"><input id="diff-case" type="checkbox"> Ignore letter case</label><p>Line-by-line comparison on your device. Up to 5,000 lines per side. Changed lines appear as a removal followed by an addition; character-level highlights and moved-block detection are not included.</p><div class="actions"><button id="run-tool" class="primary">Compare</button><button id="copy">Copy diff</button></div><p id="diff-summary" role="status"></p><div id="diff-view" class="diff-view" role="region" aria-label="Line differences" tabindex="0" hidden></div><label class="field-label" for="result">Unified diff text</label><textarea id="result" readonly spellcheck="false"></textarea>';
 const $ = selector => container.querySelector(selector);
 const clear = () => { $('#result').value = ''; $('#diff-summary').textContent = ''; $('#diff-view').replaceChildren(); $('#diff-view').hidden = true; feedback.textContent = ''; };
 $('#run-tool').onclick = () => {
  clear();
  try {
   const result = diffLines($('#diff-before').value, $('#diff-after').value, { ignoreWhitespace: $('#diff-whitespace').checked, ignoreCase: $('#diff-case').checked });
   $('#result').value = unifiedText(result);
   $('#diff-summary').textContent = result.identical ? 'No line differences found.' : `${result.added} added · ${result.removed} removed · ${result.unchanged} unchanged lines`;
   const list = document.createElement('ol'); list.className = 'diff-lines';
   for (const op of result.ops.slice(0, MAX_RENDERED)) {
    const item = document.createElement('li'); item.className = `diff-${op.type}`;
    const marker = document.createElement('span'); marker.className = 'diff-marker'; marker.textContent = op.type === 'add' ? '+' : op.type === 'remove' ? '−' : ' ';
    const label = document.createElement('span'); label.className = 'sr-only'; label.textContent = op.type === 'add' ? 'Added: ' : op.type === 'remove' ? 'Removed: ' : 'Unchanged: ';
    const number = document.createElement('span'); number.className = 'diff-number'; number.textContent = String(op.newLine ?? op.oldLine); number.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span'); text.className = 'diff-text'; text.textContent = op.text || ' ';
    marker.setAttribute('aria-hidden', 'true'); item.append(number, marker, label, text); list.append(item);
   }
   $('#diff-view').append(list); $('#diff-view').hidden = !result.ops.length;
   feedback.textContent = result.ops.length > MAX_RENDERED ? `Showing the first ${MAX_RENDERED} lines; the full diff is in the text box.` : 'Comparison ready.';
  } catch (error) { feedback.textContent = error.message; }
 };
 container.oninput = event => { if (event.target.id !== 'result') clear(); };
 container.onchange = container.oninput;
}
