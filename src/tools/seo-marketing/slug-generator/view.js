import { calculator } from '../../../components/ui/calculator.js';
import { slug } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "input", "label": "Title or phrase", "type": "text", "value": "Hello, ClickHub!"}, {"id": "mode", "label": "Character mode", "options": [["ascii", "ASCII letters and digits"], ["unicode", "Unicode letters and digits"]]}], "Normalizes accents and separators. ASCII mode removes non-Latin characters rather than transliterating them. Review output for your language.", v => slug(v.input,v.mode));
 container.querySelector('#run-tool').textContent = 'Run tool';
}
