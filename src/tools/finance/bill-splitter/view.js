import { calculator } from '../../../components/ui/calculator.js';
import { display } from '../../../lib/validation/numbers.js';
import { splitBill } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "amount", "label": "Bill amount (including any tax)", "value": 100}, {"id": "tip", "label": "Tip (%) applied to entered bill", "value": 10}, {"id": "people", "label": "Number of people", "value": 3}], "For currencies with two decimal places. Extra cents are assigned to the stated number of people so shares add to the rounded total.", v => (() => {const r=splitBill(v.amount,v.tip,v.people);return `Tip: ${display(r.tip)}\nTotal: ${r.total.toFixed(2)}\n${r.peoplePayingBase} people pay ${r.baseShare.toFixed(2)} each\n${r.peoplePayingExtraCent} people pay ${r.higherShare.toFixed(2)} each`;})());
 container.querySelector('#run-tool').textContent = 'Run tool';
}
