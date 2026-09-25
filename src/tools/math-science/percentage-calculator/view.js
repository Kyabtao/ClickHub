import { calculator } from '../../../components/ui/calculator.js';
import { display } from '../../../lib/validation/numbers.js';
import { percentage } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "a", "label": "First value (percentage / part / starting value)", "value": 20}, {"id": "b", "label": "Second value (total / total / ending value)", "value": 100}, {"id": "mode", "label": "Operation", "options": [["of", "A percent of B"], ["ratio", "A as a percentage of B"], ["change", "Change from A to B"]]}], "Change uses the absolute starting value as denominator. Zero denominators are rejected.", v => display(percentage(v.a,v.b,v.mode)) + (v.mode === 'of' ? '' : '%'));
}
