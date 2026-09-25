import { calculator } from '../../../components/ui/calculator.js';
import { convertCSV } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "input", "label": "CSV or JSON row arrays", "type": "textarea"}, {"id": "mode", "label": "Convert to", "options": [["json", "JSON rows"], ["csv", "CSV"]]}], "Comma-separated CSV with quoted fields. Headers stay as the first row; all values are strings. Spreadsheet formulas are preserved, not sanitized\u2014review untrusted CSV before opening in a spreadsheet.", v => convertCSV(v.input,v.mode));
 container.querySelector('#run-tool').textContent = 'Run tool';
}
