import { toolForm } from '../../../components/ui/tool-form.js';
import { planMeeting, describePlan, availableZones, DEFAULT_ZONES } from './logic.js';
import { localToday } from '../../../lib/storage/workspace.js';
export function mount(container, feedback) {
 const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
 toolForm(container, feedback, '<label class="field-label" for="tz-date">Meeting date</label><input id="tz-date" type="date"><label class="field-label" for="tz-time">Meeting time (24-hour)</label><input id="tz-time" type="time" value="09:00"><label class="field-label" for="tz-source">In time zone (IANA name)</label><input id="tz-source" type="text" list="tz-options" spellcheck="false" autocomplete="off"><datalist id="tz-options"></datalist><label class="field-label" for="input">Compare with these time zones (one per line)</label><textarea id="input" spellcheck="false"></textarea><p>Uses your browser’s time-zone database (Intl). Working hours are assumed to be 09:00–17:00, Monday–Friday, and ignore local holidays. Times that are skipped by a daylight-saving change are rejected; repeated times use the earlier occurrence.</p>', () => describePlan(planMeeting(container.querySelector('#tz-date').value, container.querySelector('#tz-time').value, container.querySelector('#tz-source').value, container.querySelector('#input').value.split('\n'))));
 const options = container.querySelector('#tz-options');
 for (const zone of availableZones()) { const option = document.createElement('option'); option.value = zone; options.append(option); }
 container.querySelector('#tz-date').value = localToday();
 container.querySelector('#tz-source').value = local;
 container.querySelector('#input').value = [...new Set([local, ...DEFAULT_ZONES])].join('\n');
 const button = container.querySelector('#run-tool');
 button.textContent = 'Compare times';
}
