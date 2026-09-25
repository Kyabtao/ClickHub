import { calculator } from '../../../components/ui/calculator.js';
import { display } from '../../../lib/validation/numbers.js';
import { loan } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "principal", "label": "Loan amount", "value": 10000}, {"id": "rate", "label": "Nominal annual interest (%)", "value": 6}, {"id": "months", "label": "Term in whole months", "value": 12}], "Fixed-rate monthly payments at month end; no fees, tax, or prepayments. Estimates, not financial advice.", v => Object.entries(loan(v.principal,v.rate,v.months)).map(([k,n]) => `${k}: ${display(n)}`).join('\n'));
}
