import { calculator } from '../../../components/ui/calculator.js';
import { display } from '../../../lib/validation/numbers.js';
import { statistics } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "input", "label": "Numbers separated by commas, spaces, or semicolons", "type": "textarea"}, {"id": "mode", "label": "Variance convention", "options": [["population", "Population"], ["sample", "Sample"]]}], "Uses JavaScript floating-point arithmetic. Sample variance needs at least two observations. Very large numeric ranges may exceed supported precision.", v => Object.entries(statistics(v.input,v.mode)).map(([key,value])=>`${key}: ${display(value)}`).join('\n'));
 container.querySelector('#run-tool').textContent = 'Run tool';
}
