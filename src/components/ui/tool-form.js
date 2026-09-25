// All markup passed here is authored by tools, never derived from user input.
export function toolForm(container, feedback, markup, run) {
  container.innerHTML = `${markup}<div class="actions"><button id="run-tool" class="primary">Convert</button><button id="copy">Copy result</button></div><label class="field-label" for="result">Result</label><textarea id="result" readonly spellcheck="false"></textarea>`;
  const result = container.querySelector('#result');
  const button = container.querySelector('#run-tool');
  let revision = 0;
  button.onclick = async () => {
    const current = ++revision;
    result.value = '';
    feedback.textContent = 'Processing…';
    button.disabled = true;
    try {
      const value = await run();
      if (current === revision && result.isConnected) { result.value = value; feedback.textContent = 'Result ready.'; }
    } catch (error) {
      if (current === revision && result.isConnected) { result.value = ''; feedback.textContent = error.message; }
    } finally { button.disabled = false; }
  };
  const invalidate = () => { revision++; result.value = ''; feedback.textContent = ''; };
  container.oninput = invalidate;
  container.onchange = invalidate;
}
