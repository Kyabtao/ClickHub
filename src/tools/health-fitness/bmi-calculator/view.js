import { calculator } from '../../../components/ui/calculator.js';
import { display } from '../../../lib/validation/numbers.js';
import { bmi } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "weight", "label": "Weight (kg)", "value": 70}, {"id": "height", "label": "Height (cm)", "value": 175}], "General information, not medical advice. Adult screening only, not for children or pregnancy. BMI does not account for body composition or all population differences.", v => (() => { const r=bmi(v.weight,v.height); return `BMI: ${display(r.value)}\nAdult reference category: ${r.category}`; })());
}
