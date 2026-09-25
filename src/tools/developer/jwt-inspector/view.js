import { calculator } from '../../../components/ui/calculator.js';
import { inspectJWT } from './logic.js';
export function mount(container, feedback) {
 calculator(container, feedback, [{"id": "input", "label": "Three-part JWT", "type": "textarea"}], "Decoding is NOT verification. No signature, issuer, audience, or expiry validation. Never trust decoded claims as authentication.", v => JSON.stringify(inspectJWT(v.input),null,2));
 container.querySelector('#run-tool').textContent = 'Run tool';
}
