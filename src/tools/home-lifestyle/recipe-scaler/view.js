import { calculator } from '../../../components/ui/calculator.js';
import { display } from '../../../lib/validation/numbers.js';
import { scaleRecipe } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "input", "label": "Ingredients: one decimal quantity + ingredient per line", "type": "textarea"}, {"id": "original", "label": "Original servings", "value": 2}, {"id": "target", "label": "Target servings", "value": 4}], "Example: 200 g flour. Use decimals (0.5), not fractions (1/2). Units are preserved, not converted; cooking times and seasoning may not scale linearly.", v => scaleRecipe(v.input,v.original,v.target).map(r=>`${display(r.quantity)} ${r.ingredient}`).join('\n'));
 container.querySelector('#run-tool').textContent = 'Run tool';
}
