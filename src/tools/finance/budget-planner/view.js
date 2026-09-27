import { toolForm } from '../../../components/ui/tool-form.js';
import { planBudget, describeBudget } from './logic.js';
export function mount(container, feedback) {
 toolForm(container, feedback, '<label class="field-label" for="budget-income">Monthly take-home income</label><input id="budget-income" type="text" inputmode="decimal" value="4000"><label class="field-label" for="input">Budget lines: Category, amount, need / want / saving</label><textarea id="input" spellcheck="false"></textarea><p>One line per item; the group defaults to “need”. Amounts use one currency with up to 2 decimals and are calculated in whole cents. The 50/30/20 split is a common rule of thumb, not financial advice. Nothing is saved; use Expense Tracker to record actual spending.</p>', () => describeBudget(planBudget(container.querySelector('#budget-income').value, container.querySelector('#input').value)));
 container.querySelector('#input').value = 'Rent, 1200, need\nGroceries, 450, need\nUtilities, 180, need\nDining out, 250, want\nSubscriptions, 60, want\nEmergency fund, 400, saving\nRetirement, 400, saving';
 container.querySelector('#run-tool').textContent = 'Plan budget';
}
