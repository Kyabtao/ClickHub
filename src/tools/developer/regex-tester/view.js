import { describeMatches } from './logic.js';
const TIMEOUT_MS = 2000;
export function mount(container, feedback) {
 let worker = null, timer = null, active = true, revision = 0;
 container.innerHTML = '<label class="field-label" for="regex-pattern">Pattern (without surrounding slashes)</label><input id="regex-pattern" type="text" spellcheck="false" autocomplete="off" value="(\\w+)@(\\w+)\\.com"><label class="field-label" for="regex-flags">Flags (d, g, i, m, s, u, v, y)</label><input id="regex-flags" type="text" spellcheck="false" autocomplete="off" value="gi" maxlength="8"><label class="field-label" for="input">Test text</label><textarea id="input" spellcheck="false">Contact alice@example.com or BOB@test.com</textarea><label class="check-label"><input id="regex-replace-on" type="checkbox"> Preview replacement</label><label class="field-label" for="regex-replacement">Replacement ($1, $&lt;name&gt;, $&amp; supported)</label><input id="regex-replacement" type="text" spellcheck="false" autocomplete="off" value="[$1 at $2]"><p>Uses your browser’s JavaScript regular-expression engine in a background worker. Runs longer than 2 seconds are stopped to protect the page from catastrophic backtracking. Up to 200,000 characters and 1,000 listed matches.</p><div class="actions"><button id="run-tool" class="primary">Test pattern</button><button id="copy">Copy result</button></div><label class="field-label" for="result">Matches</label><textarea id="result" readonly spellcheck="false"></textarea><label class="field-label" for="regex-replaced">Replacement preview</label><textarea id="regex-replaced" readonly spellcheck="false"></textarea>';
 const $ = selector => container.querySelector(selector);
 const stop = () => { clearTimeout(timer); timer = null; worker?.terminate(); worker = null; $('#run-tool').disabled = false; };
 const clear = () => { revision++; stop(); $('#result').value = ''; $('#regex-replaced').value = ''; feedback.textContent = ''; };
 $('#run-tool').onclick = () => {
  clear();
  const current = revision;
  $('#run-tool').disabled = true; feedback.textContent = 'Testing…';
  try { worker = new Worker(new URL('../../../workers/regex.worker.js', import.meta.url), { type: 'module' }); }
  catch { $('#run-tool').disabled = false; feedback.textContent = 'Background workers are unavailable in this browser.'; return; }
  worker.onmessage = ({ data }) => {
   if (!active || current !== revision) return;
   stop();
   if (!data.ok) { feedback.textContent = data.message; return; }
   $('#result').value = describeMatches(data.result);
   if (data.result.replaced !== undefined) $('#regex-replaced').value = data.result.replaced;
   feedback.textContent = data.result.count ? 'Matches ready.' : 'No matches found.';
  };
  worker.onerror = event => { event.preventDefault?.(); if (active && current === revision) { stop(); feedback.textContent = 'The regular expression could not be tested.'; } };
  timer = setTimeout(() => { if (active && current === revision) { stop(); feedback.textContent = 'Stopped after 2 seconds. The pattern may backtrack excessively; simplify nested quantifiers or shorten the text.'; } }, TIMEOUT_MS);
  worker.postMessage({ pattern: $('#regex-pattern').value, flags: $('#regex-flags').value.trim(), text: $('#input').value, replacement: $('#regex-replace-on').checked ? $('#regex-replacement').value : null });
 };
 container.oninput = event => { if (!['result', 'regex-replaced'].includes(event.target.id)) clear(); };
 container.onchange = container.oninput;
 return () => { active = false; stop(); };
}
