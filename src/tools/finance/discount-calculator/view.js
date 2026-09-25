import { calculator } from '../../../components/ui/calculator.js';
import { display } from '../../../lib/validation/numbers.js';
import { discount } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "price", "label": "Original price", "value": 100}, {"id": "rate", "label": "Discount (%)", "value": 20}, {"id": "tax", "label": "Tax after discount (%)", "value": 0}], "Tax is applied after discount. Use one currency throughout; local tax rules may differ.", v => Object.entries(discount(v.price,v.rate,v.tax)).map(([k,n]) => `${k}: ${display(n)}`).join('\n'));
}
