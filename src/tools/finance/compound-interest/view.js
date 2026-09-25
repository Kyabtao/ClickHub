import { calculator } from '../../../components/ui/calculator.js';
import { display } from '../../../lib/validation/numbers.js';
import { compound } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "principal", "label": "Starting principal", "value": 1000}, {"id": "rate", "label": "Nominal annual interest (%)", "value": 5}, {"id": "years", "label": "Years", "value": 10}, {"id": "frequency", "label": "Compounding frequency", "options": [["1", "Yearly"], ["4", "Quarterly"], ["12", "Monthly"], ["365", "Daily (365)"]]}], "Estimate only. Fixed non-negative rate, no deposits, fees, tax, or inflation. Not financial advice.", v => Object.entries(compound(v.principal,v.rate,v.years,v.frequency)).map(([k,n]) => `${k}: ${display(n)}`).join('\n'));
}
