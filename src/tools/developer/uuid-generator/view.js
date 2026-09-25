import { toolForm } from '../../../components/ui/tool-form.js';
import { generateUUIDs } from './logic.js';
export function mount(container, feedback) {
  toolForm(container, feedback, '<label class="field-label" for="count">Number of UUIDs (1–500)</label><input id="count" type="number" value="1" min="1" max="500"><p>Version 4 UUIDs generated with browser cryptography.</p>', () => generateUUIDs(Number(container.querySelector('#count').value)));
  const button = container.querySelector('#run-tool');
  button.textContent = 'Generate UUIDs';
  button.click();
}
