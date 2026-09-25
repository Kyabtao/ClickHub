import { toolForm } from '../../../components/ui/tool-form.js';
import { fromTimestamp, toTimestamp } from './logic.js';
export function mount(container, feedback) {
  toolForm(container, feedback, '<label class="field-label" for="mode">Operation</label><select id="mode"><option value="seconds">Unix seconds → date</option><option value="milliseconds">Unix milliseconds → date</option><option value="date">UTC ISO date → timestamp</option></select><label class="field-label" for="input">Timestamp or UTC ISO date</label><input id="input" type="text" placeholder="0 or 2026-09-25T12:00:00Z"><p>Date inputs must include seconds and end in Z (UTC). Negative timestamps are supported.</p>', () => {
    const mode = container.querySelector('#mode').value;
    const value = container.querySelector('#input').value.trim();
    return mode === 'date' ? toTimestamp(value) : fromTimestamp(value, mode);
  });
}
