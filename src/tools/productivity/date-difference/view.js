import { calculator } from '../../../components/ui/calculator.js';
import { dateDifference } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "start", "label": "Start date (YYYY-MM-DD)", "type": "date", "value": "2026-01-01"}, {"id": "end", "label": "End date (YYYY-MM-DD)", "type": "date", "value": "2026-01-08"}, {"id": "inclusive", "label": "Counting convention", "options": [["no", "Elapsed days (end minus start)"], ["yes", "Include both dates"]]}], "Calendar-day calculation in UTC avoids daylight-saving shifts. Does not exclude holidays or weekends.", v => JSON.stringify(dateDifference(v.start,v.end,v.inclusive),null,2));
 container.querySelector('#run-tool').textContent = 'Run tool';
}
